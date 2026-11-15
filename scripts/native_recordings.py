"""Use real native-speaker recordings from Wikimedia Commons where they exist.

Wikimedia Commons holds thousands of Persian word recordings made by native
speakers (most through the Lingua Libre project), under free licences: CC0, or
CC BY-SA with credit to the speaker. For every single word in the app that has
one, this downloads it, trims the silence, evens out the volume, checks with
Whisper that it really is that word, and saves it as docs/audio/<id>.mp3 —
replacing the synthetic voice for that word.

Speakers are tried in order: Diako1971's recordings ("native Persian speaker
from Tehran"), other older Commons recordings, then the Lingua Libre speakers who
record only in Persian. Speakers who mostly record other languages are left out.

The speaker and licence of every recording used are written to
scripts/audio-sources.json and docs/audio-credits.html; the voice scripts
(make_audio.py) leave these words alone.

  python scripts/native_recordings.py [--check deepdml/faster-whisper-large-v3-turbo-ct2]

Needs ffmpeg; --check needs faster-whisper.
"""

import argparse
import difflib
import hashlib
import html
import json
import re
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "audio"
SOURCES = ROOT / "scripts" / "audio-sources.json"
CREDITS = ROOT / "docs" / "audio-credits.html"
UA = {"User-Agent": "GolestanLearningApp/1.0 (educational, low-volume)"}
# Wikimedia throttles busy shared addresses hard; every reply is kept here so a
# rerun never asks twice (set with --cache).
CACHE: Path | None = None

# who to prefer when a word has several recordings; anyone else is left out
SPEAKERS = ["Diako1971", "commons", "Mazanin (مازنین)", "Afsham23", "Darafsh"]


class Throttled(Exception):
    """Wikimedia asked us to wait longer than we're willing to, this run."""


def get(url: str, binary: bool = False, patience: float = 3600):
    cached = CACHE / hashlib.sha1(url.encode()).hexdigest() if CACHE else None
    if cached and cached.exists():
        data = cached.read_bytes()
        return data if binary else json.loads(data)
    waited = 0.0
    for _ in range(60):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
                data = r.read()
                if cached:
                    cached.write_bytes(data)
                return data if binary else json.loads(data)
        except urllib.error.HTTPError as err:
            if err.code in (429, 502, 503):
                wait = float(err.headers.get("Retry-After") or 20) + 1
                if waited + wait > patience:
                    raise Throttled(url) from err
                time.sleep(wait)
                waited += wait
                continue
            raise
        except urllib.error.URLError:
            time.sleep(10)
    raise RuntimeError(f"Wikimedia kept refusing: {url}")


def api(**params):
    return get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**params, "format": "json"}))


def category_files(cat: str) -> list[str]:
    titles, cont = [], {}
    while True:
        d = api(action="query", list="categorymembers", cmtitle=cat, cmtype="file", cmlimit="500", **cont)
        titles += [m["title"] for m in d["query"]["categorymembers"]]
        if "continue" not in d:
            return titles
        cont = d["continue"]
        time.sleep(1)


def norm(s: str) -> str:
    s = re.sub(r"[ً-ْٰـ«»!?؟.,،:;…\"'()\[\]]", "", s)
    s = s.replace("ي", "ی").replace("ك", "ک").replace("ة", "ه").replace("‌", " ").replace("أ", "ا").replace("إ", "ا")
    return " ".join(s.split())


def candidates_by_word() -> dict[str, list[tuple[str, str]]]:
    found: dict[str, list[tuple[str, str]]] = {}
    for t in category_files("Category:Lingua Libre pronunciation-fas"):
        m = re.match(r"File:LL-Q9168 \(fas\)-(.+?)-(.+)\.(wav|ogg|mp3|flac)$", t)
        if m and m.group(1) in SPEAKERS:
            found.setdefault(norm(m.group(2)), []).append((t, m.group(1)))
    for t in category_files("Category:Persian pronunciation"):
        m = re.match(r"File:Fa-(.+)\.(ogg|wav|mp3|oga|flac)$", t)
        if m:
            found.setdefault(norm(re.sub(r"\(\d+\)|\d+", "", m.group(1))), []).append((t, "commons"))
    return found


def file_info(titles: list[str]) -> dict[str, dict]:
    info = {}
    for k in range(0, len(titles), 50):
        d = api(action="query", prop="imageinfo", iiprop="url|extmetadata", titles="|".join(titles[k : k + 50]))
        for p in d["query"]["pages"].values():
            ii = (p.get("imageinfo") or [{}])[0]
            md = ii.get("extmetadata", {})
            text = lambda key: re.sub(r"<[^>]+>", " ", (md.get(key) or {}).get("value", "")).strip()
            artist = " ".join(text("Artist").split())
            speaker = re.search(r"Speaker:\s*(\S+)", artist)
            info[p["title"]] = {
                "url": ii.get("url"),
                "page": ii.get("descriptionurl"),
                "license": text("LicenseShortName"),
                "speaker": speaker.group(1) if speaker else (artist or "Wikimedia Commons contributor"),
            }
        time.sleep(1)
    return info


def prepare(raw: bytes, path: Path) -> None:
    """Trim the silence at both ends, even out the loudness, and save a small mp3."""
    with tempfile.NamedTemporaryFile(suffix=".in") as src:
        src.write(raw)
        src.flush()
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", src.name, "-af",
             "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,"
             "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse,"
             "loudnorm=I=-18:TP=-2:LRA=11,adelay=120:all=1,apad=pad_dur=0.2",
             "-ac", "1", "-ar", "24000", "-b:a", "48k", str(path)],
            check=True,
        )


class Check:
    def __init__(self, model: str):
        from faster_whisper import WhisperModel

        self.model = WhisperModel(model, device="cpu", compute_type="int8", cpu_threads=4)

    def heard(self, path: Path) -> str:
        import numpy as np

        # decode with ffmpeg ourselves: faster-whisper's own decoder depends on a PyAV version that isn't always installed
        raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
        pcm = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        segs, _ = self.model.transcribe(pcm, language="fa", beam_size=5, without_timestamps=True, condition_on_previous_text=False)
        return "".join(s.text for s in segs).strip()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", default="", help="Whisper model that confirms each recording is the right word")
    ap.add_argument("--min-match", type=float, default=0.5)
    ap.add_argument("--cache", default="", help="folder that keeps every Wikimedia reply, so reruns are quick")
    ap.add_argument("--minutes", type=float, default=0, help="stop fetching after this long and save what's done (0 = no limit)")
    ap.add_argument("--pace", type=float, default=20, help="seconds between downloads, to stay under Wikimedia's limits")
    args = ap.parse_args()
    deadline = time.monotonic() + args.minutes * 60 if args.minutes else float("inf")
    global CACHE
    if args.cache:
        CACHE = Path(args.cache)
        CACHE.mkdir(parents=True, exist_ok=True)

    items = json.loads((ROOT / "scripts" / "audio-items.json").read_text(encoding="utf8"))
    found = candidates_by_word()
    wanted = {i["id"]: i for i in items if norm(i["fa"]) in found}
    titles = sorted({t for i in wanted.values() for t, _ in found[norm(i["fa"])]})
    info = file_info(titles)
    check = Check(args.check) if args.check else None
    rank = lambda c: SPEAKERS.index("Diako1971") if info.get(c[0], {}).get("speaker") == "Diako1971" else SPEAKERS.index(c[1])

    # earlier runs' choices stay; this run adds the words still missing
    sources = json.loads(SOURCES.read_text(encoding="utf8")) if SOURCES.exists() else {}
    # the family's own recordings (scripts/add_family_recordings.py) always stay
    sources = {k: v for k, v in sources.items() if (v.get("family") or k in wanted) and (OUT / f"{k}.mp3").exists()}
    throttled = 0
    for n, (iid, item) in enumerate(sorted(wanted.items()), 1):
        if iid in sources:  # already a native or family recording
            continue
        if time.monotonic() > deadline:
            print("time's up for this run; saving what's done", flush=True)
            break
        for title, _who in sorted(found[norm(item["fa"])], key=rank):
            meta = info.get(title)
            if not meta or not meta.get("url") or not re.match(r"CC0|CC BY(-SA)? [34]\.0|Public domain", meta["license"]):
                continue
            path = OUT / f"{iid}.mp3"
            tmp = OUT / f"{iid}.native.mp3"
            fresh = not (CACHE and (CACHE / hashlib.sha1(meta["url"].encode()).hexdigest()).exists())
            try:
                # wait out Wikimedia's pauses as long as this run has time for
                raw = get(meta["url"], binary=True, patience=max(0.0, deadline - time.monotonic()))
            except Throttled:
                throttled += 1
                print(f"  later: {title} (no time left to wait for Wikimedia)", flush=True)
                break
            if fresh:
                time.sleep(args.pace)
            prepare(raw, tmp)
            if check:
                heard = check.heard(tmp)
                match = difflib.SequenceMatcher(None, norm(item["fa"]).replace(" ", ""), norm(heard).replace(" ", "")).ratio()
                if match < args.min_match:
                    print(f"  skip {title}: heard {heard!r}", flush=True)
                    tmp.unlink()
                    continue
            tmp.replace(path)
            sources[iid] = {"fa": item["fa"], "file": title.removeprefix("File:"), "page": meta["page"], "speaker": meta["speaker"], "license": meta["license"]}
            break
        if n % 25 == 0:
            print(f"{n}/{len(wanted)}", flush=True)
        time.sleep(0.5)

    SOURCES.write_text(json.dumps(dict(sorted(sources.items())), ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    write_credits(sources)
    index = json.loads((OUT / "index.json").read_text(encoding="utf8"))
    index["files"] = {i: hashlib.sha1((OUT / f"{i}.mp3").read_bytes()).hexdigest()[:8] for i in index["ids"]}
    index["native"] = sorted(sources)
    (OUT / "index.json").write_text(json.dumps(index, separators=(",", ":")) + "\n", encoding="utf8")
    left = len(wanted) - len(sources)
    print(f"done: {len(sources)} words now use a native speaker's recording ({throttled} put off by throttling; run again to fetch them)" if throttled else f"done: {len(sources)} words now use a native speaker's recording ({left} have none that passed the check)")


def write_credits(sources: dict) -> None:
    rows = "\n".join(
        f"<tr><td lang='fa' dir='rtl'>{html.escape(s['fa'])}</td><td>{html.escape(s['speaker'])}</td>"
        f"<td>{html.escape(s['license'])}</td><td>"
        + (f"<a href='{html.escape(s['page'])}'>source</a>" if s.get("page") else "")
        + "</td></tr>"
        for s in sorted(sources.values(), key=lambda s: (not s.get("family"), s["fa"]))
    )
    family = sum(1 for s in sources.values() if s.get("family"))
    commons = len(sources) - family
    CREDITS.write_text(
        f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Recording credits · Golestan</title>
<style>body{{font-family:system-ui,sans-serif;margin:16px;max-width:760px;color:#2c2418;background:#f6efe1}}
table{{border-collapse:collapse;width:100%}}td,th{{padding:6px 8px;border-bottom:1px solid #e2d6bd;text-align:left}}
td[lang=fa]{{font-size:1.2rem;text-align:right}}a{{color:#1f6f6a}}</style></head><body>
<p><a href="./#/more">← Back to Golestan</a></p>
<h1>Recording credits</h1>
<p>{len(sources)} words and lines in Golestan are said by native Persian speakers: {family} recorded
by the family, and {commons} from recordings shared on
<a href="https://commons.wikimedia.org/">Wikimedia Commons</a> — most through the
<a href="https://lingualibre.org/">Lingua Libre</a> project. Thank you to every speaker.
The recordings were trimmed and their volume evened out; recordings under CC BY-SA keep that licence.
The other words and sentences are read by the open Persian voice
<a href="https://huggingface.co/rhasspy/piper-voices/tree/main/fa/fa_IR/ganji">ganji</a> (Piper, dataset CC0),
following each lesson's checked pronunciation.</p>
<table><thead><tr><th>Word</th><th>Speaker</th><th>Licence</th><th></th></tr></thead><tbody>
{rows}
</tbody></table></body></html>
""",
        encoding="utf8",
    )


if __name__ == "__main__":
    main()

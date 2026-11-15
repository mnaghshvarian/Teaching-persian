"""Make the garden's Persian recordings.

Uses the open-source Piper voice "fa_IR-ganji-medium" (trained on a CC0
dataset). Each item is tried two ways: the voice's own reading of the Persian
script, and a reading driven by the hand-checked transliteration (which knows
the short vowels and everyday Tehran forms the script leaves out). Whisper
listens to each and the clearest is kept.

  node scripts/collect-audio.mjs
  python scripts/make_audio.py path/to/fa_IR-ganji-medium.onnx --judge deepdml/faster-whisper-large-v3-turbo-ct2
  # remake only some items, with more takes:  --only w-1234abcd,w-5678ef01 --takes 3

Needs: pip install piper-tts, and ffmpeg on the PATH.
Writes docs/audio/<id>.mp3 and docs/audio/index.json.
"""

import json
import re
import subprocess
import sys
import wave
from pathlib import Path

from piper import PiperVoice, SynthesisConfig

sys.path.insert(0, str(Path(__file__).resolve().parent))
from spoken import spoken_fa  # noqa: E402  (blessing marks → the words said)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "audio"

VOWELS = {"a", "ɑ", "e", "o", "u", "i"}

# Syllable that carries the stress (0 = first), for words that don't follow
# the usual Persian rule of stressing the last syllable: verbs with mi-/na-/be-,
# words ending in unstressed personal endings, and a few adverbs.
STRESS = {
    # mi- / na- / be- verbs stress the prefix
    "mikhâm": 0, "mishe": 0, "migiram": 0, "mibinametun": 0, "mimunam": 0, "mimunid": 0,
    "mirid": 0, "mikonam": 0, "mikone": 0, "mizani": 0, "midid": 0, "mikharamesh": 0,
    "mirasi": 0, "miguyam": 0, "miguyad": 0, "miâvarad": 0, "mikhandad": 0, "mikhâyd": 0,
    "nashodam": 0, "nakone": 0, "nabâshi": 0, "nabâshid": 0, "nadâre": 0, "nakon": 0,
    "begid": 0, "berid": 0, "bepichid": 0, "bekharam": 0, "benevisid": 0, "bekesham": 0,
    "bokhorid": 0, "beshid": 0, "beshin": 0, "biyâ": 0, "bedid": 0, "befarmâyid": 0,
    "befarmâ": 0, "bebakhshid": 0, "bekeshid": 0, "nemidunam": 0,
    # present and past forms
    "dârid": 0, "dâram": 0, "dâri": 0, "dâran": 0, "dâre": 0, "dâshte": 0, "hastam": 0, "hastim": 0,
    "baladam": 1, "baladid": 1, "umadam": 1, "umadid": 1, "umadi": 1, "fahmidam": 1,
    "shodam": 0, "shode": 0, "keshidid": 1, "keshidi": 1, "bâshe": 0,
    # personal endings and enclitics are unstressed
    "khubam": 0, "khube": 0, "khuban": 0, "chetore": 1, "chetori": 1, "ghashange": 1, "ghashangan": 1,
    "gerune": 1, "dure": 0, "nazdike": 1, "chiye": 0, "chande": 0, "manam": 0, "inam": 0, "ino": 0,
    "bâzam": 0, "pâsportam": 1, "chamedunam": 2, "saram": 0, "hâlam": 0, "hâlet": 0, "delam": 0, "delemun": 0,
    "shoghlet": 0, "khodet": 0, "azizam": 1, "montazeretim": 2, "forudgâhim": 2, "khoshbakhtam": 1,
    "khoshhâlam": 1, "khâram": 0, "kuchike": 1, "esmam": 1, "dastet": 0, "dastetun": 0, "ghorbunet": 1,
    # adverbs and little words stressed at the front
    "lotfan": 0, "hatman": 0, "vâghe'an": 0, "faghat": 0, "âre": 0, "bale": 0, "ya'ni": 0,
}

ENCLITICS = {"e", "ye", "st", "i", "am", "at", "ash", "ro", "o", "tun", "mun", "shun", "et", "esh", "emun", "etun"}

DIGRAPHS = [
    ("kh", ["x"]), ("gh", ["q", "1"]), ("sh", ["ʃ"]), ("ch", ["t", "ʃ"]), ("zh", ["ʒ"]),
]
SINGLE = {
    "â": ["ɑ"], "a": ["a"], "e": ["e"], "o": ["o"], "u": ["u"], "i": ["i"],
    "j": ["d", "ʒ"], "y": ["j"], "g": ["ɡ"], "'": ["ʔ"], "w": ["w"],
    **{c: [c] for c in "bdfhklmnprstvz"},
}


def word_phonemes(word: str) -> list[str]:
    out: list[str] = []
    i = 0
    while i < len(word):
        for dg, ph in DIGRAPHS:
            if word.startswith(dg, i):
                out += ph
                i += len(dg)
                break
        else:
            ch = word[i]
            if ch in SINGLE:
                ph = SINGLE[ch]
                # doubled consonant (zorrat, hassâsiyat): one long consonant
                if out and len(ph) == 1 and ph[0] == out[-1] and ph[0] not in VOWELS:
                    out.append("ː")
                else:
                    out += ph
            i += 1
    return out


def stress_at(ph: list[str], syllable: int) -> list[str]:
    """Mark the stressed vowel. The mark goes right before the vowel, as in the
    espeak-ng phonemes the voices were trained on (salˈɑm, kˈetɑb) — a mark in
    front of a consonant is something the voice never saw, and it garbles words."""
    vowel_positions = [k for k, p in enumerate(ph) if p in VOWELS]
    if not vowel_positions:
        return ph
    syllable = max(0, min(syllable, len(vowel_positions) - 1))
    v = vowel_positions[syllable]
    return ph[:v] + ["ˈ"] + ph[v:]


def phonemes_for(say: str) -> list[str]:
    text = say.lower()
    text = re.sub(r"[«»\"“”]", "", text)
    text = text.replace("…", ",").replace("...", ",").replace(";", ",").replace("—", ",").replace("/", ",")
    tokens = re.findall(r"[a-zâ'\-]+|[,.?!]", text)
    out: list[str] = []
    for tok in tokens:
        if tok in {",", ".", "?", "!"}:
            if out and out[-1] == " ":
                out.pop()
            out.append(tok)
            out.append(" ")
            continue
        parts = [p for p in tok.split("-") if p]
        if not parts:
            continue
        # the last part that isn't an unstressed ending carries the stress
        stressed = max((k for k, p in enumerate(parts) if k == 0 or p not in ENCLITICS), default=0)
        word: list[str] = []
        for k, part in enumerate(parts):
            ph = word_phonemes(part)
            if k == stressed:
                ph = stress_at(ph, STRESS.get(part, 10_000))
            word += ph
        out += word + [" "]
    while out and out[-1] == " ":
        out.pop()
    if out and out[-1] not in {".", "?", "!"}:
        out.append(".")
    return out


NOISE = {"ˈ", "ˌ", "ː", " ", ".", ",", "?", "!", "‌"}


def own_reading(voice, fa: str) -> list[str]:
    """The voice's own reading of the Persian text (espeak-ng), exactly what it was trained on."""
    out: list[str] = []
    for sentence in voice.phonemize(fa):
        out += [p for p in sentence if p != "‌"] + [" "]
    while out and out[-1] == " ":
        out.pop()
    return out


def candidates(voice, item) -> list[tuple[str, list[str]]]:
    """Ways of saying an item: the voice's own reading of the Persian, and the
    checked transliteration (which knows the short vowels and everyday Tehran
    forms the script leaves out). The judge keeps whichever comes out clearest."""
    mine = phonemes_for(item["say"])
    theirs = own_reading(voice, spoken_fa(item["fa"], item["say"]))
    if not theirs or [p for p in theirs if p not in NOISE] == [p for p in mine if p not in NOISE]:
        return [("own", theirs or mine)]
    return [("own", theirs), ("translit", mine)]


def to_mp3(voice, audio, path: Path) -> None:
    pcm = (audio * 32767).clip(-32768, 32767).astype("int16").tobytes()
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(voice.config.sample_rate), "-ac", "1", "-i", "-",
         "-af", "adelay=120:all=1,apad=pad_dur=0.2", "-ac", "1", "-ar", "22050", "-b:a", "48k", str(path)],
        input=pcm,
        check=True,
    )


class Judge:
    """Optional: transcribe candidate takes with Whisper and keep the clearest."""

    def __init__(self, size: str):
        from faster_whisper import WhisperModel

        self.model = WhisperModel(size, device="cpu", compute_type="int8", cpu_threads=4)

    @staticmethod
    def norm(s: str) -> str:
        s = re.sub(r"[ً-ٰٟـ‌‍\s.,!?؟،«»:;…\-]", "", s)
        s = s.replace("ي", "ی").replace("ك", "ک").replace("ة", "ه")
        return re.sub(r"[۰-۹0-9]", "", s)

    def score(self, voice, audio, fa: str, beam: int = 1) -> tuple[float, str]:
        import difflib

        import numpy as np

        pcm = (audio * 32767).clip(-32768, 32767).astype("int16").tobytes()
        raw = subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-f", "s16le", "-ar", str(voice.config.sample_rate), "-ac", "1", "-i", "-",
             "-f", "s16le", "-ar", "16000", "-ac", "1", "-"],
            input=pcm, capture_output=True, check=True,
        ).stdout
        pcm16 = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        pcm16 = np.concatenate([np.zeros(3200, np.float32), pcm16, np.zeros(4800, np.float32)])
        segs, _ = self.model.transcribe(pcm16, language="fa", beam_size=beam, without_timestamps=True, condition_on_previous_text=False, max_new_tokens=min(120, 8 + 3 * len(fa)), vad_filter=False)
        heard = "".join(s.text for s in segs).strip()
        target = self.norm(fa)
        return difflib.SequenceMatcher(None, target, self.norm(heard)).ratio(), heard


def main() -> None:
    import argparse
    import hashlib

    ap = argparse.ArgumentParser()
    ap.add_argument("model")
    ap.add_argument("--takes", type=int, default=1, help="takes per way of saying it (keep the clearest)")
    ap.add_argument("--judge", default="", help="Whisper model that picks the clearest take, e.g. deepdml/faster-whisper-large-v3-turbo-ct2")
    ap.add_argument("--only-missing", action="store_true", help="keep existing recordings; make only new ones")
    ap.add_argument("--only", default="", help="comma-separated ids to remake")
    ap.add_argument("--force", action="store_true", help="with --only: replace even if the old recording scored higher")
    args = ap.parse_args()

    voice = PiperVoice.load(args.model)
    voice_name = Path(args.model).name.removesuffix(".onnx")
    config = SynthesisConfig(length_scale=1.12, noise_scale=0.6, noise_w_scale=0.7)
    judge = Judge(args.judge) if args.judge else None
    items = json.loads((ROOT / "scripts" / "audio-items.json").read_text(encoding="utf8"))
    only = set(filter(None, args.only.split(",")))
    OUT.mkdir(parents=True, exist_ok=True)
    known = set(voice.config.phoneme_id_map.keys())
    report_path = ROOT / "scripts" / "audio-report.json"
    old_report = {}
    if report_path.exists():
        old_report = {r["id"]: r for r in json.loads(report_path.read_text(encoding="utf8"))}
    sources_path = ROOT / "scripts" / "audio-sources.json"
    native = set(json.loads(sources_path.read_text(encoding="utf8"))) if sources_path.exists() else set()
    ids, report = [], []
    for n, item in enumerate(items, 1):
        path = OUT / f"{item['id']}.mp3"
        # a native speaker's recording (scripts/native_recordings.py) is never replaced by the synthetic voice
        keep = item["id"] in native or (args.only_missing and path.exists()) or (only and item["id"] not in only)
        if keep and path.exists():
            ids.append(item["id"])
            if item["id"] in old_report:
                report.append(old_report[item["id"]])
            continue
        best, best_score, best_heard, best_way = None, -1.0, "", ""
        for way, ph in candidates(voice, item):
            missing = [p for p in ph if p not in known]
            if missing:
                raise SystemExit(f"{item['say']}: unknown phonemes {missing}")
            ids_for_voice = voice.phonemes_to_ids(ph)
            for _ in range(max(1, args.takes)):
                audio = voice.phoneme_ids_to_audio(ids_for_voice, config)
                if not judge:
                    best, best_way = audio, way
                    break
                sc, heard = judge.score(voice, audio, spoken_fa(item["fa"], item["say"]))
                if sc > best_score:
                    best, best_score, best_heard, best_way = audio, sc, heard, way
                if sc >= 0.95:
                    break
            if not judge or best_score >= 0.95:
                break
        prev = old_report.get(item["id"])
        if judge and only and not args.force and path.exists() and prev and prev.get("score", -1) >= best_score:
            # remaking on request: keep the current recording unless the new one is clearer
            ids.append(item["id"])
            report.append(prev)
            continue
        to_mp3(voice, best, path)
        ids.append(item["id"])
        if judge:
            report.append({"id": item["id"], "fa": item["fa"], "way": best_way, "score": round(best_score, 2), "heard": best_heard})
        if n % 25 == 0:
            print(f"{n}/{len(items)}", flush=True)
            if report:
                report_path.write_text(json.dumps(report, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    # a short fingerprint of each recording goes in its address, so phones
    # fetch a remade recording instead of playing a saved old copy
    files = {i: hashlib.sha1((OUT / f"{i}.mp3").read_bytes()).hexdigest()[:8] for i in sorted(ids)}
    (OUT / "index.json").write_text(
        json.dumps({"voice": f"Piper {voice_name}", "ids": sorted(ids), "files": files, "native": sorted(native & set(ids))}, separators=(",", ":")) + "\n",
        encoding="utf8",
    )
    if report:
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
        print("mean clarity score:", round(sum(r["score"] for r in report) / len(report), 3))
    print(f"done: {len(ids)} recordings in docs/audio/")


if __name__ == "__main__":
    main()

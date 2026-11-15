"""Make the garden's Persian recordings with Microsoft Azure's neural Persian voice.

The open Piper voices learned Persian through espeak-ng, which puts the word
stress on the wrong syllable (LÍ-mu for لیمو) and guesses short vowels, and a
native speaker heard it. Azure's fa-IR neural voices are trained on native
speech with a proper Persian reader, so they say everyday words the way
Iranians do. The free tier (500,000 characters a month) covers the whole app,
about 37,000 characters.

  node scripts/collect-audio.mjs
  AZURE_SPEECH_KEY=... python scripts/make_audio_azure.py            # all recordings
  python scripts/make_audio_azure.py --only w-1234abcd,w-5678ef01   # just some
  python scripts/make_audio_azure.py --dry-run                       # print the requests

The key goes in the Ocp-Apim-Subscription-Key header. In the cloud session the
network proxy adds it, so AZURE_SPEECH_KEY can be left unset there.

Writes docs/audio/<id>.mp3 and docs/audio/index.json (with a fingerprint of
each recording, so phones fetch remade recordings instead of saved old ones).
Uses only the Python standard library.
"""

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "audio"

# The free tier allows 20 requests a minute for neural voices; stay under it.
MIN_GAP = 60 / 18


def ssml(text: str, voice: str, rate: str) -> str:
    return (
        "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='fa-IR'>"
        f"<voice name='{voice}'><prosody rate='{rate}'>{escape(text)}</prosody></voice></speak>"
    )


def spoken_text(item: dict) -> str:
    """What the voice reads: the Persian as written, with the guillemets and
    ellipses that only matter on the page tidied away."""
    text = item["fa"].replace("«", "").replace("»", "").replace("…", "، ")
    return " ".join(text.split())


def synthesize(region: str, key: str, body: str) -> bytes:
    req = urllib.request.Request(
        f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1",
        data=body.encode("utf-8"),
        method="POST",
        headers={
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
            "User-Agent": "golestan-audio",
        },
    )
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=60) as res:
                return res.read()
        except urllib.error.HTTPError as err:
            if err.code in (429, 500, 502, 503, 504) and attempt < 5:
                wait = float(err.headers.get("Retry-After") or 5 * (attempt + 1))
                print(f"  busy ({err.code}); waiting {wait:.0f}s", flush=True)
                time.sleep(wait)
                continue
            detail = err.read().decode("utf-8", "replace")[:300]
            raise SystemExit(f"Azure refused the request ({err.code}): {detail or err.reason}")
        except urllib.error.URLError as err:
            if attempt < 5:
                time.sleep(5 * (attempt + 1))
                continue
            raise SystemExit(f"Couldn't reach Azure: {err.reason}")
    raise SystemExit("Azure kept refusing; try again later.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="fa-IR-DilaraNeural", help="fa-IR-DilaraNeural (female) or fa-IR-FaridNeural (male)")
    ap.add_argument("--region", default="canadacentral")
    ap.add_argument("--rate", default="-8%", help="speaking rate, a little slower than normal for a learner")
    ap.add_argument("--only", default="", help="comma-separated ids to remake")
    ap.add_argument("--only-missing", action="store_true")
    ap.add_argument("--dry-run", action="store_true", help="print what would be sent, change nothing")
    args = ap.parse_args()

    key = os.environ.get("AZURE_SPEECH_KEY", "added-by-the-session-proxy")
    items = json.loads((ROOT / "scripts" / "audio-items.json").read_text(encoding="utf8"))
    only = set(filter(None, args.only.split(",")))
    todo = [
        it for it in items
        if (not only or it["id"] in only) and not (args.only_missing and (OUT / f"{it['id']}.mp3").exists())
    ]
    print(f"{len(todo)} of {len(items)} recordings to make with {args.voice}", flush=True)
    if args.dry_run:
        for it in todo[:5]:
            print(it["id"], ssml(spoken_text(it), args.voice, args.rate))
        return

    OUT.mkdir(parents=True, exist_ok=True)
    last = 0.0
    for n, it in enumerate(todo, 1):
        gap = time.monotonic() - last
        if gap < MIN_GAP:
            time.sleep(MIN_GAP - gap)
        last = time.monotonic()
        audio = synthesize(args.region, key, ssml(spoken_text(it), args.voice, args.rate))
        if len(audio) < 1000:
            raise SystemExit(f"{it['id']} ({it['fa']}): Azure returned almost nothing")
        (OUT / f"{it['id']}.mp3").write_bytes(audio)
        if n % 25 == 0 or n == len(todo):
            print(f"{n}/{len(todo)}", flush=True)

    ids = sorted(it["id"] for it in items if (OUT / f"{it['id']}.mp3").exists())
    files = {i: hashlib.sha1((OUT / f"{i}.mp3").read_bytes()).hexdigest()[:8] for i in ids}
    (OUT / "index.json").write_text(
        json.dumps({"voice": f"Microsoft Azure {args.voice}", "ids": ids, "files": files}, separators=(",", ":")) + "\n",
        encoding="utf8",
    )
    print(f"done: {len(ids)} recordings in docs/audio/")


if __name__ == "__main__":
    sys.exit(main())

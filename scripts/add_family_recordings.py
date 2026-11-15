"""Add the family's own recordings to Golestan, so they play on every phone.

Recordings made in the app (More → Family voices → Send my recordings) arrive
as files named by their line's id (w-1234abcd.m4a). Any other recording can be
added for one line with --id, cut to the part that is wanted with --start and
--end (seconds).

  python scripts/add_family_recordings.py ~/Downloads/w-*.m4a
  python scripts/add_family_recordings.py my_take.m4a --id w-57d1e9f8 --start 0 --end 6.6

Each recording is trimmed of silence, evened out in volume, saved as
docs/audio/<id>.mp3, and listed in scripts/audio-sources.json as a family
recording — the voice scripts never overwrite those — and in the credits page.
Needs ffmpeg.
"""

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from native_recordings import CREDITS, OUT, ROOT, SOURCES, write_credits  # noqa: E402


def prepare(src: Path, dest: Path, start: float | None, end: float | None) -> None:
    cut = (["-ss", str(start)] if start is not None else []) + (["-to", str(end)] if end is not None else [])
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", *cut, "-i", str(src), "-af",
         "highpass=f=70,"
         "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,"
         "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.12,areverse,"
         "loudnorm=I=-18:TP=-2:LRA=11,adelay=120:all=1,apad=pad_dur=0.25",
         "-ac", "1", "-ar", "24000", "-b:a", "64k", str(dest)],
        check=True,
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+", type=Path)
    ap.add_argument("--id", help="the line this (single) recording is for, when its file isn't named by id")
    ap.add_argument("--start", type=float)
    ap.add_argument("--end", type=float)
    ap.add_argument("--speaker", default="Family")
    args = ap.parse_args()

    items = {i["id"]: i for i in json.loads((ROOT / "scripts" / "audio-items.json").read_text(encoding="utf8"))}
    sources = json.loads(SOURCES.read_text(encoding="utf8")) if SOURCES.exists() else {}
    added = []
    for f in args.files:
        if f.suffix == ".txt":
            continue
        iid = args.id if args.id and len(args.files) == 1 else re.match(r"(w-[0-9a-f]{8})", f.name)
        iid = iid if isinstance(iid, str) else (iid.group(1) if iid else None)
        if not iid or iid not in items:
            print(f"skip {f.name}: not a line in Golestan (name it by its id, or pass --id)")
            continue
        prepare(f, OUT / f"{iid}.mp3", args.start, args.end)
        sources[iid] = {"fa": items[iid]["fa"], "speaker": args.speaker, "license": "Family recording, shared for Golestan", "family": True}
        added.append(iid)
        print(f"added {iid}: {items[iid]['fa']}")

    SOURCES.write_text(json.dumps(dict(sorted(sources.items())), ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    write_credits(sources)
    index = json.loads((OUT / "index.json").read_text(encoding="utf8"))
    index["files"] = {i: hashlib.sha1((OUT / f"{i}.mp3").read_bytes()).hexdigest()[:8] for i in index["ids"]}
    index["native"] = sorted(sources)
    (OUT / "index.json").write_text(json.dumps(index, separators=(",", ":")) + "\n", encoding="utf8")
    print(f"done: {len(added)} family recordings added; credits in {CREDITS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

"""What a line sounds like when it is read aloud.

The written Persian carries blessing marks after holy names — (ص), (ع), (س),
(عج) — which are abbreviations, not letters. A voice reading the text as
written says «ع» as the letter "ein" (حضرت نوح «این» …). Here each mark
becomes the words a reader actually says, exactly where the lesson's
transliteration says them (usually the first mention), and is left silent
elsewhere, so the recording matches the help shown under the line.
"""

import re

# (how the transliteration writes it, which mark it belongs to, the words said)
BLESSINGS = [
    ("sallallâho alayhe va âleh", "ص", "صلی‌الله‌علیه‌وآله"),
    ("alayhemassalâm", "ع+", "علیهماالسلام"),  # after a pair: Imam Hasan and Imam Husayn
    ("alayhessalâm", "ع", "علیه‌السلام"),
    ("salâmollâh alayhâ", "س", "سلام‌الله‌علیها"),
    ("ajjalallâho ta'âlâ farajah", "عج", "عجل‌الله‌تعالی‌فرجه"),
]
MARK = re.compile(r"\s*\((ص|ع|س|عج)\)")


def said_blessings(translit: str) -> list[tuple[str, str]]:
    found = []
    for latin, kind, words in BLESSINGS:
        for m in re.finditer(re.escape(latin), translit):
            found.append((m.start(), kind, words))
    found.sort()
    # "alayhessalâm" is inside "alayhemassalâm"? no — but keep each position once
    out, seen = [], set()
    for pos, kind, words in found:
        if pos not in seen:
            seen.add(pos)
            out.append((kind, words))
    return out


def spoken_fa(fa: str, translit: str) -> str:
    queue = said_blessings(translit)
    out, pos = [], 0
    for m in MARK.finditer(fa):
        out.append(fa[pos : m.start()])
        pos = m.end()
        kind = m.group(1)
        if queue and queue[0][0] == kind:
            out.append(" " + queue.pop(0)[1])
        elif queue and queue[0][0] == "ع+" and kind == "ع":
            # a pair (امام حسن (ع) و امام حسین (ع)): the blessing is said once, after the second name
            if MARK.search(fa[pos : pos + 40]):
                continue
            out.append(" " + queue.pop(0)[1])
        # otherwise the mark isn't read aloud here
    out.append(fa[pos:])
    return re.sub(r"\s+([،,.!?؟»])", r"\1", " ".join("".join(out).split()))

"""What a line sounds like when it is read aloud.

The written Persian carries blessing marks after holy names — (ص), (ع), (س),
(عج) — which are abbreviations, not letters. A voice reading the text as
written says «ع» as the letter "ein" (حضرت نوح «این» …). Here every mark
becomes the words a reader says in its place, as the lesson's
transliteration shows them:

  (ص)  صلی‌الله‌علیه‌وآله      sallallâho alayhe va âleh
  (ع)  علیه‌السلام            alayhessalâm
       علیهم‌السلام           alayhemossalâm   after «اهل بیت»
       علیهماالسلام           alayhemassalâm   once, after a pair, where the
                                                transliteration says it that way
  (س)  سلام‌الله‌علیها         salâmollâh alayhâ
  (عج) عجل‌الله‌تعالی‌فرجه      ajjalallâho ta'âlâ farajah
"""

import re

WORDS = {"ص": "صلی‌الله‌علیه‌وآله", "ع": "علیه‌السلام", "س": "سلام‌الله‌علیها", "عج": "عجل‌الله‌تعالی‌فرجه"}
PLURAL = "علیهم‌السلام"
PAIR = "علیهماالسلام"
MARK = re.compile(r"\s*\((ص|ع|س|عج)\)")
# «امام حسن (ع) و امام حسین (ع)»: the first mark of a pair, when the pair is blessed together
PAIR_FIRST = re.compile(r"\s+و\s+\S+(?:\s+\S+)?\s*\(ع\)")


def spoken_fa(fa: str, translit: str = "") -> str:
    pairs_said_together = "alayhemassalâm" in translit
    out, pos, skip_next_as_pair = [], 0, False
    for m in MARK.finditer(fa):
        out.append(fa[pos : m.start()])
        pos = m.end()
        kind = m.group(1)
        if kind == "ع" and skip_next_as_pair:
            out.append(" " + PAIR)
            skip_next_as_pair = False
        elif kind == "ع" and pairs_said_together and PAIR_FIRST.match(fa[pos:]):
            skip_next_as_pair = True  # said once, after the second name
        elif kind == "ع" and fa[: m.start()].endswith("اهل بیت"):
            out.append(" " + PLURAL)
        else:
            out.append(" " + WORDS[kind])
    out.append(fa[pos:])
    return re.sub(r"\s+([،,.!?؟»])", r"\1", " ".join("".join(out).split()))

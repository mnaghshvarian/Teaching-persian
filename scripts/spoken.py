"""What a line sounds like when it is read aloud.

The written Persian carries blessing marks after holy and righteous names —
(ص), (ع), (س), (عج), (ره) — which are abbreviations, not letters. A voice
reading the text as written says «ع» as the letter "ein" (حضرت نوح «این» …).
Here every mark becomes the words a reader says in its place, as the lesson's
transliteration shows them:

  (ص)  صلی‌الله‌علیه‌وآله      sallallâho alayhe va âleh   after the Prophet
  (ع)  علیه‌السلام            alayhessalâm                after an Imam, a prophet,
                                                          or one of the Prophet's family
       علیهم‌السلام           alayhemossalâm   after «اهل بیت»
       علیهماالسلام           alayhemassalâm   once, after a pair, where the
                                                transliteration says it that way
  (س)  سلام‌الله‌علیها         salâmollâh alayhâ           after a lady of the Prophet's family
  (عج) عجل‌الله‌تعالی‌ظهوره      ajjalallâho ta'âlâ zohurah  after Imam Mahdi
  (ره) رحمة‌الله‌علیه          rahmatollâh alayh           after a righteous companion or scholar
       رحمة‌الله‌علیها         rahmatollâh alayhâ          … when she is a woman

A blessing written out in full in brackets, such as «(رضوان‌الله‌علیهم)»
after a list of companions, is read as it is written.
"""

import re

WORDS = {
    "ص": "صلی‌الله‌علیه‌وآله",
    "ع": "علیه‌السلام",
    "س": "سلام‌الله‌علیها",
    "عج": "عجل‌الله‌تعالی‌ظهوره",
    "ره": "رحمة‌الله‌علیه",
}
PLURAL = "علیهم‌السلام"
PAIR = "علیهماالسلام"
FEMALE = {"سمیه"}  # (ره) after a woman: رحمة‌الله‌علیها
MARK = re.compile(r"\s*\((ص|ع|س|عج|ره)\)")
# «امام حسن (ع) و امام حسین (ع)»: the first mark of a pair, when the pair is blessed together
PAIR_FIRST = re.compile(r"\s+و\s+\S+(?:\s+\S+)?\s*\(ع\)")


def spoken_fa(fa: str, translit: str = "") -> str:
    pairs_said_together = "alayhemassalâm" in translit
    out, pos, skip_next_as_pair = [], 0, False
    for m in MARK.finditer(fa):
        before = fa[pos : m.start()]
        out.append(before)
        pos = m.end()
        kind = m.group(1)
        name = before.split()[-1] if before.split() else ""
        if kind == "ع" and skip_next_as_pair:
            out.append(" " + PAIR)
            skip_next_as_pair = False
        elif kind == "ع" and pairs_said_together and PAIR_FIRST.match(fa[pos:]):
            skip_next_as_pair = True  # said once, after the second name
        elif kind == "ع" and fa[: m.start()].endswith("اهل بیت"):
            out.append(" " + PLURAL)
        elif kind == "ره" and name in FEMALE:
            out.append(" رحمة‌الله‌علیها")
        else:
            out.append(" " + WORDS[kind])
    out.append(fa[pos:])
    text = "".join(out)
    text = re.sub(r"\(([؀-ۿ‌ ]+)\)", r"\1", text)  # a blessing written out in full
    return re.sub(r"\s+([،,.!?؟»])", r"\1", " ".join(text.split()))

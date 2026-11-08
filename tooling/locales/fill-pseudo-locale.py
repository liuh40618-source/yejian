"""Fill the pseudo-locale catalog (zu-ZA) from the msgids.

`lingui extract` creates the pseudo-locale file but leaves every entry empty, so the catalog it produces renders the
Chinese fallback and tests nothing. A pseudo-locale exists to show layout breakage before a real translation lands:
accented letters, a wider string, and brackets that make a truncation obvious. Placeholders and tag names are left
alone so the messages still interpolate.
"""

import io
import re
import sys

ACCENTS = {
    "a": "á", "b": "ƀ", "c": "ç", "d": "ð", "e": "é", "f": "ƒ", "g": "ĝ", "h": "ĥ", "i": "í", "j": "ĵ",
    "k": "ķ", "l": "ļ", "m": "ɱ", "n": "ñ", "o": "ó", "p": "þ", "q": "q̃", "r": "ŕ", "s": "š", "t": "ţ",
    "u": "ú", "v": "ṽ", "w": "ŵ", "x": "ẋ", "y": "ý", "z": "ž",
    "A": "Á", "B": "Ɓ", "C": "Ç", "D": "Ð", "E": "É", "F": "Ƒ", "G": "Ĝ", "H": "Ĥ", "I": "Í", "J": "Ĵ",
    "K": "Ķ", "L": "Ļ", "M": "Ṁ", "N": "Ñ", "O": "Ó", "P": "Þ", "Q": "Q̃", "R": "Ŕ", "S": "Š", "T": "Ţ",
    "U": "Ú", "V": "Ṽ", "W": "Ŵ", "X": "Ẋ", "Y": "Ý", "Z": "Ž",
}

# Everything the pseudo text must not touch: ICU placeholders and tags, and the braces around plurals.
PROTECTED = re.compile(r"(\{[^{}]*\}|<[^<>]*>)")


def pseudo(message: str) -> str:
    parts = PROTECTED.split(message)
    out: list[str] = []
    for index, part in enumerate(parts):
        # Odd indexes are the protected captures.
        out.append(part if index % 2 else "".join(ACCENTS.get(char, char) for char in part))
    text = "".join(out)
    # Latin strings run shorter than their translations usually do; pad so overflow shows up in the pseudo locale.
    padding = "·" * max(0, round(len(text) * 0.35))
    return f"[{text}{padding}]"


def unescape(value: str) -> str:
    return value.replace('\\"', '"').replace("\\n", "\n").replace("\\t", "\t").replace("\\\\", "\\")


def escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n").replace("\t", "\\t")


def main(po_path: str) -> None:
    text = io.open(po_path, encoding="utf-8").read()
    blocks = text.split("\n\n")
    filled = 0

    for index, block in enumerate(blocks):
        match = re.search(r'(?m)^msgid "((?:[^"\\]|\\.)*)"$', block)
        if not match:
            continue
        msgid = unescape(match.group(1))
        if not msgid:
            continue
        str_match = re.search(r'(?m)^msgstr "(.*)"$', block)
        if str_match is None:
            continue
        if str_match.group(1).strip():
            continue
        replacement = f'msgstr "{escape(pseudo(msgid))}"'
        blocks[index] = block[: str_match.start()] + replacement + block[str_match.end() :]
        filled += 1

    io.open(po_path, "w", encoding="utf-8", newline="").write("\n\n".join(blocks))
    print(f"filled {filled} pseudo translations in {po_path}")


if __name__ == "__main__":
    main(sys.argv[1])

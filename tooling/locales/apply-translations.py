"""Apply a msgid -> Chinese translation map to a Lingui .po catalog.

Matches on the unescaped msgid so the JSON keys are the real strings, then writes the
translation back with PO escaping. Only fills entries whose msgstr is still empty, so
running it twice or over a partially filled catalog is safe.
"""

import json
import re
import sys


def unescape_po(value: str) -> str:
    return (
        value.replace("\\\\", "\x00")
        .replace('\\"', '"')
        .replace("\\n", "\n")
        .replace("\\t", "\t")
        .replace("\x00", "\\")
    )


def escape_po(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\t", "\\t")
    )


def main(po_path: str, *maps: str) -> None:
    # --overwrite rewrites entries that already carry a translation. Use it for a deliberate revision of shipped
    # copy, never for a fresh batch: a filled entry is usually right and silently replacing it loses that work.
    overwrite = "--overwrite" in maps
    translations: dict[str, str] = {}
    for path in maps:
        if path == "--overwrite":
            continue
        with open(path, encoding="utf-8") as fh:
            translations.update(json.load(fh))

    with open(po_path, encoding="utf-8") as fh:
        text = fh.read()

    blocks = text.split("\n\n")
    applied = 0
    skipped_filled = 0
    unused = set(translations)

    for index, block in enumerate(blocks):
        match = re.search(r'(?m)^msgid "((?:[^"\\]|\\.)*)"$', block)
        if not match:
            continue
        msgid = unescape_po(match.group(1))
        if msgid not in translations:
            continue
        unused.discard(msgid)

        str_match = re.search(r'(?m)^msgstr "((?:[^"\\]|\\.)*)"$', block)
        if str_match is None:
            continue
        if str_match.group(1).strip() and not overwrite:
            skipped_filled += 1
            continue

        replacement = f'msgstr "{escape_po(translations[msgid])}"'
        blocks[index] = block[: str_match.start()] + replacement + block[str_match.end() :]
        applied += 1

    with open(po_path, "w", encoding="utf-8") as fh:
        fh.write("\n\n".join(blocks))

    print(f"applied {applied}, already translated {skipped_filled}, not found in catalog {len(unused)}")
    for missing in sorted(unused)[:20]:
        print("  missing:", missing[:100])


if __name__ == "__main__":
    main(*sys.argv[1:])

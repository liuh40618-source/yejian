"""Rebuild the JSON catalogs that are generated from the web .po files.

Mirrors `tooling/locales/generate.ts` so the derived catalogs (PDF section titles, "Present"/"Expected"
date words, downloaded file names, the shared web page's interface, the account emails) stay in step
with the interface catalog. Written in Python because the repository's `tsx` runner is not available
in this environment.

Usage: python tooling/locales/generate-catalogs.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG_DIR = ROOT / "apps" / "web" / "locales"

SECTION_TITLES = [
    "Summary",
    "Profiles",
    "Experience",
    "Education",
    "Projects",
    "Skills",
    "Languages",
    "Interests",
    "Awards",
    "Certifications",
    "Publications",
    "Volunteer",
    "References",
    "Cover Letter",
]


def unescape_po(value: str) -> str:
    return (
        value.replace("\\\\", "\x00")
        .replace('\\"', '"')
        .replace("\\n", "\n")
        .replace("\\t", "\t")
        .replace("\x00", "\\")
    )


def parse_po(path: Path) -> dict[str, str]:
    """msgid -> msgstr, skipping obsolete entries and context-qualified ones (as the TS generator does)."""
    text = path.read_text(encoding="utf-8")
    messages: dict[str, str] = {}
    for block in text.split("\n\n"):
        if block.lstrip().startswith("#~"):
            continue
        if re.search(r"(?m)^msgctxt ", block):
            continue
        id_match = re.search(r'(?m)^msgid "((?:[^"\\]|\\.)*)"$', block)
        str_match = re.search(r'(?m)^msgstr "((?:[^"\\]|\\.)*)"$', block)
        if not id_match or not str_match:
            continue
        msgid = unescape_po(id_match.group(1))
        if not msgid.strip():
            continue
        messages[msgid] = unescape_po(str_match.group(1))
    return messages


def catalogs() -> dict[str, dict[str, str]]:
    return {p.stem: parse_po(p) for p in sorted(CATALOG_DIR.glob("*.po"))}


def pick(messages: dict[str, str], key: str) -> str:
    """The translation, else the English source (which is what an untranslated entry renders as)."""
    value = messages.get(key, "")
    return value if value.strip() else key


def english_values(ts_path: Path, export_name: str) -> list[str]:
    """The string values of the `ENGLISH` object a messages module exports as `export_name`."""
    source = ts_path.read_text(encoding="utf-8")
    object_match = re.search(r"const ENGLISH = \{(.*?)\n\};", source, re.S)
    if not object_match:
        raise SystemExit(f"Could not find the ENGLISH object in {ts_path}")
    values = re.findall(r'(?m)^\t\w+: "((?:[^"\\]|\\.)*)",$', object_match.group(1))
    if not values:
        raise SystemExit(f"No messages found in {ts_path}")
    return [v.replace('\\"', '"') for v in values]


def write(relative: str, data: object) -> None:
    path = ROOT / relative
    path.write_text(json.dumps(data, ensure_ascii=False, indent="\t") + "\n", encoding="utf-8")
    count = len(data) if isinstance(data, dict) else "?"
    print(f"wrote {relative} ({count} locales)")


def main() -> None:
    by_locale = catalogs()

    write(
        "packages/pdf/src/section-title-catalog.json",
        {locale: {title: pick(m, title) for title in SECTION_TITLES} for locale, m in by_locale.items()},
    )
    write(
        "packages/schema/src/resume/present-labels.json",
        {locale: pick(m, "Present") for locale, m in by_locale.items()},
    )
    write(
        "packages/schema/src/resume/expected-labels.json",
        {locale: pick(m, "Expected") for locale, m in by_locale.items()},
    )
    write(
        "packages/utils/src/file-name-words.json",
        {
            locale: {"Resume": pick(m, "Resume"), "Cover letter": pick(m, "Cover letter")}
            for locale, m in by_locale.items()
        },
    )

    web_page = english_values(ROOT / "packages/pdf/src/html/messages.ts", "WEB_PAGE_SOURCE_MESSAGES")
    web_catalog = {
        locale: {key: pick(m, key) for key in web_page} for locale, m in by_locale.items() if locale != "en-US"
    }
    write("packages/pdf/src/html/web-page-catalog.json", web_catalog)

    email = english_values(ROOT / "packages/email/src/templates/auth-messages.ts", "AUTH_EMAIL_SOURCE_MESSAGES")
    email_catalog = {
        locale: {key: pick(m, key) for key in email} for locale, m in by_locale.items() if locale != "en-US"
    }
    write("packages/email/src/templates/auth-catalog.json", email_catalog)


if __name__ == "__main__":
    main()

"""
Fix double-encoded UTF-8 in locale JSON files.

The locale files for zh/lo/vi contain text that was originally proper UTF-8,
then mis-decoded as Windows-1252, then re-encoded as UTF-8. This script
reverses that by mapping each character back to a single byte (using cp1252
where applicable, ISO-8859-1 otherwise), then decoding the resulting bytes
as UTF-8.
"""
import json
import sys
from pathlib import Path

# cp1252 mapping for codepoints 0x80-0x9F (where they differ from ISO-8859-1).
CP1252_REVERSE = {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
    0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
    0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
    0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
    0x017E: 0x9E, 0x0178: 0x9F,
}


def char_to_byte(c: str):
    cp = ord(c)
    if cp < 0x100:
        return cp
    if cp in CP1252_REVERSE:
        return CP1252_REVERSE[cp]
    return None


def try_unmojibake(s: str):
    """Return the un-mojibake'd string if possible, else None."""
    if not s:
        return s
    out = bytearray()
    for c in s:
        b = char_to_byte(c)
        if b is None:
            return None
        out.append(b)
    try:
        return bytes(out).decode('utf-8')
    except UnicodeDecodeError:
        return None


def looks_like_mojibake(s: str) -> bool:
    """A string is suspected mojibake if it contains any Latin-1 supplement
    char (U+0080-U+00FF) or cp1252 special char that's typical of mis-decoded
    UTF-8. Plain ASCII or already-valid Chinese/Lao/Vietnamese will not match.
    """
    for c in s:
        cp = ord(c)
        if 0x80 <= cp <= 0xFF:
            return True
        if cp in CP1252_REVERSE:
            return True
    return False


def fix_recursive(obj, stats):
    if isinstance(obj, dict):
        return {k: fix_recursive(v, stats) for k, v in obj.items()}
    if isinstance(obj, list):
        return [fix_recursive(x, stats) for x in obj]
    if isinstance(obj, str):
        if looks_like_mojibake(obj):
            fixed = try_unmojibake(obj)
            if fixed is not None and fixed != obj:
                stats['fixed'] += 1
                return fixed
            stats['skipped'] += 1
        return obj
    return obj


TARGETS = [
    "Admin/src/locales/zh/common.json",
    "Admin/src/locales/lo/common.json",
    "Admin/src/locales/vi/common.json",
    "frontend/src/locales/zh/common.json",
    "frontend/src/locales/lo/common.json",
    "frontend/src/locales/vi/common.json",
    "seller/src/locales/zh/common.json",
    "seller/src/locales/lo/common.json",
    "seller/src/locales/vi/common.json",
]


def main():
    root = Path("f:/Lalashop2026")
    for rel in TARGETS:
        p = root / rel
        if not p.exists():
            print(f"missing: {p}")
            continue
        data = json.loads(p.read_text(encoding="utf-8-sig"))
        stats = {"fixed": 0, "skipped": 0}
        fixed_data = fix_recursive(data, stats)
        p.write_text(
            json.dumps(fixed_data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"{rel}: fixed={stats['fixed']} skipped={stats['skipped']}")


if __name__ == "__main__":
    main()

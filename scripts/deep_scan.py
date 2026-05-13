"""Deep scan a TSX file for any hardcoded English UI strings."""
import re
import sys
from pathlib import Path


def scan(file: str) -> list[str]:
    text = Path(file).read_text(encoding='utf-8')
    text = re.sub(r'//[^\n]*', '', text)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)

    hits: set[str] = set()
    skip_substrings = ['http', '/', '{', '=', '<', '>', '\\', 'classname', 'className', 'utf-', 'application/']

    # All string literals (both quote styles) that start with Capital + lowercase
    for m in re.finditer(r'"([A-Z][a-z]\w*[ \-\(].+?)"', text):
        v = m.group(1).strip()
        if len(v) < 8:
            continue
        if any(x in v for x in skip_substrings):
            continue
        if re.match(r'^[a-z]+-', v):
            continue
        hits.add(v)

    for m in re.finditer(r"'([A-Z][a-z]\w*[ \-\(].+?)'", text):
        v = m.group(1).strip()
        if len(v) < 8:
            continue
        if any(x in v for x in skip_substrings):
            continue
        if re.match(r'^[a-z]+-', v):
            continue
        hits.add(v)

    return sorted(hits)


if __name__ == '__main__':
    for f in sys.argv[1:]:
        h = scan(f)
        print(f'=== {f}: {len(h)} ===')
        for s in h:
            print(f'   {s[:100]}')
        print()

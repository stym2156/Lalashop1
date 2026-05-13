"""Aggressive scan: find all multi-word English string literals in a file."""
import re
import sys
from pathlib import Path


SKIP_SUBSTRINGS = ['http', 'className', 'tabular-', 'flex-', 'text-', 'bg-', 'px-', 'py-', 'rounded-']


def english_literals(text: str) -> set[str]:
    text = re.sub(r'//[^\n]*', '', text)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    hits: set[str] = set()

    # Double-quoted strings
    for m in re.finditer(r'"([^"\\]{8,200})"', text):
        v = m.group(1)
        if not re.search(r'[A-Z]', v):
            continue
        if not re.search(r'[a-z]\s+[a-z]', v):
            continue
        if any(s in v for s in SKIP_SUBSTRINGS):
            continue
        if v.count('/') >= 2:
            continue
        hits.add(v.strip())

    # Single-quoted strings
    for m in re.finditer(r"'([^'\\]{8,200})'", text):
        v = m.group(1)
        if not re.search(r'[A-Z]', v):
            continue
        if not re.search(r'[a-z]\s+[a-z]', v):
            continue
        if any(s in v for s in SKIP_SUBSTRINGS):
            continue
        if v.count('/') >= 2:
            continue
        hits.add(v.strip())

    # Template literals (backticks)
    for m in re.finditer(r'`([^`\\${}\n]{8,200})`', text):
        v = m.group(1)
        if not re.search(r'[A-Z]', v):
            continue
        if not re.search(r'[a-z]\s+[a-z]', v):
            continue
        if any(s in v for s in SKIP_SUBSTRINGS):
            continue
        hits.add(v.strip())

    return hits


if __name__ == '__main__':
    for f in sys.argv[1:]:
        text = Path(f).read_text(encoding='utf-8')
        h = english_literals(text)
        print(f'=== {f}: {len(h)} ===')
        for s in sorted(h):
            print(f'  {s[:120]}')
        print()

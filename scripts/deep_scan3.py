"""Find real hardcoded English by masking t() calls and i18n key strings."""
import re
import sys
from pathlib import Path


def scan(text: str) -> set[str]:
    # Strip comments
    text = re.sub(r'//[^\n]*', '', text)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    # Mask t() calls so their keys don't trigger false positives
    text = re.sub(r't\([^)]*\)', 'T_CALL', text)
    # Mask import/from paths
    text = re.sub(r'(?:from|import)\s+["\'][^"\']+["\']', 'IMPORT', text)

    hits: set[str] = set()

    # Two-word capital-start phrases inside quotes
    for m in re.finditer(r'"([A-Z][a-zA-Z]+ [a-zA-Z][a-zA-Z ]{2,80}[a-z])"', text):
        v = m.group(1)
        if any(s in v.lower() for s in ['classname', 'http', 'utf', 'intl', 'application/', 'image/', '/api']):
            continue
        hits.add(v)
    for m in re.finditer(r"'([A-Z][a-zA-Z]+ [a-zA-Z][a-zA-Z ]{2,80}[a-z])'", text):
        v = m.group(1)
        if any(s in v.lower() for s in ['classname', 'http', 'utf', 'image/', 'application/']):
            continue
        hits.add(v)

    return hits


if __name__ == '__main__':
    for f in sys.argv[1:]:
        h = scan(Path(f).read_text(encoding='utf-8'))
        if h:
            print(f'=== {f}: {len(h)} ===')
            for s in sorted(h):
                print(f'  {s}')

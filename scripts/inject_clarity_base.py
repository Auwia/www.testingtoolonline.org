#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
from pathlib import Path
import re
import shutil
import sys

INJECTION_MARK = "<!-- ttol:clarity-base -->"

# regex per trovare uno snippet clarity esistente e catturare l'ID
RE_CLARITY_TAG = re.compile(r"""clarity\.ms/tag/([A-Za-z0-9\-]+)""", re.IGNORECASE)

def read_text_any(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="latin-1")

def write_backup(path: Path, backup_ext: str):
    if backup_ext:
        shutil.copy2(str(path), str(path.with_suffix(path.suffix + backup_ext)))

def build_snippet(clarity_id: str) -> str:
    return f"""{INJECTION_MARK}
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){{
    c[a]=c[a]||function(){{(c[a].q=c[a].q||[]).push(arguments)}};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/{clarity_id}";
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  }})(window, document, "clarity", "script");
</script>""".rstrip()

def inject_into_head(html: str, snippet: str) -> str:
    # Inserisci prima di </head> (case-insensitive)
    m = re.search(r"</head\s*>", html, flags=re.IGNORECASE)
    if m:
        i = m.start()
        return html[:i] + "\n  " + snippet + "\n" + html[i:]
    # Fallback: prima di </html>
    m = re.search(r"</html\s*>", html, flags=re.IGNORECASE)
    if m:
        i = m.start()
        return html[:i] + "\n  " + snippet + "\n" + html[i:]
    # Ultimo fallback: append in coda
    return html.rstrip() + "\n" + snippet + "\n"

def process_file(p: Path, clarity_id: str, replace_id: bool, backup_ext: str, dry_run: bool) -> str:
    """
    Ritorna uno stato:
      'injected'  -> snippet aggiunto
      'skipped'   -> già presente con stesso ID o già marcato
      'replaced'  -> sostituito ID diverso con quello nuovo
      'has_other' -> trovato Clarity con ID diverso e non abbiamo sostituito
    """
    html = read_text_any(p)

    # Se abbiamo già inserito noi (marker), salta
    if INJECTION_MARK in html:
        return 'skipped'

    # Cerca eventuali ID esistenti
    found = set(m.group(1) for m in RE_CLARITY_TAG.finditer(html))

    if found:
        if clarity_id in found:
            # Clarity già presente con lo stesso ID
            return 'skipped'
        else:
            # Clarity presente ma con ID diversi
            if replace_id:
                new_html = RE_CLARITY_TAG.sub(lambda m: m.group(0).replace(m.group(1), clarity_id), html)
                if new_html != html:
                    if not dry_run:
                        write_backup(p, backup_ext)
                        p.write_text(new_html, encoding="utf-8")
                    return 'replaced'
            return 'has_other'

    # Nessuno snippet trovato: iniettiamo
    snippet = build_snippet(clarity_id)
    new_html = inject_into_head(html, snippet)

    if new_html != html:
        if not dry_run:
            write_backup(p, backup_ext)
            p.write_text(new_html, encoding="utf-8")
        return 'injected'

    return 'skipped'

def main():
    ap = argparse.ArgumentParser(description="Inject Microsoft Clarity base snippet into HTML files.")
    ap.add_argument("--root", default=".", help="Root folder (default: .)")
    ap.add_argument("--clarity-id", default="4npx8j827j",
                    help="Clarity Project ID (default: 4npx8j827j)")
    ap.add_argument("--replace-id", action="store_true",
                    help="Replace existing different Clarity IDs with the provided one")
    ap.add_argument("--backup", default=".bak",
                    help="Backup extension (use '' to disable). Default: .bak")
    ap.add_argument("--dry-run", action="store_true",
                    help="Report changes without writing files")
    ap.add_argument("--exclude", nargs="*", default=["node_modules", ".git"],
                    help="Folders to skip (default: node_modules .git)")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    if not root.exists():
        print(f"Root not found: {root}", file=sys.stderr)
        sys.exit(1)

    total = 0
    injected = 0
    skipped = 0
    replaced = 0
    other = 0

    for p in root.rglob("*.html"):
        # escludi alcune directory
        if any(ex for ex in args.exclude if ex and ex in p.parts):
            continue
        total += 1
        status = process_file(p, args.clarity_id, args.replace_id, args.backup, args.dry_run)
        if status == 'injected':
            injected += 1
            print(f"[ADD] {p}")
        elif status == 'replaced':
            replaced += 1
            print(f"[REP] {p}")
        elif status == 'has_other':
            other += 1
            print(f"[WARN] {p} -> found different Clarity ID (use --replace-id to overwrite)")
        else:
            skipped += 1
            # print(f"[SKIP] {p}")

    print(f"\nScanned: {total} files | Injected: {injected} | Replaced: {replaced} | Skipped: {skipped} | With other ID: {other}")
    if args.dry_run:
        print("Dry-run: no files written.")

if __name__ == "__main__":
    main()


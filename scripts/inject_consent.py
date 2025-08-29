#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
from pathlib import Path
import re
import shutil
import sys

INJECTION_MARK = "<!-- ttol:clarity-consent -->"

def needs_injection(html: str, script_basename: str) -> bool:
    """Ritorna True se lo script non è ancora incluso."""
    if INJECTION_MARK in html:
        return False
    # cerca qualsiasi script che contenga il basename (es. clarity-consent.js)
    return (script_basename.lower() not in html.lower())

def inject_before_closing_body(html: str, snippet: str) -> str:
    """
    Inserisce lo snippet prima di </body> (case-insensitive).
    Se </body> non esiste, prova </html>; se non esiste, appende alla fine.
    """
    # </body> case-insensitive
    m = re.search(r"</body\s*>", html, flags=re.IGNORECASE)
    if m:
        i = m.start()
        return html[:i] + "\n    " + snippet.rstrip() + "\n" + html[i:]

    # fallback: </html>
    m = re.search(r"</html\s*>", html, flags=re.IGNORECASE)
    if m:
        i = m.start()
        return html[:i] + "\n    " + snippet.rstrip() + "\n" + html[i:]

    # ultimo fallback: append
    return html.rstrip() + "\n" + snippet.rstrip() + "\n"

def process_file(path: Path, snippet: str, script_basename: str, backup_ext: str, dry_run: bool) -> bool:
    """
    Elabora un file .html. Ritorna True se modificato.
    """
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        # tenta latin-1 se qualche pagina è legacy
        text = path.read_text(encoding="latin-1")

    if not needs_injection(text, script_basename):
        return False

    new_text = inject_before_closing_body(text, snippet)

    if new_text == text:
        return False

    if dry_run:
        print(f"[DRY] would inject in: {path}")
        return True

    # backup opzionale
    if backup_ext:
        backup_path = path.with_suffix(path.suffix + backup_ext)
        shutil.copy2(str(path), str(backup_path))

    path.write_text(new_text, encoding="utf-8")
    print(f"[OK ] injected in: {path}")
    return True

def main():
    ap = argparse.ArgumentParser(description="Inject Clarity consent script include into all HTML pages.")
    ap.add_argument("--root", default=".", help="Root folder of the static site (default: .)")
    ap.add_argument("--script-path", default="/lib/clarity-consent.js",
                    help="Script src to inject (default: /lib/clarity-consent.js)")
    ap.add_argument("--backup", default=".bak",
                    help="Backup extension to use (e.g. .bak). Use '' to disable (default: .bak)")
    ap.add_argument("--dry-run", action="store_true", help="Do not write changes, just report")
    ap.add_argument("--exclude", nargs="*", default=["node_modules", ".git"],
                    help="Folders to skip (default: node_modules .git)")
    args = ap.parse_args()

    root = Path(args.root).resolve()

    if not root.exists():
        print(f"Root not found: {root}", file=sys.stderr)
        sys.exit(1)

    # snippet da iniettare
    snippet = f"""{INJECTION_MARK}
<script src="{args.script_path}"></script>"""

    script_basename = Path(args.script_path).name.lower()

    total = 0
    changed = 0

    for p in root.rglob("*.html"):
        # escludi alcune directory
        skip = False
        for ex in args.exclude:
            try:
                if ex and ex in p.parts:
                    skip = True
                    break
            except Exception:
                pass
        if skip:
            continue

        total += 1
        if process_file(p, snippet, script_basename, args.backup, args.dry_run):
            changed += 1

    print(f"\nDone. Scanned: {total} html files. Injected: {changed}.")
    if args.dry_run:
        print("Nothing written (dry-run).")

if __name__ == "__main__":
    main()


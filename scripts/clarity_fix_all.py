#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
from pathlib import Path
import re
import shutil
import sys

MARK = "<!-- ttol:clarity-base -->"

# trova <script>...</script> anche su più righe
RE_SCRIPT_BLOCK = re.compile(r"<script\b[^>]*>.*?</script>", re.IGNORECASE | re.DOTALL)
# trova URL clarity + cattura ID
RE_CLARITY_URL = re.compile(r"clarity\.ms/tag/([A-Za-z0-9\-]+)", re.IGNORECASE)

def read_text_any(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return p.read_text(encoding="latin-1")

def write_backup(p: Path, ext: str):
    if ext:
        shutil.copy2(str(p), str(p.with_suffix(p.suffix + ext)))

def is_full_document(html: str, path: Path) -> bool:
    """Consideriamo 'documento completo' solo se ha un </head> (frammenti modali in genere non ce l'hanno)."""
    if re.search(r"</head\s*>", html, re.IGNORECASE):
        # ulteriore prudenza: evita file che nel nome sembrano modali/frammenti
        name = path.name.lower()
        if any(k in name for k in ["modal", "fragment", "partial"]):
            return False
        return True
    return False

def canonical_snippet(clarity_id: str) -> str:
    # guard per evitare doppi include runtime
    return f"""{MARK}
<script type="text/javascript">
  if (!window.__CLARITY_TAG__) {{
    window.__CLARITY_TAG__ = "{clarity_id}";
    (function(c,l,a,r,i,t,y){{
      c[a]=c[a]||function(){{(c[a].q=c[a].q||[]).push(arguments)}};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/{clarity_id}";
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    }})(window, document, "clarity", "script");
  }}
</script>""".rstrip()

def inject_before_head_close(html: str, snippet: str) -> str:
    m = re.search(r"</head\s*>", html, re.IGNORECASE)
    if m:
        i = m.start()
        return html[:i] + "\n  " + snippet + "\n" + html[i:]
    # fallback su </html> o append
    m = re.search(r"</html\s*>", html, re.IGNORECASE)
    if m:
        i = m.start()
        return html[:i] + "\n  " + snippet + "\n" + html[i:]
    return html.rstrip() + "\n" + snippet + "\n"

def strip_all_clarity_blocks(html: str):
    """Rimuove tutti gli script che contengono clarity.ms/tag; ritorna (html_pulito, count_rimossi)."""
    removed = 0
    def repl(m):
        nonlocal removed
        block = m.group(0)
        if RE_CLARITY_URL.search(block):
            removed += 1
            return ""   # elimina il blocco
        return block
    new_html = RE_SCRIPT_BLOCK.sub(repl, html)
    return new_html, removed

def process_one(p: Path, clarity_id: str, backup_ext: str, dry: bool) -> str:
    html = read_text_any(p)

    # 1) rimuovi tutti i blocchi clarity esistenti
    cleaned, removed = strip_all_clarity_blocks(html)

    # 2) rimuovi eventuali marker nostri duplicati
    cleaned = cleaned.replace(MARK + "\n", "").replace(MARK, "")

    # 3) re-inietta SOLO se documento completo
    changed = False
    final = cleaned
    if is_full_document(cleaned, p):
        snippet = canonical_snippet(clarity_id)
        final = inject_before_head_close(cleaned, snippet)
        changed = (final != html)
    else:
        changed = (final != html)

    if changed and not dry:
        write_backup(p, backup_ext)
        p.write_text(final, encoding="utf-8")

    if removed == 0 and not changed:
        return "unchanged"
    if removed > 0 and changed:
        return f"fixed({removed})"
    if removed > 0 and not is_full_document(cleaned, p):
        return f"stripped({removed})"
    if changed:
        return "added"
    return "unchanged"

def main():
    ap = argparse.ArgumentParser(description="Strip all Clarity tags; inject a single canonical tag only into full HTML documents.")
    ap.add_argument("--root", default=".", help="Root directory (default: .)")
    ap.add_argument("--clarity-id", default="4npx8j827j", help="Clarity Project ID (default: 4npx8j827j)")
    ap.add_argument("--backup", default=".bak", help="Backup extension ('' to disable). Default: .bak")
    ap.add_argument("--dry-run", action="store_true", help="Report only, do not write files")
    ap.add_argument("--exclude", nargs="*", default=["node_modules", ".git"], help="Folders to skip")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    if not root.exists():
        print(f"Root not found: {root}", file=sys.stderr)
        sys.exit(1)

    total = changed = fixed = added = stripped = 0
    for p in root.rglob("*.html"):
        # escludi directory tipiche e file backup
        if any(ex for ex in args.exclude if ex and ex in p.parts):
            continue
        if p.name.endswith(".bak"):   # non toccare .html.bak
            continue

        total += 1
        status = process_one(p, args.clarity_id, args.backup, args.dry_run)
        if status.startswith("fixed"):
            fixed += 1; changed += 1
            print(f"[FIX] {p} {status}")
        elif status.startswith("stripped"):
            stripped += 1; changed += 1
            print(f"[STRIP] {p} {status}")
        elif status == "added":
            added += 1; changed += 1
            print(f"[ADD] {p}")
        # unchanged -> silenzio

    print(f"\nScanned: {total} | Fixed(replaced): {fixed} | Stripped(frags): {stripped} | Added(docs): {added} | Changed: {changed} | Dry-run: {args.dry_run}")

if __name__ == "__main__":
    main()


#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TAGIR — Личная рабочая панель v1.0: автономный статический генератор index.html."""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data', 'panel-seed.json')
TEMPLATE = os.path.join(ROOT, 'scripts', 'panel_template.html')
STYLES = os.path.join(ROOT, 'scripts', 'panel_styles.css')
APP_JS = os.path.join(ROOT, 'scripts', 'panel_app.js')
OUTPUT = os.path.join(ROOT, 'index.html')

def read(p):
    with open(p, 'r', encoding='utf-8') as f:
        return f.read()

def main():
    seed = read(DATA)
    parsed = json.loads(seed)
    for k in ('meta','directions','projects','results','evidence','actions','hypotheses','professionalValue','decisions'):
        if k not in parsed:
            print(f'[ERROR] отсутствует ключ: {k}', file=sys.stderr)
            return 1
    template = read(TEMPLATE)
    styles = read(STYLES)
    js = read(APP_JS)
    html = template.replace('<!--STYLE-->', f'<style>\n{styles}\n</style>')
    html = html.replace('<!--SCRIPT-->', f'<script>\n{js}\n</script>')
    html = html.replace('<!--FONT_LINKS-->', '')
    html = html.replace('<!--VIEWS-->', '')
    json_escaped = seed.replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    html = html.replace('<!--SEED_DATA-->', f'<script id="panel-seed-data" type="application/json">{json_escaped}</script>')
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'[OK] index.html создан ({len(html.encode("utf-8"))} Bytes)')
    print(f'  · {len(parsed.get("directions", []))} направлений')
    print(f'  · {len(parsed.get("projects", []))} проектов')
    print(f'  · {len(parsed.get("results", []))} результатов')
    print(f'  · {len(parsed.get("evidence", []))} доказательств')
    print(f'  · {len(parsed.get("actions", []))} действий')
    return 0

if __name__ == '__main__':
    sys.exit(main())

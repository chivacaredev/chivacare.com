"""Extract public content tables from the legacy MySQL dump into JSON.

Usage: python scripts/import-sql.py <dump.sql> [out_dir]

Only whitelisted, non-personal tables are exported. Member, order,
appointment, invoice, contact and session tables are never read.
"""
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

PUBLIC_TABLES = {
    'activities', 'advertiser', 'assessment', 'assessment_answer',
    'assessment_case', 'assessment_question', 'blog', 'categories',
    'contents', 'menu', 'positionads', 'posts', 'price', 'product',
    'product_images', 'promotions', 'reviews', 'services', 'sites',
    'subcategories', 'teamgroup', 'teams', 'times', 'video',
}
DROP_COLUMNS = {'ip', 'user_id', 'name'}

ESCAPES = {'0': '\0', 'n': '\n', 'r': '\r', 't': '\t', 'Z': '\x1a', 'b': '\b'}


def parse_values(s, i):
    """Parse `(v, v), (v, v);` starting at s[i]; return (rows, end index)."""
    rows, n = [], len(s)
    while i < n:
        c = s[i]
        if c == ';':
            return rows, i + 1
        if c != '(':
            i += 1
            continue
        i += 1
        row = []
        while True:
            while s[i] in ' \n\r\t':
                i += 1
            if s[i] == "'":
                i += 1
                buf = []
                while True:
                    c = s[i]
                    if c == '\\':
                        nxt = s[i + 1]
                        buf.append(ESCAPES.get(nxt, nxt))
                        i += 2
                    elif c == "'":
                        if s[i + 1] == "'":
                            buf.append("'")
                            i += 2
                        else:
                            i += 1
                            break
                    else:
                        buf.append(c)
                        i += 1
                row.append(''.join(buf))
            else:
                j = i
                while s[j] not in ',)':
                    j += 1
                tok = s[i:j].strip()
                i = j
                if tok.upper() == 'NULL':
                    row.append(None)
                else:
                    try:
                        row.append(int(tok))
                    except ValueError:
                        try:
                            row.append(float(tok))
                        except ValueError:
                            row.append(tok)
            while s[i] in ' \n\r\t':
                i += 1
            if s[i] == ',':
                i += 1
                continue
            if s[i] == ')':
                i += 1
                break
        rows.append(row)
    return rows, i


def main():
    dump = Path(sys.argv[1]).read_text(encoding='utf-8')
    out_dir = Path(sys.argv[2] if len(sys.argv) > 2 else 'src/data/db')
    out_dir.mkdir(parents=True, exist_ok=True)

    columns = {}
    for m in re.finditer(r'^CREATE TABLE `(\w+)` \((.*?)^\)', dump, re.S | re.M):
        columns[m.group(1)] = re.findall(r'^\s+`(\w+)`', m.group(2), re.M)

    data = {t: [] for t in PUBLIC_TABLES if t in columns}
    insert = re.compile(r'^INSERT INTO `(\w+)` \(([^)]*)\) VALUES\s*', re.M)
    pos = 0
    while (m := insert.search(dump, pos)):
        table = m.group(1)
        rows, pos = parse_values(dump, m.end())
        if table not in data:
            continue
        cols = [c.strip(' `') for c in m.group(2).split(',')]
        for row in rows:
            data[table].append({c: v for c, v in zip(cols, row) if c not in DROP_COLUMNS})

    for table, rows in sorted(data.items()):
        (out_dir / f'{table}.json').write_text(
            json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'{table}: {len(rows)}')


if __name__ == '__main__':
    main()

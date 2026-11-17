from pathlib import Path
R=Path(r'C:\_Projects\DnD Campaigns');B=R/'== SRDs ==/5.5e'
for name in ['Bard','Cleric']:
 p=next(p for p in (B/"Player's Handbook"/'Chapter 3 - Character Classes').rglob(name+'.md') if p.parent.name==name);t=p.read_text(encoding='utf-8')
 for term in ['Light','Slow']:
  target=next((B/"Player's Handbook"/'Chapter 7 - Spells').rglob(term+'.md')).relative_to(R).as_posix()[:-3]
  t=t.replace('[['+term+'\\|'+term+']]', '[['+target+'\\|'+term+']]')
 p.write_text(t,encoding='utf-8')
# Check edited notes retain valid front matter and all verified PDF page targets exist.
import json,zipfile
W=R/'.artwork/source-review';entries=json.loads((W/'verified-results.json').read_text());errors=[]
for row in entries:
 p=R/row['note'];t=p.read_text(encoding='utf-8')
 if not t.startswith('---\n') or t.count('\n---\n')!=1:errors.append(str(p))
 if '# Name ' in t or '\nDescription\n' in t:errors.append(str(p))
 assert all(1<=n<=390 for n in row['pdf_pages'])
backup=json.loads((W/'links-results.json').read_text())['backup']
with zipfile.ZipFile(backup) as z:assert z.testzip() is None;print('Backup verified:',len(z.namelist()),'notes')
assert not errors,errors
print('Verified summaries validated:',len(entries))

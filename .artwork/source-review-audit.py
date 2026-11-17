from pathlib import Path
import re,json,collections,csv
R=Path(r'C:\_Projects\DnD Campaigns');B=R/'== SRDs ==/5.5e';W=R/'.artwork/source-review';OUT=R/'== SRDs ==/Audits';OUT.mkdir(exist_ok=True)
original=json.loads((W/'inventory.json').read_text());verified={x['note']:x for x in json.loads((W/'verified-results.json').read_text())};other=json.loads((W/'other-corrections.json').read_text());links=json.loads((W/'links-results.json').read_text())
def plain(t):
 t=re.sub(r'^---\n.*?\n---\n','',t,flags=re.S);t=re.sub(r'!\[\[.*?\]\]','',t)
 t=re.sub(r'\[\[([^\]]+)\]\]',lambda m:re.split(r'\\?\|',m.group(1))[-1].split('/')[-1],t)
 return t

def tokens(t):return re.findall(r'[a-z0-9]+',t.lower().replace('-\n','').replace('\u2019',"'"))
indices={}
for book in ["Dungeon Master's Guide",'Monster Manual',"Player's Handbook"]:
 pages=json.loads((W/(book+'.json')).read_text());idx=collections.defaultdict(set)
 for i,page in enumerate(pages):
  words=tokens(page)
  for triple in zip(words,words[1:],words[2:]):idx[triple].add(i+1)
 indices[book]=idx
results=[]
for row in original:
 p=R/row['path'];t=p.read_text(encoding='utf-8');text=plain(t);words=tokens(text);triples=set(zip(words,words[1:],words[2:]));idx=indices[row['book']];counts=collections.Counter()
 for triple in triples:
  for page in idx.get(triple,()):counts[page]+=1
 candidates=counts.most_common(3);match=sum(1 for triple in triples if triple in idx)/max(1,len(triples))
 isstub=bool(re.search(r'(?m)^(Description|Text)\s*$|This information can be found|# Name\b',t))
 isindex=(p.parent.name==p.stem or p.stem.endswith(' - Contents') or p.parent==B/row['book'])
 if row['path'] in verified:status='Rules summary checked against page images'
 elif 'review_status:' in t:status='Rules checked against page image'
 elif isstub:status='Placeholder remains; needs source transcription'
 elif isindex:status='Navigation/overview; content review pending'
 else:status='Existing content; page-image verification pending'
 results.append({'note':row['path'],'book':row['book'],'status':status,'source_page_candidates':', '.join(str(n) for n,c in candidates),'ocr_trigram_overlap':round(match,3)})
with (OUT/'Source-Review-Entries.csv').open('w',encoding='utf-8-sig',newline='') as f:
 wr=csv.DictWriter(f,fieldnames=list(results[0]));wr.writeheader();wr.writerows(results)
# Resolve only existing targets; do not interpret heading validity as file validity.
allfiles=[p for p in (R/'== SRDs ==').rglob('*') if p.is_file() and '.obsidian' not in p.parts];keys={p.relative_to(R).as_posix().lower() for p in allfiles};names=collections.defaultdict(list)
for p in allfiles:names[(p.stem if p.suffix=='.md' else p.name).lower()].append(p)
unresolved=[];unescaped=0
for p in B.rglob('*.md'):
 t=p.read_text(encoding='utf-8')
 for line in t.splitlines():
  for m in re.finditer(r'\[\[([^\]\n]+)\]\]',line):
   raw=m.group(1);target=re.split(r'\\?\|',raw,maxsplit=1)[0].split('#')[0]
   if not target:continue
   resolved=target.lower() in keys or target.lower()+'.md' in keys or len(names.get(target.lower(),[]))==1
   if not resolved:unresolved.append({'note':p.relative_to(R).as_posix(),'target':target})
   if line.lstrip('> ').startswith('|') and re.search(r'(?<!\\)\|',raw):unescaped+=1
with (OUT/'Source-Review-Unresolved-Links.csv').open('w',encoding='utf-8-sig',newline='') as f:
 wr=csv.DictWriter(f,fieldnames=['note','target']);wr.writeheader();wr.writerows(unresolved)
pending=[r for r in results if r['status'].startswith('Placeholder')];checked=[r for r in results if r['status'].startswith('Rules')]
duplicates=[]
for name,ps in names.items():
 ps=[p for p in ps if p.suffix=='.md' and B in p.parents];books={p.relative_to(B).parts[0] for p in ps}
 if len(books)>1:duplicates.append((name,ps))
def wikilink(path,label=None):return '[['+path.removesuffix('.md')+'|'+(label or Path(path).stem)+']]'
lines=['# Source Review','', '**Status: incomplete.** This report separates verified changes from entries that still require source review. The source books have damaged OCR text layers; automatic text matching is a search aid, not proof of correctness.','', '## Completed','',f'- Repaired or qualified {links["counts"]["links_repaired_or_qualified"]:,} links in the first path-repair pass; additional ambiguous targets and Markdown table pipes were repaired afterward.',f'- Filled {len(verified)} DMG placeholders with rules summaries checked against rendered source page images. Each has PDF page links and review metadata.', '- Checked Fireball, Fire Bolt, and Fire Shield against the PHB page image. Removed the unsupported Artificer class from 29 PHB spell headers; this does not certify the rest of those 29 spells.', '- Checked the Aboleth stat block against the MM page image and restored its missing lair effects.',f'- Saved the original Markdown in `{links["backup"]}` before editing.','', '## Coverage','', '| Book | Notes inventoried | Rules checked | Placeholders still unfilled |','| --- | ---: | ---: | ---: |']
for book in indices:lines.append(f'| {book} | {sum(r["book"]==book for r in results)} | {sum(r["book"]==book for r in checked)} | {sum(r["book"]==book for r in pending)} |')
lines+=['','## Remaining work','', '- Verify the populated entries against their source page images, including statistics, tables, class features, spell lists, variant items, and missing prose.', '- Fill the remaining placeholders listed below. Chapter navigation notes with no assigned entries are not treated as content placeholders.', '- Check artwork attribution and crop suitability separately; existing artwork was preserved.', f'- Resolve {len(unresolved)} remaining link occurrences listed in [[== SRDs ==/Audits/Source-Review-Unresolved-Links.csv|the unresolved-link list]]. Missing targets were not invented.', '', '[[== SRDs ==/Audits/Source-Review-Entries.csv|Full per-entry audit]] records every original book note. Candidate page numbers are **unverified PDF page numbers**, ranked using exact three-word OCR overlap. They are not citations or verification results. Low overlap can result from OCR corruption, paraphrasing, or a wrong source.','', '## Verified entries','']
for r in checked:lines.append('- '+wikilink(r['note']))
lines+=['','## Remaining placeholders','']
for r in pending:lines.append('- '+wikilink(r['note']))
lines+=['','## Same-named notes in different books','', 'These are duplicate note titles, not a determination that the source passages are identical. Their source text still needs comparison.','']
if not duplicates:lines.append('No exact same-named note files were found across the three book folders. This does not establish that the PDFs have no overlapping entries.')
for name,ps in duplicates:lines.append('- '+name+': '+', '.join(wikilink(p.relative_to(R).as_posix(),p.relative_to(B).parts[0]) for p in ps))
(OUT/'Source-Review.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
summary={'original_book_notes':len(results),'verified_entries':len(checked),'filled':len(verified),'remaining_placeholders':len(pending),'unresolved_links':len(unresolved),'unescaped_table_links':unescaped,'cross_book_duplicate_names':len(duplicates)}
(W/'final-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8');print(summary);print(collections.Counter(x['target'] for x in unresolved))

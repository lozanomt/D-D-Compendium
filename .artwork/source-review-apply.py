from pathlib import Path
import re,json,collections,sys
ROOT=Path(r'C:\_Projects\DnD Campaigns');BASE=ROOT/'== SRDs ==';W=ROOT/'.artwork/source-review';sys.path.insert(0,str(W));from verified_dmg import DATA
notes=list((BASE/'5.5e').rglob('*.md')); names=collections.defaultdict(list)
for p in notes:names[p.stem.lower()].append(p)
def target(term):
 opts=names.get(term.lower(),[])
 if len(opts)==1:return opts[0]
 if len(opts)>1:
  rules=[p for p in opts if '/Rules/' in p.as_posix()]
  if len(rules)==1:return rules[0]
 return None
terms={name:target(name) for name in names if len(name)>3};terms={k:v for k,v in terms.items() if v}
# Explicit spelling variant of a spell whose filename cannot contain a slash.
for p in notes:
 if re.sub('[^a-z]','',p.stem.lower())=='enlargereduce':terms['enlarge/reduce']=p
pattern=re.compile(r'(?<![\w])('+ '|'.join(re.escape(x) for x in sorted(terms,key=len,reverse=True))+r')(?![\w])',re.I)
count=0;done=[]
for name,(pages,category,attunement,body) in DATA.items():
 matches=[p for p in names[name.lower()] if "Dungeon Master's Guide" in p.parts];assert len(matches)==1,(name,matches)
 p=matches[0];old=p.read_text(encoding='utf-8');art=re.search(r'!\[\[[^\n]+\]\]',old)
 seen=set()
 def link(m):
  global count
  key=m.group(0).lower();t=terms[key]
  if t==p or key in seen:return m.group(0)
  seen.add(key);count+=1;return '[['+t.relative_to(ROOT).as_posix()[:-3]+'|'+m.group(0)+']]'
 body=pattern.sub(link,body)
 body='\n'.join(re.sub(r'\[\[[^\n]*?\]\]',lambda m:re.sub(r'(?<!\\)\|',r'\\|',m.group(0)),line) if line.lstrip().startswith('|') else line for line in body.splitlines())
 if isinstance(pages,int):pages=[pages]
 pdf=next((BASE/'5.5e'/"Dungeon Master's Guide").glob('*.pdf')).relative_to(ROOT).as_posix()
 sources='; '.join(f'[[{pdf}#page={n}|p. {n-3} (PDF page {n})]]' for n in pages)
 head='---\ntags:\n  - magicitem\ncssclasses:\n  - "dnd-book"\n  - "dnd-dmg"\nsource_book: "Dungeon Master\'s Guide (2024)"\nsource_pdf_pages: '+json.dumps(pages)+'\nreview_status: "rules-summary-checked-against-page-image"\nreviewed: 2026-11-16\n---\n'
 new=head+'# '+name+'\n*'+category+'*\n\n'+(art.group(0)+'\n\n' if art else '')+'**Attunement:** '+attunement+'\n\n'+body+'\n\n## Source\n\n'+sources+'\n\n*Rules summary checked against the supplied book page image; see the source for the original wording and illustration.*\n'
 p.write_text(new,encoding='utf-8');done.append({'note':p.relative_to(ROOT).as_posix(),'pdf_pages':pages,'status':'rules-summary-checked-against-page-image'})
(W/'verified-results.json').write_text(json.dumps(done,indent=2),encoding='utf-8');print('Filled',len(done),'linked references',count)

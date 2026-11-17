from pathlib import Path
import json
W=Path('.artwork/source-review');d=json.loads((W/"Dungeon Master's Guide.json").read_text())
for n in [289,272,297,309,316,325]:print('\nPAGE',n,'\n',d[n-1][:1400])
for book,term in [('Monster Manual','Mucus Cloud'),("Player's Handbook",'A bright streak')]:
 pages=json.loads((W/(book+'.json')).read_text()); print(book,[(i+1,t.find(term)) for i,t in enumerate(pages) if term in t])

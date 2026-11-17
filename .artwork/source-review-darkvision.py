from pathlib import Path
import json,collections
w=Path('.artwork/source-review');rows=json.loads((w/'links-unresolved.json').read_text());print('\n'.join(str(r) for r in rows if r['target']=='Darkvision' and '/Monster Manual/' not in r['note']))

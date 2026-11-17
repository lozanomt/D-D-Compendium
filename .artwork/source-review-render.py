from pathlib import Path
import pypdfium2 as pdfium,sys
root=Path(r'C:\_Projects\DnD Campaigns'); w=root/'.artwork/source-review'
pdf=next((root/'== SRDs ==/5.5e').rglob('*Dungeon*.pdf')); d=pdfium.PdfDocument(str(pdf))
for n in map(int,sys.argv[1:]):
 p=w/f'dmg-{n}.png';d[n-1].render(scale=1.5).to_pil().save(p);print(p)

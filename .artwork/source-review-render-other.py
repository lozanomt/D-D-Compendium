from pathlib import Path
import pypdfium2 as pdfium
r=Path('== SRDs ==/5.5e');w=Path('.artwork/source-review')
for book,n,out in [('Monster Manual',14,'mm-14'),("Player's Handbook",277,'phb-277')]:
 d=pdfium.PdfDocument(str(next((r/book).glob('*.pdf'))));d[n-1].render(scale=1.6).to_pil().save(w/(out+'.png'))

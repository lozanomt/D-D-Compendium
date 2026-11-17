import fitz,json,hashlib,re,math,os,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np
ROOT=Path('C:/_Projects/DnD Campaigns');RULES=ROOT/'D&D 5e 2024 Rules';WORK=ROOT/'.artwork/work'
BOOKS={'mm':('Monster Manual','D&D 5.5E - Monster Manual.pdf'),'phb':('Players Handbook',"D&D 5.5E - Player's Handbook.pdf"),'dmg':('Dungeon Masters Guide',"D&D 5.5E - Dungeon Master's Guide.pdf")}
OUT=RULES/'z. Load Bearing Folders/Attachments/Artwork';OUT.mkdir(parents=True,exist_ok=True)
cache={}
if (OUT/'manifest.json').exists():
 for old in json.loads((OUT/'manifest.json').read_text(encoding='utf8'))['entries']:
  if (ROOT/old['file']).exists(): cache[(old['book'],old['page'],tuple(old['box']),json.dumps(old.get('exclude',[])))]={k:old[k] for k in ['file','sha256','size','source','pdf_page','crop','fade','content_rect']}
rows=json.loads((ROOT/'.artwork/artwork-mapping.json').read_text(encoding='utf8'));docs={};assets={};manifest=[]
for i,row in enumerate(rows):
 key=(row['book'],row['page'],tuple(row['box']),json.dumps(row.get('exclude',[])))
 if key in cache: assets[key]=cache[key]
 if key not in assets:
  book,pdf=BOOKS[row['book']];folder=OUT/book;folder.mkdir(exist_ok=True)
  name=re.sub('[^a-z0-9]+','-',row.get('sharedFrom',row['name']).lower()).strip('-');filename=f"{row['book']}-p{row['page']:03}-{name}.png";dest=folder/filename
  doc=docs.setdefault(row['book'],fitz.open(RULES/pdf));page=doc[row['page']-1];b=row['box'];rect=fitz.Rect(b[0]*page.rect.width,b[1]*page.rect.height,b[2]*page.rect.width,b[3]*page.rect.height)
  scale=min(1200/rect.width,900/rect.height);pix=page.get_pixmap(matrix=fitz.Matrix(scale,scale),clip=rect,alpha=False);im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples);im.thumbnail((1200,900),Image.Resampling.LANCZOS);im=im.convert('RGBA')
  h=im.height;fade=max(2,round(h*.18));alpha=np.full((h,im.width),255,dtype=np.uint8);t=np.linspace(0,1,fade);alpha[-fade:]=np.rint(255*(1-(3*t*t-2*t*t*t)))[:,None].astype(np.uint8);alpha_im=Image.fromarray(alpha)
  for ex in row.get('exclude',[]):
   coords=[(ex[0]-b[0])/(b[2]-b[0])*im.width,(ex[1]-b[1])/(b[3]-b[1])*im.height,(ex[2]-b[0])/(b[2]-b[0])*im.width,(ex[3]-b[1])/(b[3]-b[1])*im.height]
   ImageDraw.Draw(alpha_im).rectangle(coords,fill=0)
  im.putalpha(alpha_im)
  canvas=Image.new('RGBA',(1200,900));canvas.paste(im,((1200-im.width)//2,(900-im.height)//2));canvas.save(dest,optimize=True)
  assets[key]={'file':dest.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'size':[1200,900],'source':pdf,'pdf_page':row['page'],'crop':b,'fade':'bottom 18 percent; smoothstep alpha','content_rect':[(1200-im.width)//2,(900-im.height)//2,im.width,im.height]}
 manifest.append({**row,**assets[key]})
 if i%50==0:print('export',i,len(assets),flush=True)
(OUT/'manifest.json').write_text(json.dumps({'canvas':[1200,900],'entries':manifest},indent=2),encoding='utf8')
print('DONE',len(manifest),'entries',len(assets),'images',flush=True)

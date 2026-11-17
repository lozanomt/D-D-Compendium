import fitz, json, re, math, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np
ROOT=Path('C:/_Projects/DnD Campaigns')
WORK=ROOT/'.artwork/work'
BOOKS={'mm':'D&D 5.5E - Monster Manual.pdf','phb':"D&D 5.5E - Player's Handbook.pdf",'dmg':"D&D 5.5E - Dungeon Master's Guide.pdf",'srd':'SRD_CC_v5.2.1.pdf'}
def rectangles(mask):
 h,w=mask.shape; heights=np.zeros(w,dtype=int); results=[]
 for y in range(h):
  heights=np.where(mask[y],heights+1,0); stack=[]
  for x in range(w+1):
   v=int(heights[x]) if x<w else 0; start=x
   while stack and stack[-1][1]>v:
    s,z=stack.pop(); start=s
    if x-s>=18 and z>=16: results.append((s,y-z+1,x,y+1))
   if not stack or stack[-1][1]<v:stack.append((start,v))
 return results

def process(key):
 doc=fitz.open(ROOT/'D&D 5e 2024 Rules'/BOOKS[key]); folder=WORK/key;folder.mkdir(exist_ok=True)
 rows=[]
 for n,page in enumerate(doc):
  pix=page.get_pixmap(matrix=fitz.Matrix(0.26,0.26),alpha=False)
  im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples); im.save(folder/f'page-{n+1:03}.jpg',quality=85)
  a=np.array(im); h,w=a.shape[:2]; gh=160;gw=120
  small=np.array(im.resize((gw,gh)))
  # The OCR text is an exclusion map, not a source of artwork.
  free=np.ones((gh,gw),dtype=bool);free[:2]=False;free[-5:]=False
  for word in page.get_text('words'):
   if len(re.sub('[^A-Za-z0-9]','',word[4]))<3:continue
   x0,y0,x1,y1=word[:4];x0=int(x0/page.rect.width*gw);x1=math.ceil(x1/page.rect.width*gw);y0=int(y0/page.rect.height*gh);y1=math.ceil(y1/page.rect.height*gh)
   free[max(0,y0-1):min(gh,y1+1),max(0,x0-1):min(gw,x1+1)]=False
  lo=small.min(2).astype(float);hi=small.max(2).astype(float)
  ink=((hi-lo>22)&(lo<205))|(hi<145)
  candidates=[]
  for x0,y0,x1,y1 in rectangles(free):
   region=ink[y0:y1,x0:x1];density=region.mean();area=(x1-x0)*(y1-y0)/(gw*gh)
   if density<0.18 or area<0.035:continue
   ratio=(x1-x0)/gw*page.rect.width/((y1-y0)/gh*page.rect.height)
   if ratio<0.25 or ratio>4:continue
   score=area*density**0.75*(min(ratio,1/ratio)**0.12)
   candidates.append((score,[x0/gw,y0/gh,x1/gw,y1/gh],float(density)))
  candidates.sort(reverse=True);selected=[]
  for score,box,density in candidates:
   if any(max(0,min(box[2],b[2])-max(box[0],b[0]))*max(0,min(box[3],b[3])-max(box[1],b[1])) / min((box[2]-box[0])*(box[3]-box[1]),(b[2]-b[0])*(b[3]-b[1]))>0.35 for b in selected):continue
   selected.append(box)
   if len(selected)>=2:break
  text=page.get_text();row={'page':n+1,'text':text,'crops':selected};rows.append(row)
  if selected:
   b=selected[0]; crop=im.crop(tuple(int(v*s) for v,s in zip(b,[w,h,w,h])));crop.thumbnail((180,150));out=Image.new('RGB',(190,180),'#ddd9cf');out.paste(crop,((190-crop.width)//2,0));ImageDraw.Draw(out).text((5,153),str(n+1)+' '+re.sub(r'\s+',' ',text)[:22],fill='black');out.save(folder/f'crop-{n+1:03}.jpg')
  if n%50==0:print(key,n+1,flush=True)
 (folder/'index.json').write_text(json.dumps(rows),encoding='utf8')
 for start in range(0,len(rows),48):
  sheet=Image.new('RGB',(190*6,180*8),'white')
  for k,row in enumerate(rows[start:start+48]):
   f=folder/f'crop-{row["page"]:03}.jpg'
   if f.exists():thumb=Image.open(f)
   else:
    thumb=Image.new('RGB',(190,180),'#eee');ImageDraw.Draw(thumb).text((5,153),str(row['page'])+' NO CROP',fill='black')
   sheet.paste(thumb,((k%6)*190,(k//6)*180))
  sheet.save(folder/f'sheet-{start//48+1:02}.jpg',quality=90)
 print(key,'done',len(rows),flush=True)
if __name__=='__main__':
 for key in sys.argv[1:] or ['mm']:process(key)

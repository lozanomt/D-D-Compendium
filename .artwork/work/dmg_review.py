import fitz,json
from PIL import Image,ImageDraw
from pathlib import Path
root=Path('C:/_Projects/DnD Campaigns');folder=root/'.artwork/work/dmg';doc=fitz.open(root/'D&D 5e 2024 Rules'/"D&D 5.5E - Dungeon Master's Guide.pdf")
nums=[230,231,232,233,234,235,236,238,239,240,241,243,244,245,246,247,248,250,251,254,256,257,258,259,260,262,263,264,265,266,267,268,270,271,272,274,275,276,277,278,279,280,281,284,285,286,288,289,292,293,294,295,296,297,298,299,300,301,303,305,306,307,308,310,312,313,315,316,318,319,320,321,322,323,325,328]
for start in range(0,len(nums),12):
 sheet=Image.new('RGB',(1224,1664),'#ddd')
 for k,n in enumerate(nums[start:start+12]):
  pix=doc[n-1].get_pixmap(matrix=fitz.Matrix(.5,.5));im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples);im.thumbnail((306,396));sheet.paste(im,((k%4)*306,(k//4)*416));ImageDraw.Draw(sheet).text(((k%4)*306+4,(k//4)*416+396),str(n),fill='black')
 sheet.save(folder/f'items-{start//12+1}.jpg',quality=95)

from PIL import Image,ImageDraw
from pathlib import Path
p=Path('C:/_Projects/DnD Campaigns/.artwork/work/mm')
nums=[18,25,40,41,50,56,60,80,87,92,127,128,141,145,146,147,154,155,164,177,187,194,199,200,206,209,210,214,243,256,257,258,280,281,285,286,289,295,296,304,312,316,317,322,323,330,338,349]
for start in range(0,len(nums),12):
 sheet=Image.new('RGB',(960,1020),'#ddd')
 for k,n in enumerate(nums[start:start+12]):
  im=Image.open(p/f'page-{n:03}.jpg');im.thumbnail((240,320));sheet.paste(im,((k%4)*240,(k//4)*340));ImageDraw.Draw(sheet).text(((k%4)*240+4,(k//4)*340+320),str(n),fill='black')
 sheet.save(p/f'fullreview-{start//12+1}.jpg',quality=93)

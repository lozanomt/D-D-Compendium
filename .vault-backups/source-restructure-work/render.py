import fitz,sys
from PIL import Image,ImageDraw
d=fitz.open(sys.argv[1]); out=sys.argv[2]
for start in [348,352,356,360]:
 pages=list(range(start,min(start+4,362))); canvas=Image.new('RGB',(1000,700*2),'white')
 for j,i in enumerate(pages):
  pix=d[i].get_pixmap(matrix=fitz.Matrix(0.8,0.8)); im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples); im.thumbnail((500,670)); canvas.paste(im,((j%2)*500,(j//2)*700+25)); ImageDraw.Draw(canvas).text(((j%2)*500,(j//2)*700),str(i+1),fill='black')
 canvas.save(out+'/phb-'+str(start)+'.png')

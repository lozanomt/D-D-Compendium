from PIL import Image
import numpy as np,json,sys
for f in sys.argv[1:]:
 Image.open(f).verify();im=Image.open(f);a=np.array(im.getchannel('A')) if im.mode=='RGBA' else None
 r={'file':f,'width':im.width,'height':im.height,'mode':im.mode,'square':im.width==im.height,'top_alpha':round(float(a[:8].mean()),2) if a is not None else None,'bottom_alpha':round(float(a[-8:].mean()),2) if a is not None else None}
 r['valid']=r['square'] and im.width>=768 and a is not None and r['top_alpha']>230 and r['bottom_alpha']<r['top_alpha']-10
 print(json.dumps(r))
 if not r['valid']:raise SystemExit(1)

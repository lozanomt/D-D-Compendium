'use strict';
// Rebuild a small, inert set of formatting elements; never insert imported live HTML.
const ALLOWED=new Set(['p','div','span','strong','b','em','i','u','s','small','sub','sup','br','hr','ul','ol','li','blockquote','pre','code','h1','h2','h3','h4','h5','h6','table','caption','colgroup','col','thead','tbody','tfoot','tr','th','td','a']);
const DROP=new Set(['script','style','iframe','object','embed','form','input','button','select','textarea','svg','math','template','noscript','link','meta','img','video','audio']);
function render(container,value) {
  const doc=container.ownerDocument,source=String(value||'').replace(/\r\n?/g,'\n').trim();
  container.replaceChildren();container.classList.add('dndcustom-rich-description');container.classList.remove('dndcustom-rich-inline');
  const finish=()=>{if(container.children.length===1&&container.firstElementChild.tagName==='P')container.classList.add('dndcustom-rich-inline');};
  if(!source)return;
  const cleanText=s=>s.replace(/\[\/?(?:action|condition|spell|skill|sense|rule|item|weapon|monster)\]/gi,'');
  if(!/<\/?[a-z][^>]*>/i.test(source)){
    for(const paragraph of source.split(/\n(?:[ \t]*\n)+/).filter(s=>s.trim())){
      const p=doc.createElement('p');const lines=cleanText(paragraph.trim()).split('\n');
      lines.forEach((line,i)=>{if(i)p.append(doc.createElement('br'));p.append(doc.createTextNode(line.trim()));});container.append(p);
    }
    finish();return;
  }
  const template=doc.createElement('template');template.innerHTML=source;
  function copy(node,parent){
    if(node.nodeType===3){parent.append(doc.createTextNode(cleanText(node.nodeValue.replace(/\s+/g,' '))));return;}
    if(node.nodeType!==1)return;
    const tag=node.tagName.toLowerCase();if(DROP.has(tag))return;
    if(!ALLOWED.has(tag)){for(const child of node.childNodes)copy(child,parent);return;}
    const target=doc.createElement(tag);let destination=parent;
    if(tag==='table'){
      const wrapper=doc.createElement('div');wrapper.className='dndcustom-description-table';parent.append(wrapper);destination=wrapper;
    }
    if(tag==='td'||tag==='th')for(const attribute of ['colspan','rowspan']){const n=Number(node.getAttribute(attribute));if(Number.isInteger(n)&&n>1&&n<=20)target.setAttribute(attribute,String(n));}
    if(tag==='th')target.setAttribute('scope',node.getAttribute('scope')==='row'?'row':'col');
    if(tag==='ol'){const n=Number(node.getAttribute('start'));if(Number.isInteger(n)&&n>0)target.setAttribute('start',String(n));}
    if(tag==='a'){
      const href=node.getAttribute('href');
      if(href)try{const url=new URL(href,'https://www.dndbeyond.com');if(['http:','https:'].includes(url.protocol)){target.setAttribute('href',url.href);target.setAttribute('target','_blank');target.setAttribute('rel','noopener noreferrer');}}catch{}
    }
    destination.append(target);for(const child of node.childNodes)copy(child,target);
    if(tag==='table'){
      const first=target.rows[0];if(/^d\d+$/i.test(first?.cells[0]?.textContent.trim()||''))target.classList.add('dndcustom-roll-table');
      const columns=Math.max(0,...[...target.rows].map(row=>[...row.cells].reduce((n,cell)=>n+cell.colSpan,0)));
      if(columns>3)target.style.minWidth=(columns*90)+'px';
      if(!target.querySelector('caption')){const title=first?[...first.cells].map(c=>c.textContent.trim()).filter(Boolean).join(' / '):'Reference table';target.setAttribute('aria-label',title);}
    }
  }
  for(const node of template.content.childNodes)copy(node,container);finish();
}
function upgrade(container,raw) {
  if(!container)return;
  // The original renderer fills an unopened spell lazily. Preserve its expansion
  // and lookup handlers while replacing only the text presentation.
  let firstOriginalFill=!container.textContent.trim()&&!!raw;
  if(raw)render(container,raw);else container.classList.add('dndcustom-rich-description');
  container.setText=value=>{const source=firstOriginalFill?raw:value;firstOriginalFill=false;render(container,source);};
}
module.exports={render,upgrade};

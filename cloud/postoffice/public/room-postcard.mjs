// Make a local keepsake from the room that is actually on screen. No upload service.
const properties = `display position inset top right bottom left width height min-width min-height max-width max-height box-sizing margin padding overflow overflow-x overflow-y border border-top border-right border-bottom border-left border-radius outline opacity z-index transform transform-origin perspective clip-path background background-color background-image background-size background-position background-repeat box-shadow filter mix-blend-mode isolation flex flex-direction align-items align-content align-self justify-content justify-items justify-self order gap grid-template-columns grid-template-rows grid-column grid-row object-fit object-position font font-family font-size font-weight line-height color text-align white-space visibility fill fill-opacity stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-dasharray mask mask-type`.split(' ');
const xml = value => String(value).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
function styles(source, pseudo) {
  const computed = getComputedStyle(source, pseudo);
  const text = properties.map(key => `${key}:${computed.getPropertyValue(key)};`).join('');
  // SVG paint servers must keep pointing at the cloned definitions, not the live page.
  return text.replace(/url\(["']?[^)"']*#([\w-]+)["']?\)/g, 'url(#$1)') + 'animation:none;transition:none;caret-color:transparent;';
}
function readData(blob) {
  return new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(Error('图片暂未准备好，请重试。'));
    reader.readAsDataURL(blob);
  });
}
async function imageData(source) {
  const url = new URL(source, location.href);
  if (url.protocol === 'data:') return source;
  if (url.origin !== location.origin) throw Error('这张图片暂时不能收进照片。');
  const response = await fetch(url, {credentials:'same-origin', signal:AbortSignal.timeout(12000)});
  if (!response.ok) throw Error('图片暂未准备好，请重试。');
  return readData(await response.blob());
}
function loadImage(src) {
  return new Promise((resolve,reject) => {
    const img = new Image(), timer = setTimeout(() => reject(Error('照片还没准备好，请重试。')), 15000);
    img.onload = () => {clearTimeout(timer);resolve(img);};
    img.onerror = () => {clearTimeout(timer);reject(Error('暂时拍不了照片，请重试。'));};
    img.src = src;
  });
}
function fittedText(ctx, text, width) {
  const chars = [...String(text).replace(/[\u0000-\u001f]/g,'').slice(0,40)];
  while(chars.length && ctx.measureText(chars.join('')).width > width) chars.pop();
  return chars.join('');
}
export async function createRoomPostcard({scene, name='小伙伴', preview=false}) {
  if (!scene?.matches('.mofu-room') || scene.parentElement?.getAttribute('aria-busy') === 'true') throw Error('等小屋摆好，再留张照片吧。');
  const {width,height} = scene.getBoundingClientRect();
  if (width < 20 || height < 20) throw Error('先打开小屋，再留张照片吧。');
  const clone = scene.cloneNode(true), originals=[scene,...scene.querySelectorAll('*')], copies=[clone,...clone.querySelectorAll('*')], extra=[];
  const pending=[], cache=new Map();
  for(let i=0;i<originals.length;i++) {
    const source=originals[i], target=copies[i];
    target.setAttribute('style', styles(source));
    target.removeAttribute('tabindex');target.removeAttribute('contenteditable');if(source.hasAttribute('data-node'))target.style.outline='none';
    if(source instanceof HTMLElement) for(const pseudo of ['::before','::after']) {
      const content=getComputedStyle(source,pseudo).content;
      if(content && !['none','normal'].includes(content)) {
        target.setAttribute('data-photo-node',String(i));
        extra.push(`[data-photo-node="${i}"]${pseudo}{${styles(source,pseudo)}content:${content};}`);
      }
    }
    if(source instanceof HTMLImageElement) {
      const src=source.currentSrc||source.src;
      if(!cache.has(src))cache.set(src,imageData(src));
      pending.push(cache.get(src).then(data=>{target.src=data;target.removeAttribute('srcset');target.removeAttribute('loading');}));
    }
  }
  clone.style.cssText += `;position:relative;inset:auto;margin:0;transform:none;width:${width}px;height:${height}px;`;
  clone.querySelectorAll('.room-guideline,.room-alignment-guide,.pet-whisper').forEach(n=>n.remove());
  await Promise.all(pending);
  const body = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(width)}" height="${Math.ceil(height)}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>${xml(extra.join(''))}</style>${body}</div></foreignObject></svg>`;
  const photograph=await loadImage('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg));
  const scale=Math.min(2,1440/width), border=36, footer=92, canvas=document.createElement('canvas');
  canvas.width=Math.round(width*scale)+border*2;canvas.height=Math.round(height*scale)+border*2+footer;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#f3f5f0';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(photograph,border,border,canvas.width-border*2,canvas.height-border*2-footer);
  const baseline=canvas.height-60;
  ctx.fillStyle='#252a28';ctx.font='600 27px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText(fittedText(ctx, name+'的小屋',canvas.width-240),border,baseline);
  ctx.fillStyle='#626a64';ctx.font='17px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText(preview?'搭配预览':'绒角 · 把喜欢的日子收好',border,baseline+30);
  ctx.textAlign='right';ctx.fillText(new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Shanghai'}).format(new Date()),canvas.width-border,baseline+30);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw Error('照片未能保存，请重试。');
  return {blob,width:canvas.width,height:canvas.height};
}
export async function saveRoomPostcard(options) {
  let result;try{result=await createRoomPostcard(options);}catch(error){const known=['等小屋摆好，再留张照片吧。','先打开小屋，再留张照片吧。','这张图片暂时不能收进照片。','图片暂未准备好，请重试。','照片还没准备好，请重试。','暂时拍不了照片，请重试。','照片未能保存，请重试。'];throw Error(known.includes(error.message)?error.message:'暂时拍不了照片，请刷新后重试。');}
  const {blob}=result,url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='绒角-小屋照片.png';document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}

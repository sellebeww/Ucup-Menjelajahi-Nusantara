/* One authored four-direction walk cycle per character, cached after decoding. */
const spriteImageCache = new Map();
const characterSpriteCache = new Map();
function fetchSpriteImage(src) {
  if (!spriteImageCache.has(src)) spriteImageCache.set(src, new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>{spriteImageCache.delete(src);reject(new Error(`Asset gagal dimuat: ${src}`));};
    img.src=src;
  }));
  return spriteImageCache.get(src);
}
function atlasCell(sheet,spec,dir,frame=0) {
  const w=spec.rect?.w ?? Math.floor(sheet.width/spec.cols),h=spec.rect?.h ?? Math.floor(sheet.height/spec.rows);
  const column=spec.type==='walk'?frame:spec.columns[dir];
  const row=spec.type==='walk'?spec.directions[dir]:spec.row;
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const cx=cv.getContext('2d',{willReadFrequently:true});
  cx.drawImage(sheet,spec.rect?.x ?? column*w,spec.rect?.y ?? row*h,w,h,0,0,w,h);
  const data=cx.getImageData(0,0,w,h).data;
  let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>40){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  if(x1<0)return {canvas:cv,x:0,y:0,w,h};
  return {canvas:cv,x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};
}
async function compileCharacter(character) {
  const spec=character.sprite,sheet=await fetchSpriteImage(spec.src);
  const cells=Object.fromEntries(['down','left','right','up'].map(dir=>[dir,Array.from({length:4},(_,f)=>atlasCell(sheet,spec,dir,f))]));
  const all=Object.values(cells).flat();
  const scale=Math.min(54/Math.max(...all.map(cell=>cell.w)),72/Math.max(...all.map(cell=>cell.h)));
  const images={};
  await Promise.all(Object.entries(cells).map(async([dir,frames])=>{
    const strip=document.createElement('canvas');strip.width=256;strip.height=80;
    const cx=strip.getContext('2d');cx.imageSmoothingEnabled=false;
    frames.forEach((cell,f)=>{const w=cell.w*scale,h=cell.h*scale;cx.drawImage(cell.canvas,cell.x,cell.y,cell.w,cell.h,f*64+(64-w)/2,77-h,w,h);});
    images[dir]=await fetchSpriteImage(strip.toDataURL());
  }));
  return {images,frames:4,scale:1};
}
async function loadCharacterSprites(character,onReady) {
  if(!character?.sprite)return;
  try{
    if(!characterSpriteCache.has(character.id))characterSpriteCache.set(character.id,compileCharacter(character));
    onReady(await characterSpriteCache.get(character.id));
  }catch(error){
    characterSpriteCache.delete(character.id);console.warn(error.message);
    const images={};
    await Promise.all(['down','up','left','right'].map(async dir=>{images[dir]=await fetchSpriteImage(`img/player${dir[0].toUpperCase()+dir.slice(1)}.png`);}));
    onReady({images,frames:4,scale:1});
  }
}
Object.assign(window,{loadCharacterSprites,atlasCell,fetchSpriteImage});
window.characterPortraitsReady=Promise.all(CHARACTERS.map(async ch=>{
  try{
    const sheet=await fetchSpriteImage(ch.sprite.src),cell=atlasCell(sheet,ch.sprite,'down');
    const portrait=document.createElement('canvas');portrait.width=180;portrait.height=200;
    const cx=portrait.getContext('2d');cx.imageSmoothingEnabled=false;
    const scale=Math.min(160/cell.w,186/cell.h),w=cell.w*scale,h=cell.h*scale;
    cx.drawImage(cell.canvas,cell.x,cell.y,cell.w,cell.h,(180-w)/2,195-h,w,h);
    const previous=ch.avatar;ch.avatar=portrait.toDataURL();
    document.querySelectorAll('img').forEach(img=>{if(img.getAttribute('src')===previous)img.src=ch.avatar;});
  }catch(error){console.warn('Potret memakai avatar cadangan:',ch.id);}
}));

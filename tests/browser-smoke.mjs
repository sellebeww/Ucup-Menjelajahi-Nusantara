// Uses Chrome's DevTools protocol and an isolated, disposable browser context.
// Start the local server and Chrome with --remote-debugging-port=9223 first.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = process.env.UCUP_TEST_URL || 'http://127.0.0.1:5501';
const debug = process.env.UCUP_DEBUG_URL || 'http://127.0.0.1:9223';
const output = process.env.UCUP_TEST_OUTPUT || '/private/tmp/ucup-checks';
await fs.mkdir(output, {recursive:true});
async function connect(url) {
  const socket = new WebSocket(url); let seq=0; const pending=new Map(); const events=[];
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  socket.onmessage=({data})=>{
    const m=JSON.parse(data);
    if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(m.error):p.resolve(m.result);}}
    else events.push(m);
  };
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++seq;
    const timer=setTimeout(()=>{pending.delete(id);reject(Error(`CDP timeout: ${method}`));},20000);
    pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));
  });
  return {socket,send,events};
}
const info=await(await fetch(`${debug}/json/version`)).json();
const browser=await connect(info.webSocketDebuggerUrl);
const {browserContextId}=await browser.send('Target.createBrowserContext');
const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
const targets=await(await fetch(`${debug}/json/list`)).json();
const page=await connect(targets.find(t=>t.id===targetId).webSocketDebuggerUrl);
const send=page.send;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function evaluate(expression) {
  const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});
  if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function waitFor(expression, timeout=20000) {
  const end=Date.now()+timeout;
  do{try{if(await evaluate(expression))return;}catch{}await sleep(50);}while(Date.now()<end);
  throw Error(`Timed out: ${expression}`);
}
const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
async function key(key,code=key){await send('Input.dispatchKeyEvent',{type:'keyDown',key,code});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code});}
async function shot(name){await sleep(300);const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(`${output}/${name}.png`,Buffer.from(image.data,'base64'));}
async function viewport(width,height,mobile=false){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});}
function pass(name){console.log(`PASS ${name}`);}
try {
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Page.bringToFront');
  await viewport(1440,1000);await send('Page.navigate',{url:`${base}/login.html`});
  await waitFor(`document.querySelector('#loading-screen')?.hidden`);
  await shot('01-welcome-desktop');
  await click('#login-btn');assert.equal(await evaluate(`document.getElementById('player-name').getAttribute('aria-invalid')`),'true');
  await evaluate(`nameInput.value='Penjelajah';document.getElementById('welcome-form').requestSubmit()`);
  await click('[data-id="sari"]');assert.equal(await evaluate('enterBtn.disabled'),true);
  await click('[data-id="ucup"]');assert.equal(await evaluate('enterBtn.disabled'),false);
  await shot('02-characters-desktop');pass('name validation and character locks');
  await click('#enter-btn');await waitFor(`!!window.Expedition && !!window.Minigames && !!window.startTutorial`);
  assert.equal(await evaluate(`Pause.reasons.has('tutorial')`),true);
  await click('#tutorialSkip');await waitFor(`!window.gamePaused`);
  await evaluate(`clearTimeout(Expedition.noticeTimer);Expedition.notices=[];Expedition.noticeTimer=null;document.getElementById('unlockNotice').hidden=true`);
  const start=await evaluate('getPlayerMapPos()');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'s',code:'KeyS'});await sleep(350);
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'s',code:'KeyS'});
  const moved=await evaluate('getPlayerMapPos()');assert.ok(moved.y>start.y,'player moves with WASD');
  await key('b','KeyB');assert.equal(await evaluate('isInventoryOpen()'),true);
  await key('Escape');assert.equal(await evaluate('isInventoryOpen()'),false);
  await key('Escape');assert.equal(await evaluate(`Pause.reasons.has('settings')`),true);
  await click('#resumeBtn');assert.equal(await evaluate('window.gamePaused'),false);
  await shot('03-world-desktop');pass('tutorial, movement, inventory and pause controls');
  // Place the player on a walkable approach; interactions still use visible controls.
  await evaluate(`window.testApproach=id=>{
    const target=INTERACTABLES.find(o=>o.id===id)||npcs.find(o=>o.id===id);
    for(let radius=0;radius<=120;radius+=15)for(let angle=0;angle<360;angle+=30){
      placePlayerAtMap(target.map.x+Math.cos(angle*Math.PI/180)*radius,target.map.y+Math.sin(angle*Math.PI/180)*radius);
      if(canMoveTo(0,0)&&findNearestInteractable()?.id===id){refreshActionBar(true);return true;}
    }
    return false;
  }`);
  assert.equal(await evaluate(`testApproach('atok')`),true);
  assert.equal(await evaluate(`getComputedStyle(document.getElementById('actionBar')).display==='none'`),false);
  await click('#actionButtons button');assert.equal(await evaluate('Dialogue.active'),true);
  await key('Escape');assert.equal(await evaluate(`Expedition.progress.talked.includes('atok')`),false);
  await click('#actionButtons button');
  for(let i=0;i<10&&await evaluate('Dialogue.active');i++)await key('e','KeyE');
  assert.equal(await evaluate(`Expedition.progress.talked.includes('atok')`),true);
  await key('b','KeyB');assert.equal(await evaluate('isInventoryOpen()'),true);
  await key('b','KeyB');assert.equal(await evaluate('isInventoryOpen()'),false);
  const fruitIds=await evaluate(`INTERACTABLES.filter(o=>o.type==='item').slice(0,3).map(o=>o.id)`);
  for(const id of fruitIds){
    assert.equal(await evaluate(`testApproach(${JSON.stringify(id)})`),true,`reachable fruit ${id}`);
    await click('#actionButtons button');
  }
  assert.equal(await evaluate('Expedition.progress.harvests'),3);
  assert.equal(await evaluate(`testApproach('relic_compass')`),true);
  const relicMoney=await evaluate('playerStatus.money');
  await click('#actionButtons button');assert.equal(await evaluate(`Expedition.progress.relics.includes('compass')`),true);
  assert.equal(await evaluate('playerStatus.money'),relicMoney+20);
  await key('Escape');await evaluate(`Adventure.discover('compass');Adventure.discover('shell')`);
  assert.equal(await evaluate('playerStatus.money'),relicMoney+20);
  await key('j','KeyJ');assert.equal(await evaluate('document.getElementById("claimChapter").disabled'),false);
  await shot('14-chapter-ready');await click('#claimChapter');
  assert.equal(await evaluate('Expedition.progress.currentChapter.id'),'sea-calls');
  assert.equal(await evaluate('playerStatus.money'),relicMoney+70);
  assert.equal(await evaluate(`Expedition.progress.claimChapter('first-steps')`),null);
  await key('Escape');
  const approaches=await evaluate(`AdventureData.relics.filter(r=>r.id!=='compass').map(r=>({id:r.id,reachable:testApproach('relic_'+r.id)}))`);
  assert.ok(approaches.every(r=>r.reachable),JSON.stringify(approaches));
  await evaluate(`Expedition.returnHome()`);
  pass('visible actions, cancelled conversations, bag toggle, first chapter and reachable relics');
  await evaluate('characterPortraitsReady');
  await evaluate('Adventure.ready');
  assert.equal(await evaluate('Adventure.iconURLs?.length'),8);
  const atlases=await evaluate(`Promise.all(CHARACTERS.map(async ch=>{
    const compiled=await compileCharacter(ch);
    const cv=document.createElement('canvas');cv.width=256;cv.height=80;
    const cx=cv.getContext('2d',{willReadFrequently:true});
    const directions=Object.values(compiled.images).map(img=>{
      cx.clearRect(0,0,256,80);cx.drawImage(img,0,0);
      const first=cx.getImageData(0,0,64,80).data,second=cx.getImageData(64,0,64,80).data;
      return {size:img.naturalWidth===256&&img.naturalHeight===80,animated:first.some((v,i)=>v!==second[i]),transparent:first.some((v,i)=>i%4===3&&v===0),visible:first.some((v,i)=>i%4===3&&v>0)};
    });return {id:ch.id,ready:directions.every(d=>d.size&&d.animated&&d.transparent&&d.visible)};
  }))`);
  assert.ok(atlases.every(a=>a.ready),JSON.stringify(atlases));
  pass('six transparent character atlases animate independently in all four directions');
  for(const tab of ['journal','map','friends','challenges','camp']){
    await click(tab==='camp'?'#campBtn':`[data-panel="${tab}"]`);
    assert.equal(await evaluate('Expedition.tab'),tab);
    assert.equal(await evaluate('window.gamePaused'),true);
    if(tab==='challenges')await shot('04-challenges-desktop');
    await key('Escape');assert.equal(await evaluate('window.gamePaused'),false);
  }
  pass('all five expedition panels open and close');
  await key('g','KeyG');await click('[data-game="fishing"]');
  const moneyBeforeCancel=await evaluate('playerStatus.money');
  await click('#miniStart');await key('Escape');
  assert.equal(await evaluate('playerStatus.money'),moneyBeforeCancel);
  assert.equal(await evaluate('Expedition.progress.daily.play'),0);
  pass('abandoned rounds award no money or progression');
  // Win fishing through the actual button while the needle is in the target.
  await key('g','KeyG');await click('[data-game="fishing"]');await click('#miniStart');
  await shot('05-fishing');
  for(let i=0;i<5;i++){
    await waitFor(`Minigames.active && !Minigames.busy && Minigames.cursor > Minigames.targetStart+.03 && Minigames.cursor < Minigames.targetStart+Minigames.targetWidth-.03`);
    await click('#catchFish');await sleep(950);
  }
  await waitFor('Minigames.finished');assert.equal(await evaluate('Expedition.progress.wins.fishing'),1);
  assert.equal(await evaluate(`Expedition.progress.unlocked.includes('sari')`),true);
  const paid=await evaluate('playerStatus.money');await evaluate('Minigames.finish(true,5,5)');
  assert.equal(await evaluate('playerStatus.money'),paid);await key('Escape');
  pass('fishing victory unlocks Sari; rewards pay once');
  // The generated recipe is the oracle; all input still uses its visible buttons.
  await key('g','KeyG');await click('[data-game="cooking"]');await click('#miniStart');
  await shot('06-cooking');
  for(let round=1;round<=5;round++){
    await waitFor(`Minigames.round===${round} && Minigames.phase==='input'`);
    const recipe=await evaluate('Minigames.recipe');
    for(const spice of recipe)await click(`[data-spice="${spice}"]`);
  }
  await waitFor('Minigames.finished');assert.equal(await evaluate('Expedition.progress.wins.cooking'),1);
  assert.equal(await evaluate(`Expedition.progress.unlocked.includes('gori')`),true);await key('Escape');
  pass('five cooking recipes unlock Bang Gori');
  await key('g','KeyG');await click('[data-game="memory"]');await click('#miniStart');
  await shot('07-memory');
  const cards=await evaluate('Minigames.cards');
  for(const fruit of new Set(cards)){
    const pair=cards.flatMap((name,i)=>name===fruit?[i]:[]);
    for(const index of pair)await click(`[data-card="${index}"]`);
  }
  await waitFor('Minigames.finished');assert.equal(await evaluate('Expedition.progress.wins.memory'),1);
  assert.equal(await evaluate(`Expedition.progress.unlocked.includes('kirana')`),true);
  await shot('08-unlock-result');await click('#miniDone');await click('[data-character="kirana"]');
  assert.equal(await evaluate('GameState.characterId'),'kirana');await key('Escape');
  pass('memory victory unlocks and equips Kirana');
  await key('g','KeyG');await click('[data-game="rhythm"]');await click('#miniStart');
  await shot('15-rhythm-desktop');
  for(let round=1;round<=8;round++){
    await waitFor(`Minigames.round===${round} && !Minigames.busy && Minigames.beatTime>1700 && Minigames.beatTime<2150`);
    const note=await evaluate('Minigames.expectedNote');
    await key(String(note+1),`Digit${note+1}`);
  }
  await waitFor('Minigames.finished');
  assert.equal(await evaluate('Expedition.progress.wins.rhythm'),1);
  assert.equal(await evaluate(`Expedition.progress.unlocked.includes('atok')`),true);
  const rhythmPaid=await evaluate('playerStatus.money');await evaluate('Minigames.finish(true,8,8)');
  assert.equal(await evaluate('playerStatus.money'),rhythmPaid);
  await key('Escape');pass('eight real-time bamboo notes unlock Atok with a single payout');
  // Reload after an intentional save with nondefault inventory, location and time.
  await evaluate(`Expedition.returnHome();gameTime.set(13,24);addItemToInventory({...itemDef('Apel')});Expedition.save();Pause.set('test',true)`);
  const before=await evaluate(`({xp:Expedition.progress.xp,day:Expedition.progress.day,money:playerStatus.money,items:inventoryItems.map(i=>i.name),pos:getPlayerMapPos(),hour:GameState.hour,minute:GameState.minute})`);
  // Freeze at DOM readiness, before waiting for rendering and decoded sprites.
  const freezeScript=await send('Page.addScriptToEvaluateOnNewDocument',{source:`document.addEventListener('DOMContentLoaded',()=>window.Pause?.set('test',true),{once:true});`});
  await send('Page.reload');await waitFor('!!window.Expedition && !!window.Minigames');await evaluate(`Pause.set('test',true)`);
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:freezeScript.identifier});
  const after=await evaluate(`({xp:Expedition.progress.xp,day:Expedition.progress.day,money:playerStatus.money,items:inventoryItems.map(i=>i.name),pos:getPlayerMapPos(),hour:GameState.hour,minute:GameState.minute})`);
  assert.deepEqual(after,before);assert.equal(await evaluate('GameState.characterId'),'kirana');
  pass('reload restores character, XP, money, inventory, position and clock');
  await evaluate(`gameTime.set(23,59);gameTime.advance(1)`);
  const midnight=await evaluate(`({day:Expedition.progress.day,hour:GameStorage.read().hour,minute:GameStorage.read().minute})`);
  assert.equal(midnight.day,before.day+1);assert.equal(midnight.hour,0);assert.equal(midnight.minute,0);
  await evaluate(`Pause.set('test',false);Expedition.returnHome()`);await click('#campBtn');await click('#sleepNow');
  assert.equal(await evaluate('Expedition.progress.day'),midnight.day+1);
  assert.equal(await evaluate('GameState.hour'),7);assert.equal(await evaluate('Expedition.progress.daily.play'),0);
  pass('midnight and rest advance the day once and reset daily tasks');
  // Report destinations with blocked arrival points so travel can be verified.
  const travel=await evaluate(`REGIONS.map((r,i)=>{if(!Expedition.progress.visited.includes(r.id))Expedition.progress.record('visit',r.id);playerStatus.money=100;Expedition.travel(i);return {name:r.name,free:canMoveTo(0,0),location:getCurrentLocation(player,background)}})`);
  console.log('Travel arrival points:',JSON.stringify(travel));
  assert.ok(travel.every(r=>r.free),'fast travel must arrive on walkable tiles');
  await evaluate(`Expedition.returnHome();Pause.set('test',true)`);
  await viewport(390,844,true);
  await waitFor('innerWidth===390 && visualViewport.scale===1');
  await shot('09-world-mobile');
  for(const tab of ['journal','map','friends','challenges','camp']){
    await evaluate(`Expedition.open('${tab}')`);
    const bounds=await evaluate(`(()=>{const r=document.querySelector('.journal-shell').getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,w:innerWidth,h:innerHeight,overflow:document.querySelector('#journalContent').scrollWidth>document.querySelector('#journalContent').clientWidth+1}})()`);
    assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.right<=bounds.w&&bounds.bottom<=bounds.h&&!bounds.overflow,JSON.stringify({tab,...bounds}));
    if(tab==='journal')await shot('10-journal-mobile');
    if(tab==='friends')await shot('11-friends-mobile');
    await key('Escape');
  }
  pass('mobile panels fit 390 × 844 with scrollable content');
  for(const id of ['fishing','cooking','memory','rhythm']){
    await evaluate(`Minigames.start('${id}')`);await click('#miniStart');
    assert.equal(await evaluate(`document.getElementById('miniContent').scrollWidth > document.getElementById('miniContent').clientWidth+1`),false);
    if(id==='memory')await shot('13-memory-mobile');
    if(id==='rhythm')await shot('16-rhythm-mobile');
    await key('Escape');
  }
  pass('all four minigames fit the mobile viewport');
  await viewport(320,640,true);
  await evaluate(`Expedition.open('journal')`);
  assert.equal(await evaluate(`document.getElementById('journalContent').scrollWidth>document.getElementById('journalContent').clientWidth+1`),false);
  await key('Escape');await evaluate(`Minigames.start('rhythm')`);await click('#miniStart');
  assert.equal(await evaluate(`document.getElementById('miniContent').scrollWidth>document.getElementById('miniContent').clientWidth+1`),false);
  await key('Escape');await viewport(390,844,true);
  pass('chapters and bamboo game also fit a 320 × 640 viewport');
  await evaluate(`playerStatus.meal=0;Expedition.save()`);await send('Page.reload');await waitFor(`document.getElementById('gameOverOverlay')?.classList.contains('show')`);
  assert.ok((await evaluate(`document.getElementById('gameOverReason').textContent`)).includes('kelaparan'));
  const savedXp=await evaluate('Expedition.progress.xp');await click('#restartBtn');assert.equal(await evaluate('gameOver'),false);assert.equal(await evaluate('Expedition.progress.xp'),savedXp);
  pass('exhausted saves restore their reason and recover without losing progress');
  await send('Page.navigate',{url:`${base}/login.html`});await waitFor(`document.querySelector('#loading-screen')?.hidden`);
  assert.equal(await evaluate(`document.getElementById('continue-btn').hidden`),false);
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
  await shot('12-welcome-mobile');await click('#continue-btn');await waitFor('!!window.Expedition && !!window.Minigames');
  pass('mobile welcome and continue saved journey');
  const errors=page.events.filter(e=>e.method==='Runtime.exceptionThrown');
  const failed=page.events.filter(e=>e.method==='Network.responseReceived'&&e.params.response.status>=400).map(e=>({url:e.params.response.url,status:e.params.response.status}));
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  pass('no JavaScript exceptions or failed HTTP resources');
  console.log(`Screenshots: ${output}`);
} catch (error) {
  console.error('Browser errors:',page.events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails));
  console.error('Minigame state:',await evaluate(`window.Minigames ? ({id:Minigames.id,round:Minigames.round,phase:Minigames.phase,score:Minigames.score,active:Minigames.active,hidden:document.hidden,timers:[...Minigames.timers].map(t=>t.remaining)}) : null`).catch(()=>null));
  await shot('failure').catch(()=>{});
  throw error;
} finally {
  page.socket.close();await browser.send('Target.disposeBrowserContext',{browserContextId});browser.socket.close();
}

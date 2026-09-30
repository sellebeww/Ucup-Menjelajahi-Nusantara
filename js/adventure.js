/* Story chapters and seven discoveries give every outing a purpose. */
const Adventure = {
  icons: [], ready: null, lastLocation: '', bannerTimer: null,
  init() {
    this.ready = fetchSpriteImage('assets/world/relics.png').then(sheet => {
      // The authored atlas has uneven gutters. Use its actual object boundaries
      // so cloth and shell pixels never spill into a neighbouring icon.
      const cuts=[[0,310,645,936,1254],[0,350,600,965,1254]],sourceScale=sheet.width/1254;
      this.icons = Array.from({length:8},(_,i)=>{
        const row=Math.floor(i/4),col=i%4;
        const rect={x:cuts[row][col]*sourceScale,y:row*sheet.height/2,w:(cuts[row][col+1]-cuts[row][col])*sourceScale,h:sheet.height/2};
        const cell=atlasCell(sheet,{cols:4,rows:2,row,columns:{down:col},rect},'down');
        const cv=document.createElement('canvas');cv.width=128;cv.height=128;
        const cx=cv.getContext('2d');cx.imageSmoothingEnabled=false;
        const scale=Math.min(114/cell.w,114/cell.h),w=cell.w*scale,h=cell.h*scale;
        cx.drawImage(cell.canvas,cell.x,cell.y,cell.w,cell.h,(128-w)/2,(128-h)/2,w,h);
        return cv;
      });
      this.iconURLs=this.icons.map(cv=>cv.toDataURL());
    }).catch(error=>console.warn('Ikon penemuan memakai simbol cadangan:',error.message));
    AdventureData.relics.forEach(relic=>INTERACTABLES.push({id:`relic_${relic.id}`,type:'relic',name:relic.name,area:relic.region,map:relic.map,relic:relic.id,desc:'Sebuah peninggalan menunggu untuk dicatat di jurnal.',actions:[{label:'CATAT PENINGGALAN',relic:relic.id}]}));
    document.body.insertAdjacentHTML('beforeend','<div id="regionArrival" role="status" hidden><span>LANGKAH BARU</span><strong></strong><small></small></div>');
  },
  icon(index,className='relic-art') {
    return this.iconURLs?.[index] ? `<img class="${className}" src="${this.iconURLs[index]}" alt="">` : `<span class="${className}">✦</span>`;
  },
  discover(id) {
    const relic=AdventureData.relics.find(r=>r.id===id);
    if(!relic||Expedition.progress.relics.includes(id)||window.inputLocked||gameOver)return;
    if(Math.hypot(getPlayerMapPos().x-relic.map.x,getPlayerMapPos().y-relic.map.y)>INTERACT_RADIUS+1)return;
    const result=Expedition.record('relic',id);
    if(!result.changed)return;
    applyStatusEffect({money:20,happiness:6});
    Expedition.save();this.burst={map:relic.map,at:performance.now()};
    Dialogue.open(relic.name,[relic.lore,'Dicatat di jurnal penemuan. +20 koin · +35 XP. Peninggalan ini tetap terjaga di tempatnya.'],{portrait:this.iconURLs?.[relic.icon]});
    refreshActionBar(true);
  },
  draw() {
    const time=performance.now();
    AdventureData.relics.forEach(relic=>{
      if(Expedition.progress.relics.includes(relic.id))return;
      const s=mapToScreen(relic.map);
      if(s.x<-80||s.y<-80||s.x>canvas.width+80||s.y>canvas.height+80)return;
      c.save();c.fillStyle='#254a3850';c.beginPath();c.ellipse(s.x,s.y+10,20,7,0,0,Math.PI*2);c.fill();
      c.strokeStyle='#ffe8a4';c.lineWidth=1.5;c.setLineDash([4,4]);c.beginPath();c.ellipse(s.x,s.y+10,25,10,0,0,Math.PI*2);c.stroke();
      if(this.icons[relic.icon])c.drawImage(this.icons[relic.icon],s.x-26,s.y-42+Math.sin(time/650+relic.icon)*3,52,52);
      else {c.fillStyle='#ffe6a2';c.font='24px serif';c.fillText('✦',s.x-12,s.y);}
      c.restore();
    });
    if(this.burst){
      const age=(time-this.burst.at)/1000,s=mapToScreen(this.burst.map);
      if(age>1.2)this.burst=null;
      else {c.save();c.globalAlpha=1-age/1.2;c.fillStyle='#ffdc81';for(let i=0;i<10;i++){const a=i*Math.PI/5;c.fillRect(s.x+Math.cos(a)*age*75,s.y+Math.sin(a)*age*75,3,3);}c.restore();}
    }
  },
  arrive(id) {
    if(this.lastLocation===id)return;this.lastLocation=id;
    const region=AdventureData.regions.find(r=>r.id===id);if(!region)return;
    const el=document.getElementById('regionArrival');el.querySelector('strong').textContent=region.name;el.querySelector('small').textContent=region.subtitle;
    el.hidden=false;clearTimeout(this.bannerTimer);this.bannerTimer=setTimeout(()=>el.hidden=true,3200);
  },
  chapterHTML() {
    const p=Expedition.progress,q=p.currentChapter;
    if(!q)return `<section class="chapter-card chapter-finale"><span class="eyebrow">BUKU PERJALANAN LENGKAP</span><h2>Sahabat Nusantara.</h2><p>Tujuh wilayah, banyak teman, dan satu buku penuh cerita. Semua bab selesai; dunia masih terbuka untuk perjalananmu berikutnya.</p><span class="chapter-seal">✦</span></section>`;
    const done=p.chapterComplete(q);
    return `<section class="chapter-card"><div class="chapter-cover"><span class="eyebrow">${q.subtitle}</span><h2>${q.title}</h2><p>${q.description}</p><span class="chapter-count">${p.chapters.length+1} / ${AdventureData.chapters.length} BAB</span></div><div class="chapter-objectives">${q.goals.map((g,i)=>{
      const n=Math.min(g.total,p.goalValue(g)),complete=n>=g.total;
      return `<button data-objective="${i}" class="objective ${complete?'done':''}" ${complete?'disabled':''}><span class="objective-check">${complete?'✓':'○'}</span><span>${g.label}<small>${complete?'Tercatat di perjalananmu':'Klik untuk mengikuti tujuan'}</small></span><b>${n}/${g.total}</b><span>${complete?'':'↗'}</span></button>`;
    }).join('')}</div><div class="chapter-reward"><span>Hadiah bab <b>${q.coins} koin + ${q.xp} XP</b></span><button class="primary-button" id="claimChapter" ${done?'':'disabled'}>${done?'Selesaikan bab →':'Lanjutkan petualangan'}</button></div></section>`;
  },
  collectionHTML() {
    const p=Expedition.progress;
    return `<div class="section-line"><h2>Benda kecil, cerita besar</h2><span>${p.relics.length} / 7 penemuan</span></div><p class="panel-lead">Dekati benda berkilau dan catat kisahnya. Lima penemuan membuka Rimba.</p><div class="relic-grid">${AdventureData.relics.map((r,i)=>`<button class="relic-card ${p.relics.includes(r.id)?'found':''}" data-relic="${i}">${this.icon(r.icon)}<small>${AdventureData.regions.find(v=>v.id===r.region).name}</small><strong>${r.name}</strong><span>${p.relics.includes(r.id)?'Baca ceritanya ↗':'Tandai di peta ↗'}</span></button>`).join('')}</div>`;
  },
  outingHTML() {
    const p=Expedition.progress,r=AdventureData.regions.find(r=>r.id===p.outingRegion);
    return `<div class="outing-card"><span class="outing-icon">⌖</span><div><span class="eyebrow">AJAKAN HARI INI</span><strong>Mampir ke ${r.name}</strong><p>Kunjungi wilayah ini dan periksa satu tempat atau catat peninggalan hari ini.</p><small>25 koin + 15 XP · ${p.outingComplete?'Siap diambil':'Ada cerita menantimu'}</small></div><button class="small-button" id="outingTrack">Tandai</button><button class="primary-button" id="outingClaim" ${p.outingComplete&&!p.today.outingClaimed?'':'disabled'}>${p.today.outingClaimed?'Diambil ✓':'Ambil'}</button></div>`;
  },
  enhanceJournal() {
    const el=document.getElementById('journalContent');
    el.insertAdjacentHTML('afterbegin',this.chapterHTML());
    el.insertAdjacentHTML('beforeend',this.outingHTML()+this.collectionHTML());
    const yesterday=Expedition.progress.lastDay;
    if(yesterday)el.insertAdjacentHTML('beforeend',`<details class="yesterday-note"><summary>Lembar kemarin · Hari ${yesterday.day}</summary><p>${yesterday.collect} buah dikumpulkan · ${yesterday.talk} warga disapa · ${yesterday.play} tantangan dimainkan · ${yesterday.relics} penemuan dicatat · ${yesterday.xp} XP.</p></details>`);
    el.querySelectorAll('[data-objective]').forEach(b=>b.onclick=()=>this.trackGoal(Number(b.dataset.objective)));
    const claim=el.querySelector('#claimChapter');
    if(claim)claim.onclick=()=>{
      const q=Expedition.progress.currentChapter,reward=Expedition.progress.claimChapter(q?.id);if(!reward)return;
      applyStatusEffect({money:reward.coins});Expedition.save();Expedition.renderHUD();Expedition.renderPanel();
      Expedition.notify('BAB SELESAI',reward.title,`+${reward.coins} koin · +${reward.xp} XP${Expedition.progress.currentChapter?' · Bab berikutnya terbuka':' · Gelar Sahabat Nusantara diraih'}`);
    };
    el.querySelector('#outingTrack').onclick=()=>this.trackRegion(Expedition.progress.outingRegion);
    el.querySelector('#outingClaim').onclick=()=>{if(Expedition.progress.claimOuting()){applyStatusEffect({money:25});Expedition.save();Expedition.renderHUD();Expedition.renderPanel();showToast('Ajakan harian selesai! +25 koin · +15 XP');}};
    el.querySelectorAll('[data-relic]').forEach(b=>b.onclick=()=>{
      const r=AdventureData.relics[Number(b.dataset.relic)];
      if(Expedition.progress.relics.includes(r.id)){
        Expedition.close();Dialogue.open(r.name,[r.lore],{portrait:this.iconURLs?.[r.icon]});
      }else this.track({name:r.name,map:r.map});
    });
  },
  track(target) {if(!target)return;Expedition.waypoint=target;Expedition.close();Expedition.renderHUD();showToast(`Tujuan ditandai: ${safeText(target.name)}`);},
  trackRegion(id) {this.track(AdventureData.regions.find(r=>r.id===id));},
  trackGoal(index) {
    const q=Expedition.progress.currentChapter,g=q?.goals[index];if(!g)return;
    const [type,id]=g.target.split(':');
    if(type==='game'){Expedition.close();Minigames.start(id);return;}
    if(type==='camp'){Expedition.open('camp');return;}
    if(type==='region'){this.trackRegion(id);return;}
    if(type==='npc'){const n=NPC_DATA.find(n=>n.id===id);this.track(n);return;}
    if(type==='item'){
      const pos=getPlayerMapPos(),items=INTERACTABLES.filter(o=>o.type==='item'&&!o.taken).sort((a,b)=>Math.hypot(a.map.x-pos.x,a.map.y-pos.y)-Math.hypot(b.map.x-pos.x,b.map.y-pos.y));
      this.track(items[0]||INTERACTABLES.find(o=>o.id==='kebun_home'));return;
    }
    if(type==='site'){this.track(INTERACTABLES.find(o=>!Expedition.progress.inspected.includes(o.id)&&['landmark','nature','building'].includes(o.type))||INTERACTABLES.find(o=>o.id===id));return;}
    if(type==='relic'){this.track(AdventureData.relics.find(r=>r.id===id));return;}
    if(type==='next-relic'){this.track(AdventureData.relics.find(r=>!Expedition.progress.relics.includes(r.id)));return;}
    if(type==='next-region')this.track(AdventureData.regions.find(r=>!Expedition.progress.visited.includes(r.id)));
  },
  characterProgress(ch) {
    const p=Expedition.progress;if(p.unlocked.includes(ch.id))return {ratio:1,label:'Siap menemanimu'};
    const game={sari:'fishing',gori:'cooking',kirana:'memory'}[ch.id];
    if(game)return {ratio:Math.min(1,p.wins[game]),label:`${p.wins[game]}/1 kemenangan`};
    if(ch.id==='atok')return {ratio:Math.max(p.wins.rhythm>0?1:0,(Math.min(4,p.visited.length)+(p.day>=2?1:0))/5),label:`${Math.min(4,p.visited.length)}/4 wilayah · Hari ${Math.min(2,p.day)}/2, atau menang Irama Bambu`};
    if(ch.id==='rimba')return {ratio:Math.max(p.collected.length/6,p.relics.length/5),label:`${Math.min(6,p.collected.length)}/6 jenis buah · ${Math.min(5,p.relics.length)}/5 penemuan`};
    return {ratio:1,label:'Teman pertamamu'};
  },
  enhanceFriends() {
    document.querySelectorAll('[data-character]').forEach(b=>{const ch=getCharacter(b.dataset.character),state=this.characterProgress(ch);if(!Expedition.progress.unlocked.includes(ch.id))b.insertAdjacentHTML('beforebegin',`<div class="unlock-progress"><span><i style="width:${Math.min(100,state.ratio*100)}%"></i></span><small>${state.label}</small></div>`);});
  },
  enhanceCamp() {
    const p=Expedition.progress,el=document.querySelector('.camp-scene');el.classList.add('camp-illustrated');
    document.querySelector('.camp-copy').insertAdjacentHTML('beforeend',`<div class="day-review"><span class="eyebrow">YANG KAMU BAWA PULANG HARI INI</span><div><span><b>${p.daily.collect}</b> buah</span><span><b>${p.daily.talk.length}</b> percakapan</span><span><b>${p.today.relics.length}</b> penemuan</span><span><b>${p.today.xp}</b> XP</span></div>${p.dailyComplete&&!p.daily.claimed?'<p>Hadiah misi harian belum diambil. Buka jurnal sebelum tidur agar hadiah tidak terlewat.</p>':''}</div>`);
  }
};
window.Adventure=Adventure;Adventure.init();

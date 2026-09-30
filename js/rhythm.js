/* A timing game with four bamboo notes; audio is optional, visual cues suffice. */
Minigames.definitions.rhythm = {
  name:'Irama Bambu',tag:'IRAMA · 8 NADA',symbol:'♫',character:'atok',
  description:'Pilih bambu yang menyala saat penunjuk masuk zona emas. Tepatkan 5 dari 8 nada untuk mengajak Atok.',
  headline:'Dengarkan. Rasakan. Mainkan.',
  instructions:'Tekan angka 1–4 atau sentuh bambunya. Cocokkan nada yang ditandai, lalu ketuk ketika penunjuk berada di zona emas. Bisa dimainkan tanpa suara.'
};
Object.assign(Minigames,{
  bambooNotes:[{label:'DO',frequency:261.63},{label:'RE',frequency:293.66},{label:'MI',frequency:329.63},{label:'SOL',frequency:392}],
  rhythm(){
    this.round=0;this.score=0;this.beatResults=[];this.combo=0;this.beatTime=0;
    document.getElementById('miniContent').innerHTML=`<div class="mini-game-top"><span id="rhythmRound"></span><span id="rhythmCombo">Ikuti iramanya</span></div><div class="bamboo-garden"><span class="garden-moon">☾</span><i></i><i></i><i></i><div class="bamboo-sign"><small>NADA BERIKUTNYA</small><strong id="rhythmNote">DO</strong></div></div><p id="rhythmStatus" class="mini-status" aria-live="polite">Ketuk bambu yang menyala saat penunjuk masuk zona emas.</p><div class="rhythm-track"><span></span><i id="rhythmNeedle"></i></div><div class="fishing-scale"><span>DENGARKAN</span><span>EMAS = KETUK</span><span>LEWAT</span></div><div class="bamboo-keys">${this.bambooNotes.map((note,i)=>`<button data-note="${i}" aria-label="Nada ${note.label}, tombol ${i+1}"><span class="bamboo-tube"></span><strong>${note.label}</strong><kbd>${i+1}</kbd></button>`).join('')}</div><div id="rhythmResults" class="catch-results"></div>`;
    document.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>this.hitNote(Number(b.dataset.note)));
    this.nextBeat();this.loop();document.querySelector('[data-note]').focus();
  },
  nextBeat(){
    if(this.round>=8)return this.finish(this.score>=5,this.score,8);
    this.round++;this.busy=false;this.beatTime=0;this.expectedNote=Math.floor(Math.random()*4);
    document.getElementById('rhythmRound').textContent=`NADA ${this.round} / 8 · ${this.score} TEPAT`;
    document.getElementById('rhythmNote').textContent=this.bambooNotes[this.expectedNote].label;
    document.getElementById('rhythmStatus').textContent='Tunggu zona emas, lalu ketuk bambu yang menyala.';
    document.getElementById('rhythmNeedle').style.left='0%';
    document.querySelectorAll('[data-note]').forEach(b=>{b.disabled=false;b.classList.toggle('expected',Number(b.dataset.note)===this.expectedNote);b.setAttribute('aria-label',`${this.bambooNotes[Number(b.dataset.note)].label}${Number(b.dataset.note)===this.expectedNote?', nada yang harus dimainkan':''}`);});
  },
  updateRhythm(delta){
    this.beatTime+=delta;
    const needle=document.getElementById('rhythmNeedle');if(needle)needle.style.left=`${Math.min(1,this.beatTime/2600)*100}%`;
    if(this.beatTime>=2700)this.endBeat(false,'Nadanya lewat. Tetap ikuti irama berikutnya.');
  },
  hitNote(index){
    if(!this.active||!this.playing||this.finished||this.busy||this.id!=='rhythm'||!this.bambooNotes[index])return;
    this.playNote(index);
    const inTime=this.beatTime>=1560&&this.beatTime<=2340;
    const success=inTime&&index===this.expectedNote;
    this.endBeat(success,success?'Pas! Bambu-bambu itu bernyanyi bersamamu.':index!==this.expectedNote?'Bambu yang berbeda. Perhatikan nada yang menyala.':this.beatTime<1560?'Sedikit terlalu cepat. Tunggu penunjuk mencapai emas.':'Terlambat sedikit. Masih ada nada berikutnya.');
  },
  endBeat(success,message){
    if(this.busy||this.finished)return;this.busy=true;
    if(success){this.score++;this.combo++;}else this.combo=0;
    this.beatResults.push(success);
    document.getElementById('rhythmStatus').textContent=message;
    document.getElementById('rhythmCombo').textContent=this.combo>1?`${this.combo} NADA BERUNTUN`:'Teruskan melodinya';
    document.querySelectorAll('[data-note]').forEach(b=>b.disabled=true);
    document.getElementById('rhythmResults').innerHTML=this.beatResults.map(hit=>`<span class="${hit?'hit':''}">${hit?'♪':'·'}</span>`).join('');
    this.later(()=>this.nextBeat(),650);
  },
  playNote(index){
    if(GameStorage.get('musicMuted')==='1')return;
    try{
      const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;
      this.audioContext ||= new AudioContext();const ctx=this.audioContext;ctx.resume().catch(()=>{});
      const oscillator=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;
      oscillator.type='sine';oscillator.frequency.value=this.bambooNotes[index].frequency;
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.12,now+.025);gain.gain.exponentialRampToValueAtTime(.001,now+.42);
      oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(now);oscillator.stop(now+.45);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    }catch{}
  }
});
window.addEventListener('keydown',e=>{
  if(!Minigames.active||Minigames.id!=='rhythm'||!Minigames.playing||e.repeat)return;
  if(/^[1-4]$/.test(e.key)){e.preventDefault();e.stopImmediatePropagation();Minigames.hitNote(Number(e.key)-1);}
},true);

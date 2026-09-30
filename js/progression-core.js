/* Pure progression rules; old v2 saves gain the new journal fields in place. */
(function(root) {
  'use strict';
  const data = root.AdventureData || (typeof require === 'function' ? require('./adventure-data.js') : null);
  const IDS = ['ucup','sari','gori','kirana','atok','rimba'];
  const finite = (n, fallback=0, max=1000000) => Number.isFinite(n) ? Math.max(0,Math.min(max,Math.floor(n))) : fallback;
  const strings = a => Array.isArray(a) ? [...new Set(a.filter(s=>typeof s==='string'&&s.length<80))].slice(0,150) : [];
  const valid = (a, allowed) => strings(a).filter(s=>allowed.includes(s));
  class ExpeditionProgress {
    constructor(saved={}) {
      saved=saved&&typeof saved==='object'?saved:{};
      this.day=Math.max(1,finite(saved.day,1)); this.xp=finite(saved.xp);
      this.visited=valid(saved.visited,data.regions.map(r=>r.id));
      this.collected=valid(saved.collected,data.fruits); this.talked=strings(saved.talked);
      this.relics=valid(saved.relics,data.relics.map(r=>r.id)); this.inspected=strings(saved.inspected);
      this.harvests=finite(saved.harvests,this.collected.length);
      this.chapters=valid(saved.chapters,data.chapters.map(q=>q.id));
      this.wins=Object.fromEntries(data.games.map(k=>[k,finite(saved.wins?.[k])]));
      this.best=Object.fromEntries(data.games.map(k=>[k,finite(saved.best?.[k],0,100)]));
      this.unlocked=[...new Set(['ucup',...valid(saved.unlocked,IDS)])];
      this.daily={collect:finite(saved.daily?.collect),talk:strings(saved.daily?.talk),play:finite(saved.daily?.play),claimed:saved.daily?.claimed===true};
      this.today={visits:valid(saved.today?.visits,data.regions.map(r=>r.id)),relics:valid(saved.today?.relics,data.relics.map(r=>r.id)),sites:strings(saved.today?.sites),xp:finite(saved.today?.xp),outingClaimed:saved.today?.outingClaimed===true};
      this.lastDay = saved.lastDay && typeof saved.lastDay==='object' ? Object.fromEntries(['day','collect','talk','play','relics','xp'].map(k=>[k,finite(saved.lastDay[k])])) : null;
    }
    get level(){return 1+Math.floor(this.xp/100);}
    record(type,value) {
      let xp=0,changed=false;
      const add=(array,item)=>{if(!array.includes(item)){array.push(item);changed=true;return true;}return false;};
      if(type==='visit'&&data.regions.some(r=>r.id===value)) {if(add(this.visited,value))xp=30;add(this.today.visits,value);}
      if(type==='collect'&&data.fruits.includes(value)){this.daily.collect++;this.harvests++;changed=true;if(add(this.collected,value))xp=10;}
      if(type==='talk'&&typeof value==='string'){if(add(this.talked,value))xp=15;add(this.daily.talk,value);}
      if(type==='inspect'&&typeof value==='string'){if(add(this.inspected,value))xp=8;add(this.today.sites,value);}
      if(type==='relic'&&data.relics.some(r=>r.id===value)&&add(this.relics,value)){xp=35;add(this.today.relics,value);}
      if(type==='minigame'&&value&&Object.hasOwn(this.wins,value.id)){
        this.daily.play++;changed=true;this.best[value.id]=Math.max(this.best[value.id],finite(value.score,0,100));
        if(value.won===true){this.wins[value.id]++;xp=25;}else xp=5;
      }
      this.xp+=xp;this.today.xp+=xp;
      return {xp,changed,unlocked:this.checkUnlocks()};
    }
    checkUnlocks(){
      const conditions={sari:this.wins.fishing>0,gori:this.wins.cooking>0,kirana:this.wins.memory>0,atok:this.wins.rhythm>0||(this.day>=2&&this.visited.length>=4),rimba:this.collected.length>=6||this.relics.length>=5};
      const added=Object.keys(conditions).filter(id=>conditions[id]&&!this.unlocked.includes(id));this.unlocked.push(...added);return added;
    }
    goalValue(goal){
      switch(goal.type){
        case 'talk':return Number(this.talked.includes(goal.value));
        case 'visit':return Number(this.visited.includes(goal.value));
        case 'relic':return Number(this.relics.includes(goal.value));
        case 'win':return this.wins[goal.value]||0;
        case 'harvest':return this.harvests;
        case 'regions':return this.visited.length;
        case 'relics':return this.relics.length;
        case 'inspect':return this.inspected.length;
        case 'day':return this.day;
        default:return 0;
      }
    }
    get currentChapter(){return data.chapters.find(q=>!this.chapters.includes(q.id))||null;}
    chapterComplete(chapter=this.currentChapter){return !!chapter&&chapter.goals.every(g=>this.goalValue(g)>=g.total);}
    claimChapter(id){
      const q=this.currentChapter;if(!q||q.id!==id||!this.chapterComplete(q))return null;
      this.chapters.push(id);this.xp+=q.xp;this.today.xp+=q.xp;
      return {coins:q.coins,xp:q.xp,title:q.title};
    }
    get dailyComplete(){return this.daily.collect>=3&&this.daily.talk.length>=2&&this.daily.play>=1;}
    claimDaily(){if(!this.dailyComplete||this.daily.claimed)return false;this.daily.claimed=true;this.xp+=40;this.today.xp+=40;return true;}
    get outingRegion(){return data.route[(this.day-1)%data.route.length];}
    get outingComplete(){return this.today.visits.includes(this.outingRegion)&&this.today.sites.length+this.today.relics.length>0;}
    claimOuting(){if(!this.outingComplete||this.today.outingClaimed)return false;this.today.outingClaimed=true;this.xp+=15;this.today.xp+=15;return true;}
    nextDay(){
      this.lastDay={day:this.day,collect:this.daily.collect,talk:this.daily.talk.length,play:this.daily.play,relics:this.today.relics.length,xp:this.today.xp};
      this.day++;this.daily={collect:0,talk:[],play:0,claimed:false};
      this.today={visits:[],relics:[],sites:[],xp:0,outingClaimed:false};
      return this.checkUnlocks();
    }
  }
  root.ExpeditionProgress=ExpeditionProgress;
  if(typeof module!=='undefined')module.exports={ExpeditionProgress};
})(typeof window!=='undefined'?window:globalThis);

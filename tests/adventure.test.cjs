const test = require('node:test');
const assert = require('node:assert/strict');
const {ExpeditionProgress} = require('../js/progression-core.js');
const data = require('../js/adventure-data.js');

test('chapters require their objectives, pay once, and open in order', () => {
  const p = new ExpeditionProgress();
  assert.equal(p.claimChapter('first-steps'), null);
  p.record('talk','atok');
  for(let i=0;i<3;i++) p.record('collect','Nanas');
  p.record('relic','compass');
  assert.equal(p.chapterComplete(),true);
  assert.equal(p.claimChapter('sea-calls'),null);
  const before=p.xp;
  assert.deepEqual(p.claimChapter('first-steps'),{coins:50,xp:25,title:'Bekal dari rumah'});
  assert.equal(p.xp,before+25);
  assert.equal(p.claimChapter('first-steps'),null);
  assert.equal(p.currentChapter.id,'sea-calls');
  assert.equal(p.chapterComplete(),false);
});

test('all five chapters remain achievable and survive a save round trip', () => {
  let p = new ExpeditionProgress();
  p.record('talk','atok');
  for(let i=0;i<3;i++)p.record('collect','Apel');
  for(const r of data.regions)p.record('visit',r.id);
  for(const r of data.relics)p.record('relic',r.id);
  for(const id of data.games)p.record('minigame',{id,won:true,score:8});
  for(const id of ['sumur','volcano','candi'])p.record('inspect',id);
  p.nextDay();p.nextDay();
  let coins=0;
  for(const chapter of data.chapters){
    assert.equal(p.currentChapter.id,chapter.id);
    const reward=p.claimChapter(chapter.id);
    assert.ok(reward);coins+=reward.coins;
    p=new ExpeditionProgress(JSON.parse(JSON.stringify(p)));
  }
  assert.equal(coins,615);
  assert.equal(p.currentChapter,null);
  assert.equal(p.claimChapter('island-friends'),null);
  assert.equal(p.unlocked.length,6);
});

test('discoveries cannot pay twice and five discoveries unlock Rimba', () => {
  const p = new ExpeditionProgress();
  assert.equal(p.record('relic','compass').xp,35);
  assert.equal(p.record('relic','compass').changed,false);
  assert.equal(p.record('relic','fake').changed,false);
  for(const r of data.relics.slice(1,5))p.record('relic',r.id);
  assert.ok(p.unlocked.includes('rimba'));
  assert.equal(p.today.relics.length,5);
  assert.equal(p.record('relic',data.relics[4].id).xp,0);
});

test('daily outings use today visits and inspections; tomorrow resets only daily progress', () => {
  const p=new ExpeditionProgress();
  p.record('visit','Kampung');
  assert.equal(p.claimOuting(),false);
  p.record('inspect','sumur');
  assert.equal(p.claimOuting(),true);
  assert.equal(p.claimOuting(),false);
  p.record('relic','compass');
  p.record('collect','Apel');
  p.nextDay();
  assert.equal(p.outingRegion,'Bali');
  assert.equal(p.claimOuting(),false);
  assert.equal(p.lastDay.collect,1);
  assert.equal(p.lastDay.relics,1);
  assert.equal(p.harvests,1);
  assert.deepEqual(p.relics,['compass']);
  p.record('visit','Bali');
  assert.equal(p.claimOuting(),false);
  assert.equal(p.record('inspect','sumur').xp,0);
  assert.equal(p.claimOuting(),true);
  for(let i=0;i<6;i++)p.nextDay();
  assert.equal(p.outingRegion,'Kampung');
});

test('old saves gain chapters, rhythm and collection fields without losing earned progress', () => {
  const p=new ExpeditionProgress({day:4,xp:260,collected:['Apel','Nanas'],wins:{cooking:2},unlocked:['ucup','gori']});
  assert.equal(p.harvests,2);
  assert.equal(p.currentChapter.id,'first-steps');
  assert.deepEqual(p.relics,[]);
  assert.equal(p.wins.cooking,2);
  assert.equal(p.wins.rhythm,0);
  assert.equal(p.xp,260);
  assert.deepEqual(p.record('minigame',{id:'rhythm',won:true,score:5}).unlocked,['atok']);
  assert.deepEqual(p.record('minigame',{id:'rhythm',won:true,score:5}).unlocked,[]);
});

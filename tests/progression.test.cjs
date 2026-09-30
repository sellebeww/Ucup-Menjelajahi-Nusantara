const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { ExpeditionProgress } = require('../js/progression-core.js');

test('exploration grants XP once; collecting still advances the daily task', () => {
  const p = new ExpeditionProgress();
  assert.equal(p.record('visit', 'Kampung').xp, 30);
  assert.equal(p.record('visit', 'Kampung').xp, 0);
  assert.equal(p.record('collect', 'Nanas').xp, 10);
  assert.equal(p.record('collect', 'Nanas').xp, 0);
  assert.equal(p.daily.collect, 2);
  assert.deepEqual(p.collected, ['Nanas']);
});
test('characters unlock through wins, exploration and six distinct fruit', () => {
  const p = new ExpeditionProgress();
  assert.deepEqual(p.record('minigame', {id:'fishing', won:false, score:2}).unlocked, []);
  for (const [id, character] of [['fishing','sari'],['cooking','gori'],['memory','kirana']]) {
    assert.deepEqual(p.record('minigame', {id, won:true, score:5}).unlocked, [character]);
    assert.deepEqual(p.record('minigame', {id, won:true, score:5}).unlocked, []);
  }
  for (const r of ['Kampung','Kota Tua','Bali','Lawang Sewu']) p.record('visit', r);
  assert.equal(p.unlocked.includes('atok'), false);
  assert.deepEqual(p.nextDay(), ['atok']);
  for (const fruit of ['Apel','Pisang','Nanas','Berry','Lemon','Cherry']) p.record('collect', fruit);
  assert.equal(p.unlocked.includes('rimba'), true);
  assert.equal(p.unlocked.length, 6);
});
test('daily rewards require different villagers and cannot be claimed twice', () => {
  const p = new ExpeditionProgress();
  for(let i=0;i<3;i++) p.record('collect', 'Nanas');
  p.record('talk','atok');p.record('talk','atok');
  p.record('minigame',{id:'memory',won:false,score:1});
  assert.equal(p.claimDaily(), false);
  p.record('talk','mei');
  const xp = p.xp;
  assert.equal(p.claimDaily(),true);
  assert.equal(p.claimDaily(),false);
  assert.equal(p.xp,xp+40);
  p.nextDay();
  assert.equal(p.claimDaily(),false);
  assert.deepEqual(p.daily,{collect:0,talk:[],play:0,claimed:false});
  assert.equal(p.talked.length,2);
});
test('round-trip saves preserve progress and reject malformed counters', () => {
  const p = new ExpeditionProgress();
  p.record('minigame',{id:'memory',won:true,score:6});
  p.record('visit','Bali');p.nextDay();
  const restored = new ExpeditionProgress(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(restored,p);
  const corrupt = new ExpeditionProgress({xp:Infinity,day:-12,unlocked:['unknown','sari','sari'],daily:{collect:-2,talk:'invalid'},wins:{memory:'99'}});
  assert.equal(corrupt.day,1);assert.equal(corrupt.xp,0);
  assert.equal(corrupt.wins.memory,0);assert.equal(corrupt.daily.collect,0);
  assert.deepEqual(corrupt.unlocked,['ucup','sari']);
  assert.doesNotThrow(()=>corrupt.record('minigame',null));
});
test('storage corruption or browser restrictions do not crash the game', () => {
  const context = {window:{},localStorage:{getItem:()=>'{invalid',setItem:()=>{throw Error('QuotaExceeded');}}};
  vm.runInNewContext(fs.readFileSync('js/storage.js','utf8'),context);
  const storage=context.window.GameStorage;
  assert.equal(storage.read(),null);
  assert.equal(storage.write({progress:{}}),false);
  assert.equal(storage.available,false);
  context.localStorage.getItem=()=>{throw Error('SecurityError');};
  assert.equal(storage.get('playerName','Ucup'),'Ucup');
});
test('midnight saves the new time before starting the new day; pause stops ticks', () => {
  const GameState = {};
  const saved=[];
  const context={GameState,gameOver:false,window:{gamePaused:false,Expedition:{newDay:()=>saved.push({...GameState})}},document:{getElementById:()=>({textContent:''})},setInterval:()=>0};
  vm.runInNewContext(fs.readFileSync('js/time.js','utf8'),context);
  const clock=context.window.gameTime;
  clock.set(23,59);clock.advance(1);
  assert.equal(saved.length,1);assert.equal(saved[0].hour,0);assert.equal(saved[0].minute,0);
  context.window.gamePaused=true;clock.updateTime();assert.equal(GameState.minute,0);
  context.window.gamePaused=false;clock.updateTime();assert.equal(GameState.minute,1);
});

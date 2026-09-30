const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup() {
  const listeners = {};
  const context = {
    window: {addEventListener(){}},
    document: {hidden:false,addEventListener:(event,fn)=>listeners[event]=fn},
    performance:{now:()=>context.now},now:0,
    requestAnimationFrame:()=>1,cancelAnimationFrame(){}
  };
  vm.runInNewContext(fs.readFileSync('js/minigames.js','utf8'),context);
  const game = context.window.Minigames;
  Object.assign(game,{active:true,playing:true,id:'memory',finished:false,lastFrame:0});
  return {context,game,listeners};
}
test('a visible minigame timer follows elapsed time at low frame rates', () => {
  const {game}=setup();let fired=0;
  game.later(()=>fired++,3000);
  game.tick(1500);assert.equal(fired,0);
  game.tick(3000);assert.equal(fired,1);
  game.tick(9000);assert.equal(fired,1);
  assert.equal(game.elapsed,9000);
});
test('time spent in a hidden tab never consumes a round timer', () => {
  const {context,game,listeners}=setup();let fired=0;
  game.later(()=>fired++,1000);
  game.tick(250);
  context.document.hidden=true;context.now=250;listeners.visibilitychange();
  context.now=60000;game.tick(60000);assert.equal(fired,0);
  context.document.hidden=false;listeners.visibilitychange();
  game.tick(60500);assert.equal(fired,0);
  game.tick(60750);assert.equal(fired,1);
});

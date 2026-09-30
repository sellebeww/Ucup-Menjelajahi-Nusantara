/* Each overlay owns its pause reason; closing one cannot unpause another. */
const Pause = {
  reasons: new Set(),
  set(reason, active) {
    if (active) this.reasons.add(reason); else this.reasons.delete(reason);
    window.gamePaused = this.reasons.size > 0;
    window.inputLocked = window.gamePaused;
    document.body.classList.toggle('paused', window.gamePaused);
    if (window.gamePaused && typeof keys !== 'undefined') {
      Object.values(keys).forEach(k => k.pressed = false); lastKey = '';
    }
  }
};
window.Pause = Pause;
window.gamePaused = false;
window.inputLocked = false;
document.addEventListener('visibilitychange', () => Pause.set('hidden', document.hidden));
window.addEventListener('blur', () => {
  if (typeof keys !== 'undefined') Object.values(keys).forEach(k => k.pressed = false);
  if (typeof lastKey !== 'undefined') lastKey = '';
});

/* Game minutes use one source of truth; paused time never leaks into a day. */
const MS_PER_GAME_MINUTE = 500;
class GameTime {
  constructor() { this.currentHours = 7; this.currentMinutes = 0; }
  init() { this.render(); this.interval = setInterval(() => { if (!window.gamePaused && !gameOver) this.advance(1); }, MS_PER_GAME_MINUTE); }
  set(hour, minute) { this.currentHours = Math.floor(hour); this.currentMinutes = Math.floor(minute); this.render(); }
  advance(minutes) {
    let total = this.currentHours * 60 + this.currentMinutes + minutes;
    let days = Math.floor(total / 1440); total %= 1440;
    this.currentHours = Math.floor(total / 60); this.currentMinutes = total % 60;
    this.render();
    while (days-- > 0) window.Expedition?.newDay(false);
  }
  updateTime() { if (!window.gamePaused && !gameOver) this.advance(1); }
  render() {
    GameState.hour = this.currentHours; GameState.minute = this.currentMinutes;
    const decimal = this.currentHours + this.currentMinutes / 60, period = this.getDayPeriod(decimal);
    document.getElementById('game-clock').textContent = `${String(this.currentHours).padStart(2, '0')}:${String(this.currentMinutes).padStart(2, '0')}`;
    document.getElementById('day-period').textContent = { Fajar: 'Fajar', Morning: 'Pagi', Noon: 'Siang', Evening: 'Senja', Night: 'Malam' }[period];
    if (typeof onTimeChanged === 'function') onTimeChanged(decimal, period);
  }
  getDayPeriod(h) { return h >= 5 && h < 7 ? 'Fajar' : h >= 7 && h < 12 ? 'Morning' : h >= 12 && h < 17 ? 'Noon' : h >= 17 && h < 19 ? 'Evening' : 'Night'; }
}
const gameTime = new GameTime(); gameTime.init(); window.gameTime = gameTime;

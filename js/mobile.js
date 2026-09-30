// Kontrol arah untuk layar sentuh. Tombolnya cukup menekan/melepas "keys" yang
// sama dengan keyboard, jadi logika gerak, tabrakan, dan kamera tidak diduplikasi.

const ARROW_KEYS = {
  upKey: 'w',
  leftKey: 'a',
  downKey: 's',
  rightKey: 'd'
};

function holdKey(key, pressed) {
  if (window.inputLocked && pressed) return;
  keys[key].pressed = pressed;
  if (pressed) {
    lastKey = key;
  } else {
    const stillPressed = Object.keys(keys).filter(k => keys[k].pressed);
    lastKey = stillPressed.length ? stillPressed[stillPressed.length - 1] : '';
  }
}

Object.entries(ARROW_KEYS).forEach(([id, key]) => {
  const btn = document.getElementById(id);
  if (!btn) return;

  const press = (e) => { e.preventDefault(); holdKey(key, true); };
  const release = (e) => { e.preventDefault(); holdKey(key, false); };

  btn.addEventListener('touchstart', press, { passive: false });
  btn.addEventListener('touchend', release);
  btn.addEventListener('touchcancel', release);
  btn.addEventListener('mousedown', press);
  btn.addEventListener('mouseup', release);
  btn.addEventListener('mouseleave', release);
});

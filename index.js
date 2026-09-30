const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
c.imageSmoothingEnabled = false;   // sprite pixel-art tetap tajam saat diperbesar

const collisionsMap = [];
for (let i = 0; i < collisions.length; i += 100) {
    collisionsMap.push(collisions.slice(i, i + 100));
}

const boundaries = [];
const offset = {
    x: -910,
    y: -990
};

class Sprite {
    constructor({ position, image, frames = { max: 1 }, sprites, scale = 1 }) {
        this.position = position;
        this.image = image;
        this.frames = { ...frames, val: 0, elapsed: 0 };
        this.sprites = sprites;
        this.scale = scale;

        this.image.onload = () => {
            this.width = (this.image.width / this.frames.max) * this.scale;
            this.height = this.image.height * this.scale;
        };

        this.moving = false;
    }

    draw() {
        if (!this.image.complete || !this.image.naturalWidth) return;
        const cropWidth = this.image.width / this.frames.max;
        const cropHeight = this.image.height;

        c.drawImage(
            this.image,
            this.frames.val * cropWidth,
            0,
            cropWidth,
            cropHeight,
            Math.floor(this.position.x),
            Math.floor(this.position.y),
            Math.floor(cropWidth * this.scale),
            Math.floor(cropHeight * this.scale)
        );

        if (!this.moving) { this.frames.val = 0; this.frameAt = 0; return; }
        const now = performance.now(), hold = (this.frames.hold || 9) * 1000 / 60;
        if (now - (this.frameAt || 0) >= hold) {
            this.frames.val = (this.frames.val + 1) % this.frames.max;
            this.frameAt = now;
        }
    }
}

class Boundary {
    static width = 64
    static height = 64
    constructor({ position }) {
        this.position = position
        this.width = 64
        this.height = 64
    }

    draw() {
        c.fillStyle = 'rgba(255, 0, 0, 0)'
        c.fillRect(this.position.x, this.position.y, this.width, this.height)
    }
}

collisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 2395 || symbol === 859) {
            boundaries.push(
                new Boundary({
                    position: {
                        x: j * Boundary.width + offset.x,
                        y: i * Boundary.height + offset.y
                    }
                })
            );
        }
    });
});

const image = new Image();
image.src = './img/nusantara.png';

const foregroundImage = new Image();
foregroundImage.src = './img/foreground.png';

const foregroundImage2 = new Image();
foregroundImage2.src = './img/foreground2.png'

const playerDownImage = new Image();
playerDownImage.src = './img/playerDown.png';

const playerUpImage = new Image();
playerUpImage.src = './img/playerUp.png';

const playerLeftImage = new Image();
playerLeftImage.src = './img/playerLeft.png';

const playerRightImage = new Image();
playerRightImage.src = './img/playerRight.png';

const player = new Sprite({
    position: {
        x: canvas.width / 2 - (192 / 8) * 1,
        y: canvas.height / 2 - (68 / 2) * 1
    },
    image: playerDownImage,
    frames: {
        max: 4
    },
    scale: 1,
    sprites: {
        up: playerUpImage,
        down: playerDownImage,
        left: playerLeftImage,
        right: playerRightImage
    }
});
// Stable geometry before the first image finishes loading keeps spawn/save
// coordinates identical across a cold load and a cached load.
player.width = 48;
player.height = 68;

// Karakter yang dipilih di halaman login dipasang ke player di sini.
// Player controller-nya sendiri tidak terikat ke satu karakter tertentu.
function applySelectedCharacter() {
    const character = (characterUnlocked(GameState.characterId) && getCharacter(GameState.characterId)) || getDefaultCharacter();
    GameState.characterId = character.id;
    GameState.character = character;

    const nameEl = document.getElementById('hudPlayerName');
    const avaEl = document.getElementById('hudAvatar');
    if (nameEl) nameEl.textContent = GameState.playerName;
    if (avaEl) avaEl.src = character.avatar;

    const requestId = character.id;
    loadCharacterSprites(character, ({ images, frames, scale }) => {
        if (GameState.characterId !== requestId) return;
        const oldW = player.width || 48, oldH = player.height || 68;
        player.sprites = images;
        player.image = images.down;
        player.frames = { ...player.frames, max: frames, val: 0 };
        player.scale = scale;
        player.width = (images.down.width / frames) * scale;
        player.height = images.down.height * scale;
        player.position.x += (oldW - player.width) / 2;
        player.position.y += (oldH - player.height) / 2;
    });
}
applySelectedCharacter();

const background = new Sprite({
    position: {
        x: offset.x,
        y: offset.y
    },
    image: image

});

const foreground = new Sprite({
    position: {
        x: offset.x,
        y: offset.y
    },
    image: foregroundImage

});

const foreground2 = new Sprite({
    position: {
        x: offset.x,
        y: offset.y
    },
    image: foregroundImage2

});

const keys = {
    w: { pressed: false },
    a: { pressed: false },
    s: { pressed: false },
    d: { pressed: false }
};

let lastKey = '';

const movables = [background, ...boundaries, foreground2, foreground]

// Titik mulai ditetapkan memakai koordinat peta (bukan koordinat layar) supaya
// pemain selalu mulai di tempat yang sama, berapa pun ukuran jendelanya.
const SPAWN = { x: 1620, y: 1400 };

function placePlayerAtMap(mapX, mapY) {
    const curX = player.position.x - background.position.x + (player.width || 48) / 2;
    const curY = player.position.y - background.position.y + (player.height || 48) / 2;
    const dx = mapX - curX;
    const dy = mapY - curY;
    movables.forEach(m => { m.position.x -= dx; m.position.y -= dy; });
}
placePlayerAtMap(SPAWN.x, SPAWN.y);

function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
        rectangle1.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.position.y <= rectangle2.position.y + rectangle2.height &&
        rectangle1.position.y + rectangle1.height >= rectangle2.position.y
    );
}

function canMoveTo(dx, dy) {
    const px = player.position.x + (player.width || 64) / 2;
    const py = player.position.y + (player.height || 80) / 2;
    const mapX = px + dx - background.position.x;
    const mapY = py + dy - background.position.y;
    if (mapX < 20 || mapY < 20 || mapX > 6380 || mapY > 4460) return false;
    for (let boundary of boundaries) {
        if (rectangularCollision({
            rectangle1: { width: 22, height: 16, position: { x: px - 11 + dx, y: py + 12 + dy } },
            rectangle2: boundary
        })) return false;
    }
    return true;
}

function updateLocationLabel() {
    const currentLocation = getCurrentLocation(player, background);
    const el = document.getElementById('locationName');
    if (el) el.textContent = currentLocation || 'Perjalanan';
}

let previousFrame = 0;
function animate(timestamp = 0) {
    const delta = previousFrame ? Math.min((timestamp - previousFrame) / 1000, .05) : 1 / 60;
    previousFrame = timestamp;
    window.requestAnimationFrame(animate);

    // Menus freeze the world. Reusing the last canvas frame leaves time for
    // the minigame/UI, especially on phones and software-rendered browsers.
    if (window.gamePaused && canvas.pausePainted) return;
    canvas.pausePainted = window.gamePaused;

    if (typeof updateEvents === 'function') updateEvents();

    // Goyangan lapisan pohon saat angin bertiup
    const sway = typeof foregroundSway === 'function' ? foregroundSway() : 0;

    c.clearRect(0, 0, canvas.width, canvas.height);
    background.draw();

    if (typeof drawWorldItems === 'function') drawWorldItems();
    if (window.Adventure && window.Expedition) Adventure.draw();
    if (typeof drawNpcs === 'function') drawNpcs();

    c.save();
    c.fillStyle = "rgba(10,40,28,.25)";
    c.beginPath();
    c.ellipse(player.position.x + (player.width || 64) / 2, player.position.y + (player.height || 80) - 5, 16, 6, 0, 0, Math.PI * 2);
    c.fill(); c.restore();
    player.draw();

    foreground.position.x += sway;
    foreground2.position.x -= sway;
    foreground.draw();
    foreground2.draw();
    foreground.position.x -= sway;
    foreground2.position.x += sway;

    if (typeof drawDiscoveredMarkers === 'function') drawDiscoveredMarkers();

    const target = typeof refreshActionBar === 'function' ? refreshActionBar() : null;
    if (typeof drawNearbyMarkers === 'function') drawNearbyMarkers(target);
    if (typeof drawInteractHighlight === 'function') drawInteractHighlight(target);

    if (typeof drawWeatherEffects === 'function') drawWeatherEffects();
    if (window.Expedition) Expedition.update(delta);
    if (typeof drawMinimap === 'function') drawMinimap();

    updateLocationLabel();

    // ---- Gerakan player ----
    player.moving = false;
    const locked = window.inputLocked || window.gamePaused || (typeof gameOver !== 'undefined' && gameOver);
    if (locked) return;

    const speed = 245 * delta * (GameState.modifiers.speed || 1) * (GameState.character?.speed || 1);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const margin = 50;

    if (keys.w.pressed && lastKey === 'w') {
        player.image = player.sprites.up;
        player.moving = true;
        if (canMoveTo(0, -speed)) {
            if (player.position.y > centerY - margin) player.position.y -= speed;
            else movables.forEach(m => m.position.y += speed);
        }
    } else if (keys.a.pressed && lastKey === 'a') {
        player.image = player.sprites.left;
        player.moving = true;
        if (canMoveTo(-speed, 0)) {
            if (player.position.x > centerX - margin) player.position.x -= speed;
            else movables.forEach(m => m.position.x += speed);
        }
    } else if (keys.s.pressed && lastKey === 's') {
        player.image = player.sprites.down;
        player.moving = true;
        if (canMoveTo(0, speed)) {
            if (player.position.y < centerY + margin) player.position.y += speed;
            else movables.forEach(m => m.position.y -= speed);
        }
    } else if (keys.d.pressed && lastKey === 'd') {
        player.image = player.sprites.right;
        player.moving = true;
        if (canMoveTo(speed, 0)) {
            if (player.position.x < centerX + margin) player.position.x += speed;
            else movables.forEach(m => m.position.x -= speed);
        }
    }
}
animate()

window.addEventListener('resize', () => {
    canvas.pausePainted = false;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    c.imageSmoothingEnabled = false;

    // Kamera mengandaikan player berada di sekitar tengah layar. Setelah ukuran
    // layar berubah, player dikembalikan ke tengah dan dunia digeser mengikuti,
    // sehingga posisi player di peta tetap sama.
    const newX = canvas.width / 2 - (player.width || 48) / 2;
    const newY = canvas.height / 2 - (player.height || 48) / 2;
    const dx = newX - player.position.x;
    const dy = newY - player.position.y;
    player.position.x = newX;
    player.position.y = newY;
    movables.forEach(m => { m.position.x += dx; m.position.y += dy; });
});

const KEY_MAP = {
    'w': 'w', 'ArrowUp': 'w',
    'a': 'a', 'ArrowLeft': 'a',
    's': 's', 'ArrowDown': 's',
    'd': 'd', 'ArrowRight': 'd'
};

window.addEventListener('keydown', (e) => {
    if (window.inputLocked || e.target.matches('input,textarea')) return;
    const key = KEY_MAP[e.key] || KEY_MAP[e.key.toLowerCase()];
    if (!key) return;
    e.preventDefault();
    keys[key].pressed = true;
    lastKey = key;
});

window.addEventListener('keyup', (e) => {
    const key = KEY_MAP[e.key] || KEY_MAP[e.key.toLowerCase()];
    if (!key) return;
    keys[key].pressed = false;

    const stillPressed = Object.keys(keys).filter(k => keys[k].pressed);
    lastKey = stillPressed.length ? stillPressed[stillPressed.length - 1] : '';
});

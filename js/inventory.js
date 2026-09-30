// Tas / backpack. Katalog item dipisah dari isi tas supaya item yang dipungut
// di peta bisa memakai definisi yang sama.

const ITEM_LIBRARY = [
  { name: 'Cherry',        desc: 'Cherry segar, menambah sedikit energi dan mood.',   img: 'img/cherry.png',      effect: { meal: 8, happiness: 4 } },
  { name: 'Lemon',         desc: 'Lemon asam, menyegarkan dan menambah hygiene.',     img: 'img/lemon.png',       effect: { meal: 7, hygiene: 5 } },
  { name: 'Jeruk',         desc: 'Jeruk manis, menambah vitamin dan mood.',           img: 'img/jeruk.png',       effect: { meal: 10, happiness: 3 } },
  { name: 'Apel',          desc: 'Apel merah segar, menambah energi dan mood.',       img: 'img/apel.png',        effect: { meal: 12, happiness: 5 } },
  { name: 'Nanas',         desc: 'Nanas asam manis, menaikkan mood dan kebersihan.',  img: 'img/nanas.png',       effect: { meal: 10, happiness: 4, hygiene: 3 } },
  { name: 'Stroberi',      desc: 'Stroberi manis, menambah energi dan kebahagiaan.',  img: 'img/stoberry.png',    effect: { meal: 9, happiness: 6 } },
  { name: 'Pir',           desc: 'Pir renyah, menambah energi dan sedikit mood.',     img: 'img/pir.png',         effect: { meal: 11, happiness: 3 } },
  { name: 'Berry',         desc: 'Berry segar, menambah energi dan mood.',            img: 'img/berry.png',       effect: { meal: 8, happiness: 4 } },
  { name: 'Semangka',      desc: 'Semangka dingin, menghilangkan dahaga.',            img: 'img/semangka.png',    effect: { meal: 13, sleep: 4, hygiene: 2 } },
  { name: 'Pisang',        desc: 'Pisang matang, sumber energi dan mengenyangkan.',   img: 'img/pisang.png',      effect: { meal: 14, sleep: 2 } },
  { name: 'Potion Hunger', desc: 'Potion khusus menambah rasa kenyang.',              img: 'img/hunger.png',      effect: { meal: 50 } },
  { name: 'Potion Energy', desc: 'Potion khusus menambah energi.',                    img: 'img/energy.png',      effect: { sleep: 50 } },
  { name: 'Potion Hygiene',desc: 'Potion khusus memulihkan kebersihan.',              img: 'img/hygieneitem.png', effect: { hygiene: 50 } },
  { name: 'Potion Emas',   desc: 'Potion emas, meningkatkan semua status.',           img: 'img/emas.png',        effect: { meal: 50, sleep: 50, hygiene: 50, happiness: 50 } }
];

const INVENTORY_CAPACITY = 16;

function itemDef(name) {
  return ITEM_LIBRARY.find(i => i.name === name);
}

// Isi tas awal: sedikit saja, sisanya dicari sendiri di peta.
const inventoryItems = [
  { ...itemDef('Apel') },
  { ...itemDef('Pisang') },
  { ...itemDef('Potion Energy') }
];

const inventoryBtn = document.getElementById('inventoryBtn');
const inventoryPanel = document.getElementById('inventoryPanel');
const inventoryGrid = document.getElementById('inventoryGrid');
const itemDetail = document.getElementById('itemDetail');
const itemImage = document.getElementById('itemImage');
const itemDesc = document.getElementById('itemDesc');
const itemEffectList = document.getElementById('itemEffect');
const useItemBtn = document.getElementById('useItemBtn');
const inventoryCount = document.getElementById('inventoryCount');
const inventoryCloseBtn = document.getElementById('inventoryCloseBtn');

const trashConfirm = document.getElementById('trashConfirm');
const trashYesBtn = document.getElementById('trashYesBtn');
const trashNoBtn = document.getElementById('trashNoBtn');

let selectedItemName = null;
let trashCandidateName = null;

function isInventoryOpen() {
  return inventoryPanel.classList.contains('open');
}

function showInventoryPanel(show) {
  if (show && (window.Expedition?.panelOpen || window.Minigames?.active || Pause.reasons.has('tutorial') || Pause.reasons.has('settings') || gameOver)) return;
  inventoryPanel.classList.toggle('open', show);
  Pause.set('inventory', show);
  if (!show) trashConfirm.style.display = 'none';
  if (show) {
    renderInventory();
    if (!selectedItemName && inventoryItems.length) selectItem(inventoryItems[0].name);
  }
}

function toggleInventory() {
  showInventoryPanel(!isInventoryOpen());
}

// Menggabungkan item sejenis menjadi satu slot bertumpuk
function stacks() {
  const map = new Map();
  inventoryItems.forEach(it => {
    if (!map.has(it.name)) map.set(it.name, { ...it, qty: 0 });
    map.get(it.name).qty++;
  });
  return [...map.values()];
}

function renderInventory() {
  const list = stacks();
  inventoryGrid.innerHTML = '';

  list.forEach(stack => {
    const slot = document.createElement('div');
    slot.className = 'inventory-grid-item filled';
    if (stack.name === selectedItemName) slot.classList.add('selected');
    slot.title = stack.name;
    slot.innerHTML = `<img src="${stack.img}" alt="${stack.name}">` +
                     (stack.qty > 1 ? `<span class="slot-qty">${stack.qty}</span>` : '');
    slot.addEventListener('click', () => selectItem(stack.name));

    slot.setAttribute('draggable', 'true');
    slot.ondragstart = () => {
      trashCandidateName = stack.name;
      setTimeout(() => slot.classList.add('dragging'), 0);
    };
    slot.ondragend = (e) => {
      slot.classList.remove('dragging');
      const r = inventoryPanel.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        showTrashConfirm(stack.name);
      } else {
        trashCandidateName = null;
      }
    };
    inventoryGrid.appendChild(slot);
  });

  for (let i = list.length; i < INVENTORY_CAPACITY; i++) {
    const empty = document.createElement('div');
    empty.className = 'inventory-grid-item empty';
    inventoryGrid.appendChild(empty);
  }

  if (inventoryCount) inventoryCount.textContent = `${inventoryItems.length}/${INVENTORY_CAPACITY}`;
  if (!list.some(s => s.name === selectedItemName)) clearDetail();
}

function clearDetail() {
  selectedItemName = null;
  itemDetail.querySelector('h3').textContent = 'Pilih item';
  itemImage.style.display = 'none';
  itemDesc.textContent = 'Detail item akan muncul di sini.';
  if (itemEffectList) itemEffectList.innerHTML = '';
  useItemBtn.style.display = 'none';
}

function selectItem(name) {
  const def = inventoryItems.find(i => i.name === name);
  if (!def) return clearDetail();

  selectedItemName = name;
  Array.from(inventoryGrid.children).forEach(slot => {
    slot.classList.toggle('selected', slot.title === name);
  });

  itemDetail.querySelector('h3').textContent = def.name;
  itemImage.src = def.img;
  itemImage.style.display = 'block';
  itemDesc.textContent = def.desc;

  if (itemEffectList) {
    itemEffectList.innerHTML = '';
    for (const key in (def.effect || {})) {
      const chip = document.createElement('span');
      chip.className = 'effect-chip ' + (def.effect[key] > 0 ? 'plus' : 'minus');
      chip.textContent = `${def.effect[key] > 0 ? '+' : ''}${def.effect[key]} ${window.STAT_LABELS?.[key] || key}`;
      itemEffectList.appendChild(chip);
    }
  }
  useItemBtn.style.display = 'block';
  useItemBtn.onclick = useSelectedItem;
}

function useSelectedItem() {
  const idx = inventoryItems.findIndex(i => i.name === selectedItemName);
  if (idx === -1) return;
  const item = inventoryItems[idx];

  const effect = { ...item.effect };
  if (effect.meal > 0) effect.meal = Math.round(effect.meal * (GameState.character?.food || 1));
  const parts = applyStatusEffect(effect);
  const detail = parts.length ? `<br><span class="toast-stat">${parts.join(', ')}</span>` : '';
  showToast(`Nyam nyam nyam!${detail}`);

  inventoryItems.splice(idx, 1);
  window.Expedition?.save();
  const stillHas = inventoryItems.some(i => i.name === item.name);
  renderInventory();
  if (stillHas) selectItem(item.name);
  else if (inventoryItems.length) selectItem(inventoryItems[0].name);
  else clearDetail();
}

function addItemToInventory(item) {
  if (inventoryItems.length >= INVENTORY_CAPACITY) {
    showToast('Tas sudah penuh!');
    return false;
  }
  inventoryItems.push(item);
  window.Expedition?.save();
  if (isInventoryOpen()) renderInventory();
  if (inventoryCount) inventoryCount.textContent = `${inventoryItems.length}/${INVENTORY_CAPACITY}`;
  return true;
}

function showTrashConfirm(name) {
  trashCandidateName = name;
  trashConfirm.style.display = 'flex';
  trashYesBtn.onclick = () => {
    const idx = inventoryItems.findIndex(i => i.name === trashCandidateName);
    if (idx !== -1) {
      inventoryItems.splice(idx, 1);
  window.Expedition?.save();
      renderInventory();
      showToast('Item dibuang!');
    }
    trashCandidateName = null;
    trashConfirm.style.display = 'none';
  };
  trashNoBtn.onclick = () => {
    trashCandidateName = null;
    trashConfirm.style.display = 'none';
  };
}

inventoryBtn.addEventListener('click', toggleInventory);
if (inventoryCloseBtn) inventoryCloseBtn.addEventListener('click', () => showInventoryPanel(false));

window.addEventListener('mousedown', (e) => {
  if (isInventoryOpen() && trashConfirm.style.display !== 'flex' && !inventoryPanel.contains(e.target) && !inventoryBtn.contains(e.target)) {
    showInventoryPanel(false);
  }
});

renderInventory();

window.ITEM_LIBRARY = ITEM_LIBRARY;
window.inventoryItems = inventoryItems;
window.addItemToInventory = addItemToInventory;
window.toggleInventory = toggleInventory;
window.isInventoryOpen = isInventoryOpen;
window.showInventoryPanel = showInventoryPanel;
window.renderInventory = renderInventory;

// Static game data: items, swords, enemies, NPCs, quests.
// Pure data only (no DOM), so the same file can be shared with a future server.

export const TICK = 0.6;            // seconds per game tick (combat runs on ticks, like OSRS)
export const TILE = 32;             // pixels per tile at zoom 1

export const ITEMS = {
  coins:     { name: 'Coins', stack: true, icon: 'coin' },
  straw:     { name: 'Straw', stack: true, icon: 'straw', value: 1, info: 'Stuffing from a practice dummy.' },
  slime:     { name: 'Ember goo', stack: true, icon: 'goo', value: 3, info: 'Warm and sticky. Someone might buy this.' },
  wing:      { name: 'Bat wing', stack: true, icon: 'wing', value: 5, info: 'Willa the healer needs these.' },
  shard:     { name: 'Shield shard', stack: true, icon: 'shard', value: 12, info: 'A chip off a brute shield.' },
  potion:    { name: 'Potion', stack: true, icon: 'potion', value: 15, heal: 12, info: 'Heals 12 HP. Tap to drink.' },
  apple:     { name: 'Apple', stack: true, icon: 'apple', value: 2, heal: 4, info: 'Heals 4 HP. Tap to eat.' },
  headband:  { name: 'Ninja headband', stack: false, icon: 'band', quest: true, info: 'Dropped by the ninja who took Dad.' },
};

// Swords carry over from the runner. dmg = max hit bonus, spd = ticks between swings (2 = 1.2 s, 1 = fast 0.6 s)
export const SWORDS = {
  old:    { name: "Dad's Blade",  rarity: 'common',    dmg: 3, acc: 4,  spd: 2, price: 0,    color: '#e6ecf2' },
  iron:   { name: 'Iron Edge',    rarity: 'common',    dmg: 5, acc: 7,  spd: 2, price: 150,  color: '#d5d9de' },
  willow: { name: 'Willow Saber', rarity: 'common',    dmg: 1, acc: 9,  spd: 1, price: 220,  color: '#e9dfc4' },
  tide:   { name: 'Tide Cutter',  rarity: 'rare',      dmg: 8, acc: 12, spd: 2, price: 700,  color: '#7fc8ff' },
  storm:  { name: 'Storm Fang',   rarity: 'rare',      dmg: 3, acc: 14, spd: 1, price: 850,  color: '#a8e0ff' },
  dawn:   { name: 'Dawnbreaker',  rarity: 'legendary', dmg: 13, acc: 18, spd: 2, price: 2500, color: '#ffd76a' },
  night:  { name: 'Nightglass',   rarity: 'legendary', dmg: 6, acc: 20, spd: 1, price: 2800, color: '#c9a6ff' },
};
export const RARITY = { common: '#c9c2b8', rare: '#5fb0ff', legendary: '#ffc23d' };

// Enemies. lvl drives accuracy/defence; aggro = tiles at which it starts chasing (0 = passive)
export const ENEMIES = {
  dummy:   { name: 'Straw dummy',    lvl: 1,  hp: 4,  maxHit: 0, def: 0,  speed: 0,   aggro: 0, xp: 6,  respawn: 8,
             drops: [['straw', 1, 1, 1], ['coins', 1, 3, 0.6]] },
  slime:   { name: 'Ember slime',    lvl: 3,  hp: 10, maxHit: 1, def: 2,  speed: 1.6, aggro: 0, xp: 12, respawn: 15,
             drops: [['slime', 1, 1, 0.7], ['coins', 2, 8, 0.8], ['apple', 1, 1, 0.15]] },
  bat:     { name: 'Cave bat',       lvl: 6,  hp: 12, maxHit: 2, def: 4,  speed: 3.2, aggro: 4, xp: 18, respawn: 18,
             drops: [['wing', 1, 1, 0.6], ['coins', 3, 12, 0.7]] },
  brute:   { name: 'Shield brute',   lvl: 12, hp: 30, maxHit: 4, def: 14, speed: 1.8, aggro: 5, xp: 45, respawn: 30,
             drops: [['shard', 1, 2, 0.8], ['coins', 10, 30, 1], ['potion', 1, 1, 0.25]] },
  ninja:   { name: 'Shadow ninja',   lvl: 16, hp: 26, maxHit: 5, def: 12, speed: 3.6, aggro: 6, xp: 60, respawn: 40,
             drops: [['coins', 15, 40, 1], ['potion', 1, 1, 0.3]] },
  colossus:{ name: 'Straw Colossus', lvl: 20, hp: 60, maxHit: 5, def: 10, speed: 1.4, aggro: 7, xp: 220, respawn: 120, boss: true,
             drops: [['coins', 120, 160, 1], ['potion', 2, 3, 1], ['headband', 1, 1, 1]] },
};

// Shop stock (Marta's general store)
export const SHOP = [
  { id: 'potion', price: 20 }, { id: 'apple', price: 4 },
  { sword: 'iron' }, { sword: 'willow' }, { sword: 'tide' }, { sword: 'storm' }, { sword: 'dawn' }, { sword: 'night' },
];

export const QUESTS = {
  training: { name: 'Training Day', giver: 'bram', need: 5,
    steps: ['Talk to Coach Bram in the training yard.', 'Break 5 straw dummies in the training yard.', 'Go back to Coach Bram.'] },
  wings: { name: 'Wings for Willa', giver: 'willa', need: 3,
    steps: ['Talk to Willa the healer in the village.', 'Collect 3 bat wings from the bats in Gloomwood (east).', 'Bring the wings to Willa.'] },
  cat: { name: 'Where Did the Cat Go?', giver: 'nana', need: 1,
    steps: ['Talk to Nana Pell by the well.', 'Search Gloomwood for your cat. Nana saw it run deep into the trees.', 'Bring the cat home to Nana.'] },
  test: { name: 'The Final Test', giver: 'bram', need: 1, requires: 'training',
    steps: ['Finish Training Day first.', 'Defeat the Straw Colossus in the north arena.', 'Show Coach Bram the ninja headband.'] },
};

// NPC placement is by tile and defined in world.js; looks are here.
export const NPCS = {
  bram:  { name: 'Coach Bram',  shirt: '#3a6b4a', hair: '#cfcfcf', skin: '#c58c63', beard: true },
  willa: { name: 'Willa',       shirt: '#c8506a', hair: '#2b1d14', skin: '#8d5a3b' },
  marta: { name: 'Marta',       shirt: '#d49a2a', hair: '#7a3a1a', skin: '#e0b090', apron: true },
  nana:  { name: 'Nana Pell',   shirt: '#7a6cc0', hair: '#eeeeee', skin: '#e8c0a0' },
  finn:  { name: 'Finn',        shirt: '#2f7fd6', hair: '#e8c35a', skin: '#e9b48e', kid: true },
};

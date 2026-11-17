# Rel's World

An open-world, top-down adventure (OSRS / MapleStory feel) starring Rels, her sword, and her cat.

## Play / test
- **Online:** GitHub Pages (Settings → Pages → Deploy from branch `main`, folder `/root`), then open `https://<user>.github.io/Rels-world/`
- **On your PC:** run `python -m http.server` in this folder and open http://localhost:8000
  (JavaScript modules don't load if you double-click `index.html`.)

Controls: drag on the left side to move (or WASD), ⚔ / Space to attack, E to talk, B bag, Q quests, K skills, H heal.

## Code layout
```
index.html, style.css
js/main.js            boot + main loop
js/core/              game rules, no DOM (can run on a server later)
  data.js             items, swords, enemies, quests, NPCs
  world.js            Ember Key map
  game.js             simulation: movement, tick combat (0.6 s), AI, loot, quests, saves
  util.js             random, noise, OSRS XP table
js/render/            canvas drawing (reads game state only)
js/ui/                joystick/keyboard, HUD + menus, sound
```

## Roadmap
1. ✅ Core game on Ember Key (this)
2. More zones: Mossreach city and the other islands, bosses, story
3. Online: Node.js + WebSocket server running `js/core`
4. App Store / Play Store build (Capacitor wrapper)

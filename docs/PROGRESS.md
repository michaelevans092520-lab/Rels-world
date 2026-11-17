# Progress log

Newest first. Update this at the end of every work session.

## 2026-11-17: Clean-room server core started
**Direction change:** Rel's World is now planned as a **commercial MMORPG**. New rules (clean room, human-led design, small modules, no unapproved dependencies, authoritative server, command objects, TypeScript only) are in `CLAUDE.md`.

**Done**
- The browser prototype is saved on the `prototype` branch. It's still live on GitHub Pages for playtesting, but it is **not** the basis for the real game.
- New `server/` folder (TypeScript, no runtime dependencies): `GameState`, `Command` / `StateUpdate` / `CommandResult`, `CommandRouter`, and `updateTick()`. 7 passing tests with a hand-written test runner.
- Approved dev tool: TypeScript compiler (Apache-2.0).

**Next up:** waiting on the owner's first design spec. Suggested: the player's state variables and the `MoveCommand` rules (speed, collision, what the server checks).

**Open decisions**
- Visual engine for the client (not chosen yet).
- Whether the prototype stays on `main` (it serves the GitHub Pages link) or moves fully to its branch.

## 2026-11-16: Pangea map
**Done**
- Phase 1 game (Ember Key): joystick + keyboard movement, OSRS-style tick combat (0.6 s ticks, hit splats, Attack/Strength/Defence/Hitpoints with the OSRS XP curve, combat styles), loot, 24-slot bag, Marta's shop (7 swords from the runner game, potions, apples, selling), auto-save on the device.
- 4 quests: Training Day, Wings for Willa, Where Did the Cat Go? (cat hat reward), The Final Test (Straw Colossus, Colossus horn).
- **Pangea**: one 300×250-tile continent with 8 connected regions, each with its own ground, trees, monsters, level range and fighting-style identity (see `map-design.md`). Roads join every region; all regions are reachable on foot.
- Region banner when you walk into a new region (warns if it's dangerous for your level).
- Other regions use **placeholder monsters**: existing bodies re-tinted and scaled to the region's level (`REGION_MONSTERS` in `data.js`).
- Old saves from the small map are moved onto Pangea automatically (save version 2).

**Next up (suggested)**
1. Real monsters and art per region (skeletons in Duskfen, fire elementals in Cinder Isle, archers around Mossreach, ...).
2. Trainers + new combat styles per region (start with Archery in Mossreach), using the builds plan in `builds.md`.
3. Mossreach: NPCs and quests in the city.
4. Region bosses from the old game: Mossback Troll, Saltglass Golem, Fen Stalker, Frostmere Yeti, Magma Brute, Reef Tyrant, Shadow Shogun.

- Game controller support (Gamepad API): left stick/d-pad move, A attack, X talk, Y bag, B close, LB/RB heal, Select skills, Start quests.
- Removed the "find Dad" storyline and the new-game intro (no cutscenes). Tips now show in the chat log.

**Open decisions**
- Can Rels learn every style (recommended: learn all, equip a limited loadout), or does each player pick a class?
- Does Pangea split into islands later as a story event?
- Online: Node + WebSocket server running `js/core` (phase 3). App store wrapper (phase 4) after that.

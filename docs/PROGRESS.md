# Progress log

Newest first. Update this at the end of every work session.

## 2026-11-20: Map names
- Regions renamed to placeholders **Country 1–8** (in level order) in `docs/map-design.md`. Old names are kept only as a prototype reference at the bottom.
- **Owner's decision: no level ranges per country.** Difficulty is spread everywhere; the game's overall goal is quests and levels.
- Flagged: don't use "bender" for magic styles (too close to an existing franchise). "Magic" is the placeholder.
- **Owner's decisions (2026-11-20):**
  - No level or health is ever displayed, for players, monsters or NPCs. Only the monster/NPC itself is shown.
  - Quests have requirements, and there's a **quest log** that will live in the start menu (client UI, later).
  - Each country has **areas** with monsters (difficulty grouped by area, spread across all countries).
  - **Players start in Country 1.** The tutorial happens there, in the shared open world.
- **Waiting on the owner:** the rest of the tutorial spec (10 questions asked: location, PvP protection, steps, completion rules, locks, skipping, reward), plus whether Country 1 is the starter and tutorial area.

## 2026-11-17: Clean-room server core started
**Direction change:** Rel's World is now planned as a **commercial MMORPG**. New rules (clean room, human-led design, small modules, no unapproved dependencies, authoritative server, command objects, TypeScript only) are in `CLAUDE.md`.

**Done**
- The browser prototype is saved on the `prototype` branch. It's still live on GitHub Pages for playtesting, but it is **not** the basis for the real game.
- New `server/` folder (TypeScript, no runtime dependencies): `GameState`, `Command` / `StateUpdate` / `CommandResult`, `CommandRouter`, and `updateTick()`. 7 passing tests with a hand-written test runner.
- Approved dev tool: TypeScript compiler (Apache-2.0).

- **Spec 1 (owner): Player + MoveCommand.** `PlayerState` (id, name, level, x/y/z, facingAngle, baseMoveSpeed 5.0, hidden currentHealth/maxHealth, stunned/rooted), 20 ticks/s, MoveCommand with a normalized direction vector + facing angle, server checks (alive/not stunned/rooted, vector length ≤ 1.0, no walls or map edge, per-tick distance cap including multiple commands in one tick). Wounded-state reminders are in the code comments. 20 tests pass.

**Decisions (2026-11-17)**
- The game will be sold later, so only original, fully owned assets ship. AI-generated or store assets are placeholders only.
- The repo goes **private** (owner switches it in GitHub settings). Test builds go to the private Claude test artifact.

- Added `docs/IP-RULES.md` (originality rules), `docs/IP-LOG.md` (asset log), and an originality notice at the top of CLAUDE.md, the server README and every server source file.

**Next up:** owner's answers to the spec-1 questions below, then the next spec (combat? terrain model?).

**Spec-1 questions for the owner (current behavior in brackets)**
- Facing angle units [radians, 0 = +X, any value accepted, not wrapped].
- Z height [stored, never changed by MoveCommand].
- Blocked move [whole move rejected, player stays put] or slide along walls?
- Player size for collision [treated as a point].
- Move rejected while stunned [facing doesn't change either].
- Terrain model for cliffs/steep slopes [not designed; a box placeholder is used in tests].
- Does input persist between ticks [no: one MoveCommand moves one tick; the client sends one every tick while moving]?

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

# Rel's World: notes for Claude

Read this first in every new chat, then read `docs/PROGRESS.md` to see where we left off.

## What this is
A top-down open-world RPG for the owner's kid, starring **Rels** (brown ponytail, black cat tee, white flower pants, black crocs, ginger cat that rides on her head). OSRS / MapleStory feel, phone-first with an on-screen joystick. The original runner game lives in the owner's claude.ai artifacts as "Rel's World" and is the source for characters and swords. Its old "find Dad" storyline is shelved, so don't use it.

## Rules for working on it
- Plain JavaScript ES modules, **no build step**, so it runs on GitHub Pages and can be wrapped as an iOS/Android app later (Capacitor).
- `js/core/` is pure game logic with **no DOM**. It must stay runnable on a Node server for the future online version. Drawing goes in `js/render/`, HUD and menus in `js/ui/`.
- Keep files small and focused. Put new content (monsters, items, quests, regions) in `js/core/data.js` where possible.
- Kid-friendly: no gore, knocked out instead of dying, nothing lost on death.
- **No cutscenes.** The game never takes control away from the player; tips go in the chat log, story goes in NPC dialogue.
- Test in headless Chrome (playwright + `/usr/bin/google-chrome`, phone viewport 390×844) before pushing. Check: no console errors, every region reachable on foot.
- Live site: https://michaelevans092520-lab.github.io/Rels-world/ (GitHub Pages, `main` branch, root folder). Updates go live a minute or two after each push.
- **At the end of every work session, update `docs/PROGRESS.md`**: what was done, what's next, open decisions.

## Design docs
- `docs/PROGRESS.md`: where we left off, next steps
- `docs/map-design.md`: Pangea map, 8 regions, level ranges
- `docs/builds.md`: plan for unique player builds (combat styles, loadouts, perks, combos)

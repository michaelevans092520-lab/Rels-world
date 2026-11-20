# Rel's World: notes for Claude

Read this first in every new chat, then read `docs/PROGRESS.md` to see where we left off.

> **ORIGINALITY RULE: this game will be sold.** Before writing code or adding any asset, follow
> `docs/IP-RULES.md`: everything original and owned, nothing copied from other games, tutorials or
> repos, no unapproved libraries, and every asset logged in `docs/IP-LOG.md`.

## What this is
An original, commercial online RPG (MMORPG) with an overhead camera and free-coordinate movement, playable with joystick, keyboard or controller. The main character is **Rels** (brown ponytail, black cat tee, white flower pants, black crocs, ginger cat that rides on her head). Other games are only reference points for *feel*. Never borrow their mechanics, formulas, names or content. The owner's original runner game (claude.ai artifact "Rel's World") is the owner's own work; its "find Dad" storyline is shelved.

## For the whole project
- **Commercial game, to be sold later.** Everything that ships must be original and fully owned: no store/CC0/AI-generated assets in the final game (placeholders only, tracked), commissioned art needs a written IP assignment, no names echoing other games, fonts must allow commercial redistribution. Never ship prototype code.
- **The repo is private** (owner's decision, 2026-11-17). GitHub Pages is off, so test builds go to the owner's private Claude test artifact: https://claude.ai/artifact/23AVWwAEDBwDzEMwp9USez
- **Keep important logic on the server.** Client code can always be inspected, so anything that matters (combat, loot, trading) stays server-side.
- **When asking the owner design questions, use tappable multiple-choice prompts** (the AskUserQuestion tool) whenever possible. The owner prefers choosing from a list.
- **No cutscenes** (owner's rule). The game never takes control away from the player.
- **At the end of every work session, update `docs/PROGRESS.md`**: what was done, what's next, open decisions.

## Two parts of this repo
- **`server/`: the real game (clean-room, TypeScript).** The authoritative server core. Everything new goes here, under the rules below.
- **Root `index.html` + `js/`: the old browser prototype (JavaScript).** It's frozen on the `prototype` branch and is only for playtesting ideas. Parts of it were modeled on OSRS (XP curve, combat formulas, tick length, skill names), so **never copy or port prototype code into `server/`**.

## Owner's rules for `server/` (these override everything else)
- **Clean room:** write all code from scratch with standard patterns. Never copy or closely mimic code, algorithms, formulas or architectures from existing games, tutorials or public repos.
- **Human-led design:** do not invent game mechanics or build big systems unprompted. Wait for the owner's design rules, state variables and loop logic, and translate exactly those into code. Ask when a design detail is missing; don't fill it in.
- **Small, reviewable modules:** every function single-purpose and under ~30–40 lines, with short comments explaining the math or logic.
- **No unapproved dependencies:** no libraries, frameworks or packages without explicit approval. If one seems necessary, stop and state its license and any commercial limits first. Approved so far: the TypeScript compiler (`typescript`, Apache-2.0) as a dev tool. Runtime dependencies: none.
- **Plain, descriptive names.** Avoid naming conventions recognizable from existing projects.
- **Authoritative server:** all gameplay (combat, inventory, movement math, trading) is pure server-side logic. World state is plain data with no screen, audio or UI dependencies.
- **Commands in, updates out:** player actions are command objects (`MoveCommand`, `AttackCommand`, ...) handled through `CommandRouter`, returning `StateUpdate`s. The entry point is `updateTick(state, deltaSeconds, commands, router, systems)`. Owner specs live in `docs/specs/`.
- **Data-driven:** stats, levels and rules live in plain data objects, not hardcoded in functions.
- **One language: TypeScript** in `server/`. Don't mix languages there.
- Test with `cd server && tsc -p . && node dist/test/run-all.js` before pushing.
- **Design reminder:** health is hidden (no HP bar, fight to the death). A future "wounded state" at low health % will change walk stance, reduce move speed and slow attack speed. Hook it into `effectiveMoveSpeed()` in `player/player-state.ts`.

## Rules for the prototype (root `js/`)
- Plain JavaScript ES modules, **no build step**, so it runs on GitHub Pages and can be wrapped as an iOS/Android app later (Capacitor).
- `js/core/` is pure game logic with **no DOM**. It must stay runnable on a Node server for the future online version. Drawing goes in `js/render/`, HUD and menus in `js/ui/`.
- Keep files small and focused. Put new content (monsters, items, quests, regions) in `js/core/data.js` where possible.
- Kid-friendly: no gore, knocked out instead of dying, nothing lost on death.
- Test in headless Chrome (playwright + `/usr/bin/google-chrome`, phone viewport 390×844) before pushing. Check: no console errors, every region reachable on foot.
- Test link: the owner's private Claude artifact (see above). GitHub Pages no longer works because the repo is private.

## Design docs
- `docs/IP-RULES.md`: originality and IP rules (must read)
- `docs/IP-LOG.md`: log of every asset and where it came from
- `docs/PROGRESS.md`: where we left off, next steps
- `docs/map-design.md`: Pangea map, 8 regions, level ranges
- `docs/builds.md`: ideas for unique player builds (from the prototype era, not approved designs)
- `server/README.md`: how the server core works

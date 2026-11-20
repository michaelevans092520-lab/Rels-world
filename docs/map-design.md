# Map design notes

Status: **draft.** The real game's map hasn't been specced yet. Region names
are placeholders (**Country 1–8**) until the owner picks final names.

## Plan: one connected supercontinent ("Pangea") first
- Every country is joined and walkable, with no boats or loading screens.
- Each country has its own look, monsters, level range and fighting style, so it still *feels* like a separate land.
- Borders are natural transitions with a few road chokepoints, so the map could be split into islands later.

## The 8 countries
**Owner's decision (2026-11-20): countries do NOT have level ranges.** Difficulty is spread out
everywhere: every country has easy, medium and hard content. The overall goal of the game is
**quests and levels**, not moving from one level band to the next. The numbers below are just names.

| Country | Known for | Look | Where |
|---|---|---|---|
| Country 1 | Swordsmanship | Grassland, village, dark forest, south beaches and dock | South centre |
| Country 2 | Archers | Cobblestone city | Centre |
| Country 3 | Earth magic* | Crystal flats and sand | South-west |
| Country 4 | Necromancy | Swamp, bog pools, dead trees | West |
| Country 5 | Strength warriors | Snow, pine forests | North-west |
| Country 6 | Fire magic* | Ash and lava | North-east |
| Country 7 | Water magic* | Coral sand, lagoons, palms | East |
| Country 8 | Air & star magic | Star-grass, glowing trees | North centre |

\* These were called "benders" earlier. **Don't use "bender" in the real game.** That word is strongly tied to an existing franchise. "Magic" is a neutral placeholder until the owner names these styles.

Roads (prototype layout): 1 → 2 → 8; 2 → 7 → 6; 1 → 3 → 4 → 5 → 8 → 6.


## Size plan (owner, 2026-11-20)
- Build the systems for a **big world** from day one: chunked terrain, loading only what's near the player, sending only nearby players and monsters to each client, and room to split the server by area.
- Build the content **a little at a time**: launch with Country 1 small and dense, then grow it and add countries in updates.
- Travel time at 5 units/s (if 1 unit ≈ 1 m): 2 km ≈ 7 min, 5 km ≈ 17 min, 10 km ≈ 33 min on foot. Bigger maps will need mounts or fast travel.

## Later (maybe): break the supercontinent apart
- Possibly split it into separate islands down the line (story event, or just how the map evolves).
- Each country is its own chunk with clear borders, so road chokepoints could become docks or boat routes.

## Open questions
- Final country names (owner).
- Decided: players start in Country 1, where the tutorial happens. Each country has areas with monsters; quests have requirements; no level or health is displayed anywhere.
- Whether the split happens, and how.
- Real monsters, bosses and trainers per country.

## Prototype names (old browser prototype only, not used in the real game)
Country 1 = Ember Key · 2 = Mossreach · 3 = Saltglass · 4 = Duskfen · 5 = Frostmere · 6 = Cinder Isle · 7 = Coral Drift · 8 = Starfall

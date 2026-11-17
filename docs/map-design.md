# Map design notes

## Current plan: Pangea first (built 2026-11-16)
- **One connected supercontinent** (300×250 tiles). Every region is joined and walkable, with no boats or loading screens.
- Each region has its own ground, trees, monsters, level range and fighting style, so it still *feels* like a separate land.
- Borders are natural transitions, and roads join the region hubs, so the map can be cut apart later.

## The 8 regions
Coordinates and data live in `REGIONS` in `js/core/data.js`.

| Region | Levels | Known for | Ground / look | Where |
|---|---|---|---|---|
| Ember Key | 1-10 | Swordsmanship | Grass, village, Gloomwood forest, south beaches and dock | South centre (start) |
| Mossreach | 10-20 | Archers | City of cobblestones, brute camp W, ninja hideout NE | Centre |
| Saltglass | 20-30 | Earth benders | Crystal flats and sand, crystal spires | South-west |
| Duskfen | 30-40 | Necromancy | Swamp with bog pools, dead trees | West |
| Frostmere | 40-50 | Strength warriors | Snow, pine forests | North-west |
| Cinder Isle | 50-65 | Fire benders | Ash and lava pools, charred trees | North-east |
| Coral Drift | 65-80 | Water benders | Pink coral sand, lagoons, palms | East |
| Starfall | 80-99 | Air & star magic | Indigo star-grass, glowing trees (endgame) | North centre |

Roads: Ember Key → Mossreach → Starfall; Mossreach → Coral Drift → Cinder Isle; Ember Key → Saltglass → Duskfen → Frostmere → Starfall → Cinder Isle.

Danger is the gate (OSRS-style): nothing is locked, but high-level regions will knock you out fast. A banner warns you when you enter a region above your level.

## Later (maybe): break Pangea apart
- Possibly split the continent into separate islands down the line (story event? "the Shattering"?).
- To keep that easy, each region is its own chunk with clear borders and a few road chokepoints that could become docks/boat routes.

## Open questions
- Does the split happen as a story moment, or is it just how the map evolves between updates?
- Real monsters, bosses and trainers per region (placeholders for now).

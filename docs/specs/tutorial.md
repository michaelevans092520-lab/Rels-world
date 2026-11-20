# Spec: Tutorial (owner's design, in progress)

Every new player goes through a tutorial **in the shared open world**, around other players.
No cutscenes: the game never takes control away from the player.

## Decided (owner, 2026-11-20)
- **Where:** Country 1, where all players start.
- **Other players:** normal open-world rules apply from the first second. Tutorial players are **not protected** and can be attacked. Safety comes from separate **PvP areas** (to be designed).
- **Allowed during the tutorial:** seeing, chatting, trading and grouping with other players.
  - 🔔 **Reminder for Claude:** the owner said they may think of more interactions. Ask them about it when chat, trading, grouping or PvP areas get designed.
- **Locked until finished:** leaving the start area. Everything else is allowed.
- **Skipping:** required on a player's first character; **later characters can skip it.**
  - Needs an **account** concept (several characters per account), which doesn't exist yet. To be designed.

- **Teaches:** moving and turning, fighting, talking to NPCs and quests (incl. the quest log), items and the bag.
  - 🔔 **Reminder for Claude:** the owner may think of more topics. Ask again before finalizing the step list.
- **Guidance:** a **guide NPC** plus **on-screen hints**, with **extra reminders if the player is taking too long or seems stuck.**
- **Ending:** leaving the start area unlocks, and the player gets a **starter reward**.
- **Can't die during the tutorial.** Tutorial players can still be attacked (open-world rules), but they cannot be killed. The **guide NPC restores their stats.**

- **Order (owner):** move → pick up an item → equip it → fight a training target → accept the first quest from the guide.
- **Stuck reminders (owner):** first after 30 s without progress on a step, then every 30 s. Progress resets the timer.
- **Can't die (owner):** health stops at 1; the guide restores health automatically when it gets low.
  - 🔔 **Reminder for Claude:** the owner wants to add extra guide chat later. Ask when NPC dialogue gets designed.
- **Start area (owner):** about 100 units across, a circle with radius 50 around its center.

## Built (2026-11-20), in `server/src/tutorial/` + `server/src/data/tutorial-rules.ts`
- Progress per player, steps as data, hints when a step starts, stuck reminders, health floor + guide restore, start-area lock in MoveCommand, completion (unlocks the area, reports the reward), skip flag on character creation. 14 tests.
- The tutorial **listens for updates** from other systems. Until those systems exist, only the **move** step can happen in real play:
  - `itemPickedUp` and `itemEquipped` → need the items/bag system
  - `trainingTargetHit` → needs combat
  - `questAccepted` → needs NPCs/quests

## Defaults to confirm (Claude filled these in; change them in `tutorial-rules.ts`)
- Move step: **10 units** walked. Fight step: **3 hits** on the training target.
- "Low" health for the guide restore: **25%** of max.
- "Restore stats" restores **health only** for now.
- Hint texts are **draft wording**.
- Start-area center: **placeholder (0, 0)** until Country 1's map exists.
- Starter reward: **empty** until items exist (owner names them).
- Skipping is a flag set when a character is created; the **account system** that decides it doesn't exist yet.

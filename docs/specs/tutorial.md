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

## Still needed from the owner
- **Step order and "done" rules,** e.g. "move 10 units → hit the training target 3 times → talk to the guide → accept a quest → pick up an item → equip it."
- **"Taking too long / stuck":** after how many seconds without progress does a reminder show? Repeat how often?
- **Can't die:** does health stop at 1 (or another floor)? Does the guide restore stats automatically when health gets low, only when the player talks to them, or both? Which stats ("restore" = health only for now)?
- **Starter reward:** which items or gear (to be defined as data).
- **Start area boundary:** where in Country 1 and how big.

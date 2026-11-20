# Spec: Fast travel (owner's design, in progress)

Each travel method has its own **movement rules as data**. Items will point to these rules later.

## Decided (owner, 2026-11-20)
- **Travel types for now:** **mounts** and **teleport points** (fixed spots on the map).
  - 🔔 **Reminder for Claude:** **teleport items** will be added eventually. Bring it up when items are designed.
- **Fighting on a mount:** allowed. **How fighting works in the world will be decided later.**
  - 🔔 **Reminder for Claude:** ask about mounted combat details when combat is designed.
- **Wounded state:** travel depends on the **health of the mount** (or whatever is doing the traveling), not only the rider.
  - 🔔 **Reminder for Claude:** the owner wants to design this later. Raise it when mounts or the wounded state get built.
- **Teleport limits:**
  - Costs **coins or items** (needs the items/currency system first).
  - A teleport point must be **discovered first**.
  - **Possibly can't teleport out of a PvP fight.** Everything else is allowed. (PvP areas aren't designed yet.)

## Still needed from the owner
- Mount speed (a multiplier on the 5.0 base, or a fixed speed).
- How mount health works (does a hurt mount slow down? what happens at zero?).
- How a teleport point gets discovered (walk within some distance? interact with it?).
- Teleport timing (instant, or a short wait that gets cancelled if you move or get hit).
- Teleport cost amounts (once coins/items exist).

# System Configurations for Foundry VTT

The **Character Backstory Generator** and **Personality Oracle** modules can work with most Foundry VTT game systems by configuring the appropriate data paths. This file provides a list of known working paths for popular systems. These are used in module settings under the "Path" configuration fields.

> ⚠️ Some systems may store data differently. When in doubt, inspect the actor data structure via the console:
> ```js
> game.actors.getName("Your Character Name")
> ```

---

## Hyperborea (hyp3e)

- **Age:** `system.details.age`
- **Gender:** `system.details.gender`
- **Race / Ancestry:** `system.details.race`
- **Class:** `system.details.class`
- **Biography:** `system.biography`

---

## Adventurer Conqueror King System (acks)

- **Age:** `system.details.age`
- **Gender:** _(not stored by default)_
- **Race / Ancestry:** _(not stored by default)_
- **Class:** `system.details.class`
- **Biography:** `system.details.description`

---

## Old School Essentials (ose)

- **Age:** _(not stored by default)_
- **Gender:** _(not stored by default)_
- **Race / Ancestry:** _(stored in `system.details.class`, e.g. "Elf", if applicable)_
- **Class:** `system.details.class`
- **Biography:** `system.details.biography`

---

## Pathfinder 2nd Edition (pf2e)

- **Age:** `system.details.age.value`
- **Gender:** `system.details.gender.value`
- **Race / Ancestry:** `system.details.ancestry.name`
- **Class:** `system.details.class.name`
- **Biography:** `system.details.biography.backstory`

---

## Worlds Without Number (wwn)

- **Age:** _(not stored by default)_
- **Gender:** _(not stored by default)_
- **Race / Ancestry:** `system.details.background`
- **Class:** `system.details.class`
- **Biography:** `system.details.biography`

---

## D&D 5E (dnd5e)

- **Age:** `system.details.age`
- **Gender:** `system.details.gender`
- **Race / Ancestry:** `system.details.race`
- **Class:** _(class stored as keyed object, must be entered manually)_
- **Biography:** `system.details.biography.value`

---

## Contributing

Know a system not listed here? Please open a GitHub issue or submit a pull request with:

- The system ID
- The data paths to age, gender, race/ancestry, class, and biography (if applicable)
- Any notes on quirks or limitations

---

_Last updated: June 30, 2025_

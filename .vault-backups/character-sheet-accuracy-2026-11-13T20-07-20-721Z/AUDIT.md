# Upstream functionality audit

Compared the custom importer against upstream **1.1.4**, the current repository manifest version at audit time (2026-11-13). Source: https://github.com/Webcreator3478/D-D-Beyond-Character-Importer---Obsidian-Plugin/blob/main/main.ts . The pinned GitHub source blob is f0b45625475027f4dabe97f5f06da2bd40562104. The bundled original matches the SHA-256 recorded when this fork was created; audit snapshots and provenance are in audit/.

## Result

No unexpected missing original capability was found after restoring the saving-throw advantage/disadvantage badges dropped by the compact table presentation. The original import dialog, legacy HP modal, standalone dice roller, interactive sheet engine, 5etools data modal and settings implementation match upstream's original bundled implementations after namespace changes and the specific HP-target selector fix. The custom wrapper changes their presentation and adds persistent local adventuring management.

## Feature comparison

| Original capability | Custom behavior / evidence |
|---|---|
| Import by full share URL, short URL or numeric ID; input errors | Retained. Regression tests exercise all formats and invalid input. |
| Ribbon tools and command palette entries | Both ribbon tools and all three original commands retained. Browser exercised dialogs. |
| Output folder and four include switches | Retained. Regression tests check omitted generated-note sections. |
| Seven original settings, including 5etools toggle/base URL | Retained; setting definitions and implementation compared. Settings count checked in browser. |
| Re-import existing notes, including renamed files | Retained for custom-owned notes; tags and fenced character ID replace frontmatter ID. Regression tested. |
| Original/legacy note open and refresh | Retained; legacy data-only refresh preserves existing note text. Original-plugin coexistence tested. |
| HP damage/healing, quick buttons, temporary HP and death saves | Original engine retained. Regression covers HP/temp handling; browser checks both death-save sets and reset. |
| Abilities, saving throws and all 18 skills; proficiency/expertise/advantage indicators | Original calculation and roll handlers retained. All Skills preserves full original rows. Restored save advantage/disadvantage badges in compact ability table. |
| Attack rolls and damage dice | Retained; browser exercised an equipped synthetic weapon and checked the live log. |
| Spell grouping/descriptions/concentration requirement/prepared state | Retained; local preparation/casting/concentration controls extend it. Browser and regression tests pass. |
| Slot counters and recovery | Replaced by local counters and Short/Long Rest controls. Uses original slot-state key; class-derived slot totals are read-only, per user request. |
| Equipment quantity/weight and equip toggle | Retained; browser checks toggle. Original behavior remains a local equip flag, not a recalculation engine. |
| Traits, feats, class labels and expandable descriptions | Retained. Upstream itself only displays class/level labels in its Class Features panel; full class-feature automation was not present. |
| Backstory, personality, ideals, bonds, flaws and other imported notes | Retained in the folded imported reference when included. Native session-notes textarea remains interactive. |
| Currency and proficiencies | Retained; original display controls are moved into the single-column flow. Original currency is a display, not a money editor. |
| Per-sheet roll log and Clear | Retained; browser exercised attack/damage logging and Clear. |
| d4/d6/d8/d10/d12/d20/d100 | Retained; all seven dice clicked in browser. |
| Dice history filter, statistics, clipboard copy, CSV export, Clear | Retained. Browser tested filter/statistics and mocked clipboard/download targets. |
| Optional 5etools spell/item/trait/feature lookup | Retained. Browser mocked lookup responses and exercised each category; live service availability was not tested. |
| Legacy standalone HP modal | Retained; command opens original modal. |

## Intentional differences to preserve

- Tags-only player-character frontmatter: the original Dataview/stat properties were explicitly removed. They are not silently restored.
- One themed statblock surface, automatic narrow ability layout and folded imported reference replace the original dashboard presentation.
- Character ID lives in the tracker fence. Existing data-only character notes are not overwritten by refresh; custom-generated notes retain note-refresh behavior.
- Persistent full character snapshots, local spell preparation/casting/free uses/concentration, 2024 rest recovery, Hit Dice and Ki/Focus extend upstream functionality.
- Manual slot-capacity editing, the manual resource builder and the ability-layout dropdown remain removed as requested.
- Original benefit/limitation remains: D&D Beyond access is read-only; changes are local. No complete rules validation, concentration checks, conditions or arbitrary class-feature automation is implied.

## Validation and limits

Run these from the plugin directory:

~~~sh
node test-upstream-parity.cjs
node test-loader.cjs
~~~

The parity test uses the pinned bundled original in audit/ and verifies six retained engine classes, original commands and dice, and the badge restoration hook. Regression tests additionally cover offline reloads, profile/session persistence, slots, free casts, preparation, concentration, rest recovery, Undo, legacy fallback, unload cleanup, original-note preservation and original-plugin coexistence.

Browser checks loaded the actual custom build in a native DOM with the installed Transparent theme and a mocked Obsidian host. Synthetic fixture additions exercised advantage/disadvantage and weapon damage. Clipboard, CSV download and 5etools responses were mocked. This was not an end-to-end test inside the running Obsidian application or against live D&D Beyond/5etools services. No real messages were sent and test interactions did not write the user's tracker data.

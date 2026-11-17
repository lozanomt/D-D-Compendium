# DnD Beyond Importer — Custom

Personal fork of [DnD Beyond Importer 1.1.4](https://github.com/Webcreator3478/D-D-Beyond-Character-Importer---Obsidian-Plugin), with a theme-aware player statblock and local adventuring controls. Current version: **0.6.2**.

## Using the sheet

Reload Obsidian after installing a new build. Existing dnd-player-character blocks use the updated renderer automatically. The character ID stays in the block; only the player-character tag is needed in frontmatter. Existing data-only notes retain their text when refreshed. A saved older import reference remains folded separately, preserving backstory and annotations.

The overview retains the portrait/placeholder, HP, AC, speed, initiative, abilities/saves, passive senses, proficiencies, all skills, death saves, inspiration and condition reminders. Abilities automatically use two rows of three or three rows of two according to card width. The inline and popup sheets use the same section renderer.

| Section | Behavior |
|---|---|
| Actions | All, Attack, Action, Bonus Action, Reaction, Other and Limited Use filters; class actions, equipped weapon actions, spell attacks, attack/damage/healing rolls and Ki usage. Roll log remains available. |
| Spells | Prepared/granted spells by default. Manage Spells reveals available class spells; level filters isolate cantrips or a spell level. Search, source/legacy labels, casting time, range, duration/components, concentration, attack bonus or save DC, roll controls, slot/free-use casting and local preparation. Domain spells are always prepared and do not count against the normal preparation limit. |
| Inventory | All, Equipment, individual container and Attunement views; search, equipped state, quantities, item descriptions and currency. Equipment changes update armor/movement and available weapon actions. |
| Features & Traits | All / Class Features / Species Traits / Feats filters over current-level class/subclass features, racial traits and real feats. Future-level and disguised placeholder entries are omitted. Existing optional 5etools lookups remain available. |
| Background | Imported background, its feature, personality, ideals, bonds, flaws and identity fields when present. |
| Notes | All / Organizations / Allies / Enemies / Backstory / Other filters; imported note fields with separate local edits. Other includes the preserved session-notes textarea. |
| Extras | Grouped extras and a Manage Extras control for local companion HP trackers, alongside imported descriptions when present. The current character has no imported companions. |

Cast consumes the selected slot or imported free use and tracks concentration. ATK/DMG/Heal buttons roll dice; they do not independently spend a spell slot or Ki. Use Cast or the explicit Ki Use control for expenditure. Concentration can be ended manually and clears when tracked HP falls to zero. Conditions are reminders; automatic condition/save/timing validation is not a complete rules engine.

Short Rest and Long Rest are summary buttons, not main tabs. Each opens a dialog. Short-rest Hit Dice rolls are a preview until Finish; Cancel leaves HP and Hit Dice unchanged. Finish commits the preview and resource recovery together, with Undo retaining the pre-rest state. Recovery follows the saved D&D Beyond preference.

## Character accuracy

The implementation was compared with the public D&D Beyond sheet for the current Monk 3 / Cleric 1 character. Verified values: AC 15, walking speed 40 ft., STR/DEX/CON/INT/WIS/CHA saves +1/+5/+2/+0/+2/−1, Martial Arts attack +5 and 1d4+3 damage, spell attack +4, spell save DC 12, domain spells Bless/Cure Wounds, and Disciple of Life healing bonuses. The default visible spell list matches the eleven spells on the live sheet.

Legacy Monk/Life Domain class rules are retained. Rest recovery is independent: this character's saved longRestType=2 means full Hit Dice recovery, which was confirmed against the D&D Beyond character application's enum and rest UI. longRestType=1 means half recovery. If the preference is absent, class-source edition supplies a fallback. No rest timer or completed-rest eligibility engine is implied.

The correction layer filters nonstarting-class proficiency grants, handles Unarmored Defense and Movement, uses the Martial Arts scale and relevant modifiers, distinguishes spell attacks from saves, filters future features, and respects the displayed class spell progression. It is tested for this character and related fixtures; arbitrary homebrew/conditional magic-item rules and every subclass interaction are not fully automated.

## Supplemental spells and persistence

D&D Beyond serves domain and available class spells separately from the main character export. enrichCharacter fetches those same read-only always-prepared-spells and always-known-spells endpoints using the imported class/subclass, level, campaign and sharing context. The results are saved with the full character snapshot. A verified spell-cache.json bootstrap is included for the current character so the first opening can work offline. Cache signatures prevent applying a different character/class-level list. Online Refresh re-fetches the lists; failed supplementary requests retain compatible cached lists and display a partial-data notice.

All edits are local to Obsidian. No changes are sent to D&D Beyond. Refresh preserves local preparation, slot expenditure, notes, equipment flags, currency and other tracker state. Undo reverses the latest tracker action. Adding or changing the actual character build still happens in D&D Beyond, followed by Refresh. Supplemental lists depend on the public endpoint's availability/content access.

Original import formats, ribbon/command tools, seven settings, the legacy HP modal, standalone dice roller/history/filter/statistics/CSV/clipboard controls and optional 5etools integrations are retained. The generated-note include switches retain their original behavior. Tags-only properties, local rests and read-only class-derived slot capacities remain intentional changes.

## Editing and building

- entry.js: Obsidian integration, import/cache/persistence, HP/slots/rests/preparation, inline/popup lifecycle and automatic ability layout.
- lib/character-rules.js: pure calculation, source filtering, spell/action models and recovery preference logic.
- lib/character-sheet.js: section navigation and player-sheet presentation.
- lib/description-renderer.js: allowlisted table/list/paragraph rendering and lazy-description compatibility.
- lib/importer.js: retained namespaced original engine and generated-note hooks.
- styles.css: player controls, navigation, popup isolation and importer styles.
- .obsidian/snippets/dnd-2024-book.css: shared monster/player surface, typography and ability-table styling; Stat Block Appearance width/opacity controls.

Run node build.cjs after JavaScript changes. It embeds the four lib modules into main.js; Obsidian only needs the self-contained main.js, styles.css and manifest.json at runtime. Do not hand-edit main.js.

## Validation

~~~sh
node build.cjs
node test-character-rules.cjs
node test-descriptions.cjs
node test-loader.cjs
node test-upstream-parity.cjs
~~~

These checks cover live-matching character calculations, armor transitions, feature levels, domain spell merging, save DCs/healing, rest preference overrides, preparation limits, offline bootstrap, source immutability, persistence/Undo, old/new widgets, import formats/settings, original-note preservation and the retained upstream engines.

Browser integration checks load the actual build with the installed Transparent theme and a mocked Obsidian host. The saved character and read-only supplemental spell responses were used to compare live values. Checks cover all seven sections, eleven visible spells, casting/concentration, notes, inventory/currency and armor effects, popup cleanup, extras creation, narrow-width rendering, retained dice/history/export/clipboard controls and optional lookup handlers. Clipboard/download and 5etools responses are mocked in these tests. This is not a full end-to-end test inside the running Obsidian application.

See AUDIT.md and audit/ for the pinned upstream comparison and attribution. Backups are under the vault's .vault-backups folder. Original project copyright and MIT license are preserved in audit/LICENSE.

## Organization update (0.6.1)

Main navigation matches the requested order: Actions, Spells, Inventory, Features & Traits, Background, Notes, Extras. Actions retain their action-economy groups under every filter. Limited Use matches the inspected live character view: Healing Word under Bonus Actions, and Ki Points under Other. Their controls use the same local free-use and Ki state as the rest of the sheet. UI filter changes do not consume Undo history. Filter selection survives local resource updates.

Validation additionally covers seven-section order; all action filters; limited-use expenditure and grouping; spell-level filtering and Manage Spells; Equipment/container/Attunement views; feature/note filters; Manage Extras; rest-preview cancellation and commit; recovery preferences; popup parity/cleanup; and narrow-width overflow. The UI checks use the installed Transparent theme and the actual character export in a mocked Obsidian host.

## Description tables and whitespace (0.6.2)

Imported feature, trait, background, action, spell, inventory and extra descriptions preserve their original paragraphs, lists, emphasis and reference tables. Source HTML indentation is collapsed; author-intended paragraphs and line breaks remain. Compact roll tables retain their roll/result columns, and wider tables scroll within their description. Ability-table styling is scoped to the actual ability table and cannot format reference tables.

The renderer parses imported HTML inertly and reconstructs a small formatting allowlist; source styles, handlers and active elements are not copied. Original lazy spell/trait expansion and optional lookup updates remain operational. Plain-text note editors remain editable; imported plain-text whitespace is bounded to normal paragraph breaks.

Validated against the actual Implements of Mercy d6 Mask Appearance table (all six results), Outlander d10 Origin table (all ten results), Martial Arts/Magic Initiate lists, narrow-sidebar widths and lazy spell reopening. The standalone test-descriptions.cjs uses Edge (or EDGE_PATH) for repeatable table/spacing/fallback and sanitization checks.

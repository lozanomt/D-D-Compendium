# DnD Beyond Importer — Custom

Personal fork of DnD Beyond Importer 1.1.4 by Jktaisa. Custom version: 0.3.0.

## Character notes

Imported notes have a single property: tags, containing player-character. Names, statistics, class, level, and other information remain in the note body and complete saved character profile. The D&D Beyond ID stays in each widget’s charId field, so no ID property is needed.

New imports go to Characters/Custom Importer. Re-importing locates an existing custom character note by its widget ID and player-character tag, including after a move or rename. Old dndbeyond_custom_id properties and dnd-character tags remain supported for backward compatibility. Original widget names are not adopted as custom note replacement targets; multi-character dashboards are also excluded.

## Interactive sheets and refresh

With the original importer disabled, this plugin supports the original dnd-sheet-launcher and dnd-hp-tracker blocks as well as the custom names. Reload Obsidian after changing enabled importers.

Open Interactive Character Sheet fetches and saves a complete profile on the first opening. Later openings, including after restarting Obsidian, can use the saved offline profile.

Refresh on an original-widget note updates sheet data without rewriting the note. Refresh on a custom-widget note re-imports its generated Markdown. The Custom: Refresh active character sheet data command updates data without rewriting either kind of note; it reads the ID from widgets when no ID properties exist.

## Saved data

Complete profiles, HP, death saves, spell slots, equipment state, session notes, and dice history live in data.json under __customRuntime. Keep this file when updating your local plugin.

## Files to edit

| File | Purpose |
|---|---|
| entry.js | Compatibility, loading, persistence, launcher controls, and locating imported notes. |
| styles.css | Interactive sheet appearance; add overrides at PERSONAL OVERRIDES at the end. |
| lib/importer.js | Copied importer engine, sheet renderer, and Markdown generator. |
| main.js | Generated self-contained bundle; do not edit directly. |
| build.cjs | Rebuilds main.js with Node built-ins. |
| test-loader.cjs | Runs the isolated loader and functionality tests. |
| test-functionality.cjs | Regression tests using fake data and no network access. |
| manifest.json | Plugin identity, version, and upstream credit. |

After JavaScript edits, run node build.cjs and node test-loader.cjs in this folder, then reload the plugin. CSS changes need no build.

## Appearance

The sheet uses the monster stat blocks’ translucent black background, faint border, headings, spacing, and shaded rows. The vertical ability list remains. Colors follow your Obsidian theme.

Background opacity: Settings → Style Settings → Stat Block Appearance → Black background opacity. This shared control comes from dnd-2024-book.css.

Sizing: Settings → Style Settings → DnD Beyond - Custom Importer.

## Upstream

Original author: Jktaisa
Author profile: https://github.com/Webcreator3478
Project: https://github.com/Webcreator3478/D-D-Beyond-Character-Importer---Obsidian-Plugin


## Native player-character stat block

New imports use a [!player-character] callout containing a dnd-player-character code block. It renders the full interactive sheet directly in the note: HP, rolls, saves, spell slots, equipment, features, and session notes. Open in window launches the same sheet as a popup.

The required field is charId. refreshMode: data refreshes the profile without rewriting note text; refreshMode: note re-imports a generated note. Optional maxHp, currentHp, and tempHp values preserve the HP-only fallback when full character data is unavailable. Existing original-importer notes are converted with data-only refresh. The older widget names still work.

Properties are hidden in Reading mode for notes containing the player stat block. They remain editable in Live Preview and Source mode. Notes still contain only the player-character tag property.

A reusable Player Character Tracker.md template is in the vault’s configured Templates folder. Set its charId to the D&D Beyond character ID.

## Width controls

Settings → Style Settings → Stat Block Appearance now contains:

- Note content width: maximum width of monster and player-character note content; default 1200 px.
- Stat block width: percentage of the available content width; default 100%.
- Fill available note width: remove the maximum note-width limit entirely.

These controls come from dnd-2024-book.css. The inline sheet adapts to the width of the note pane, including when sidebars are open. Popup width remains separately adjustable under DnD Beyond - Custom Importer.

## Unified monster and player presentation (0.4.0)

The player sheet uses a single Monster Manual-style column: name and identity, portrait, core stats, paired STR/DEX/CON and INT/WIS/CHA rows, trained skills, languages, Traits, Actions, Spellcasting and equipment. Underlined modifiers retain their dice rolls. HP/death saves, all skills, proficiencies, notes and the roll log expand in place. The popup uses the same layout.

Existing imported reference text is preserved inside a folded `player-reference` callout; new imports use the same arrangement. Only the `player-character` tag is required in frontmatter. Refreshing a data-only tracker continues to preserve its note.

Edit `formatPlayerSheet` in `entry.js` to change section order and ability-table orientation, then run `node build.cjs`. The final **Unified Monster Manual presentation** section of `styles.css` controls spacing, typography and table shading. Existing Stat Block Appearance settings control width and opacity.

### Shared visual rules

Monster and player presentation now share the **SHARED STATBLOCK DESIGN** section at the end of `.obsidian/snippets/dnd-2024-book.css`. This owns typography, table metrics, borders, surface opacity and inline roll-button appearance. The native player callout is its sole inline background; the inner plugin frame is explicitly transparent. The popup retains its separate Settings-style frosted surface. Ability tables scroll at narrow widths instead of shrinking their text.

### Automatic player ability layout

Player abilities automatically use three rows of two below 520px of available card width, and two rows of three in wider cards. The narrow order is STR/INT, DEX/WIS, CON/CHA. This applies inline and in the popup. There is no dropdown or saved manual override. Original control nodes retain their roll listeners; the ResizeObserver disconnects when the sheet closes.


## Local spell and rest management (0.5.0)

Spellcasting contains slot-usage counters and concentration. A separate Rests section immediately follows Spellcasting. Slot capacities are read-only. Each imported spell now has a Cast control, with a slot-level/pact/free-use source selector. Class spells can be marked Prepared; cantrips and imported always-prepared/granted spells stay available. The imported description still expands by clicking the spell row. These controls manage imported spells only; adding spells to the imported list still requires D&D Beyond and Refresh. Changes are local, not written back to D&D Beyond.

Slot usage uses the existing dnd-custom-slots key. DDB profiles often supply available/used fields without max; when there is exactly one spellcasting class its imported levelSpellSlots progression supplies capacity. Noncasters (such as this character's Monk) are excluded. Single-caster class progression takes precedence over summary capacities. Unsupported missing multiclass totals remain unavailable rather than accepting manual capacities. Warlock progression supplies Pact slots separately. Local preparation, free-use counts, resources, Hit Dice and concentration persist under dnd-custom-session-ID and survive profile refresh. Casting blocks unprepared spells, unavailable free uses, and exhausted or undersized slots. Casting a concentration spell replaces the tracked concentration; End clears it manually. Concentration saving throws, durations, components, targets, casting-time restrictions and conditions are not automated.

Rests use 2024 recovery (official glossary: https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary). Finish Short Rest recovers Pact slots and short-rest resources, with optional per-class Hit Dice rolls (minimum 1 healing including CON); normal slots remain spent. Finish Long Rest restores tracked HP, clears temporary HP/death-save counters, restores all Hit Dice, normal/Pact slots and short/long-rest resources, and ends tracked concentration. Prepared choices remain unchanged. The controls apply completed-rest benefits, not a clock or eligibility rules engine. Exhaustion, maximum-HP/ability reductions and feature-specific exceptions remain manual. These controls are not a 2014 Hit Dice recovery implementation.

Ki/Focus is seeded from Monk level. There is no manual resource builder. Previously saved custom counters are retained; unknown class feature formulas are not guessed. Imported free spell uses with an explicit maximum are tracked separately and reset only for recognized short/long-rest reset types. Undo last change reverses the latest tracker action, including rest and healing. Inline and popup views update together and release subscriptions when closed.

Validation: regression tests cover slot derivation, preparation, casting/exhaustion, free-use separation, concentration, both rests, Ki/Focus, Hit Dice, undo snapshots and reload persistence. Browser checks with the actual cached character and Transparent theme cover all nine imported spell rows, slot display, local preparation, casts, concentration, rest/undo, HP healing, popup synchronization and narrow-width rendering. Browser fixture actions do not modify the real saved character state.

### Rests and automatic capacities (0.5.1)

Rests is a standalone section after Spellcasting. Spell-slot usage remains within Spellcasting. Manual slot-total editing and Add resource are removed. Obsolete local capacity overrides are ignored, including when restored through Undo; Cleric class progression determines totals after level changes. Ki/Focus maximum follows Monk level without clearing its usage. Tests cover conflicting summaries, stale overrides, level changes, layout order and retained casting/rest functionality.

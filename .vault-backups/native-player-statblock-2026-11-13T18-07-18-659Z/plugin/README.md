# DnD Beyond Importer — Custom

Personal fork of DnD Beyond Importer 1.1.4 by Jktaisa. Custom version: 0.2.2.

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

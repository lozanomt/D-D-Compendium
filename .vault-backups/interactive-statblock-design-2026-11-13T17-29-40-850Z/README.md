# DnD Beyond Importer — Custom

Personal fork of DnD Beyond Importer 1.1.4 by Jktaisa. The current custom version is 0.2.0.

## Using existing character notes

Reload Obsidian once with Ctrl+R. With the original importer disabled, the custom plugin handles both the original dnd-sheet-launcher / dnd-hp-tracker blocks and the new dnd-custom-sheet-launcher / dnd-custom-hp-tracker blocks. No note migration is required.

Open Interactive Character Sheet fetches the complete character on the first opening and saves an offline copy. It includes inventory, spells, modifiers, class features, and traits. Later openings and app restarts reuse that complete copy. The character must be publicly accessible on D&D Beyond for the initial fetch.

The refresh button on an original-importer note refreshes sheet data while preserving the note. The refresh button on a custom-generated note retains the normal re-import behavior, updating that generated note. A command named Custom: Refresh active character sheet data updates data for the active note without changing the note text.

When the original importer is enabled at startup, the custom plugin skips the old widget names to avoid a registration conflict. New custom widgets remain independent. Reload after changing which importer is enabled.

## New imports

Use the Custom: Import D&D Beyond character command. New notes go to Characters/Custom Importer and use dndbeyond_custom_id. The original dndbeyond_id property is not adopted for note replacement, so importing a character does not overwrite its old note.

## Saved data

Complete character snapshots, HP, death saves, spell slots, equipment toggles, session notes, and dice history are saved in data.json under __customRuntime. Changes are saved after a short debounce and on plugin unload. Keep this file when updating your local copy. Use the plugin settings UI for normal settings changes.

## Files to edit

| File | Purpose |
|---|---|
| entry.js | Readable personal behavior, compatibility, caching, and persistence. |
| styles.css | Full compact, theme-aware styles. Search for PERSONAL OVERRIDES. |
| lib/importer.js | Copied importer engine and sheet renderer; compressed internal variable names. customCore exposes the helpers used by entry.js. |
| main.js | Generated, self-contained plugin bundle. |
| build.cjs | Builds main.js using Node built-ins. |
| test-loader.cjs | Runs the loader and functionality regression suite. |
| test-functionality.cjs | Isolated tests with fake data and no network calls. |
| manifest.json | Plugin identity, version, and original author credit. |

CSS edits need no build. After editing entry.js or lib/importer.js, run node build.cjs, then node test-loader.cjs, in this folder. Reload the custom plugin afterward.

Sizing controls: Settings → Style Settings → DnD Beyond - Custom Importer.

## Upstream

Original author: Jktaisa
Author profile: https://github.com/Webcreator3478
Project: https://github.com/Webcreator3478/D-D-Beyond-Character-Importer---Obsidian-Plugin

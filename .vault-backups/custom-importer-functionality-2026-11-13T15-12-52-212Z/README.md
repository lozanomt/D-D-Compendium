# DnD Beyond Importer — Custom

An independent local fork of the installed DnD Beyond Importer 1.1.4 by Jktaisa. Original author and project links remain in manifest.json.

## Enable and use

1. Reload Obsidian with Ctrl+R.
2. Open Settings → Community plugins and enable DnD Beyond Importer — Custom.
3. Use its Custom: Import D&D Beyond character command.
4. New imports go to Characters/Custom Importer. Existing notes from the original importer are not adopted or overwritten.

The original importer can stay enabled: the fork has a separate plugin ID, code-block names, CSS namespace, character metadata key, and Style Settings section. Existing original-importer notes continue using the original plugin.

## Files you can edit

| File | Purpose |
|---|---|
| entry.js | Editable personal entry point; add commands and override behavior here. |
| main.js | Generated, self-contained Obsidian entry file. |
| build.cjs | Rebuilds main.js using Node built-ins; no package installation required. |
| test-loader.cjs | Tests startup, importing, and refresh with relative imports blocked. |
| styles.css | Full styling, including the compact theme-aware layout. |
| lib/importer.js | Copied, namespaced importer implementation; contains sheet rendering and controls. This is the installed bundled JavaScript, so its internal variable names are compressed. |
| manifest.json | Name, version, description, and original author credit. Keep the plugin ID stable. |
| data.json | This copy’s settings; normally change them through Obsidian. |

CSS edits do not need a build. For JavaScript changes, edit entry.js or lib/importer.js, then run node build.cjs followed by node test-loader.cjs from this folder. Disable/re-enable the custom plugin, or reload Obsidian, to load the rebuilt JavaScript. main.js must remain self-contained because Obsidian may not resolve relative requires from a plugin bundle.

## Independent identifiers

- Plugin ID: dndbeyond-importer-custom
- Character ID property: dndbeyond_custom_id
- Sheet code block: dnd-custom-sheet-launcher
- HP code block: dnd-custom-hp-tracker
- CSS and style-variable prefix: dndcustom-
- Style Settings section: DnD Beyond - Custom Importer

The included CSS follows the current Obsidian theme. Adjust sizing in Style Settings or edit styles.css. The original dndbeyond-compact snippet only styles the original importer.

## Upstream

Original author: Jktaisa
Original author profile: https://github.com/Webcreator3478
Upstream project: https://github.com/Webcreator3478/D-D-Beyond-Character-Importer---Obsidian-Plugin

This fork was copied from the local installed version 1.1.4. No upstream source files or license text were included in that installed folder.

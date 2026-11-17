# DnD Beyond — Compact Sheet

The importer’s full character sheet and note widgets now use a compact layout and the active Obsidian theme. Reload Obsidian with Ctrl+R once, then reopen the character sheet.

## Layout

- Core stats and all six abilities appear first.
- HP and saving throws sit side by side on wide screens.
- Skills use three columns on wide screens.
- Controls, cards, and section spacing are smaller; neutral advantage badges and repeated click-to-roll hints are hidden. Advantage and disadvantage indicators remain visible.
- Roll history, currency, and proficiencies stay in a smaller reference sidebar.
- Narrow screens stack sections and use a single scrolling sheet.

## Adjust the sizing

Open Settings → Style Settings → DnD Beyond - Compact Sheet.

| Control | Default |
|---|---:|
| Text size | 13 px |
| Section spacing | 10 px |
| Sheet width | 1100 px maximum |
| Reference sidebar width | 230 px |

Sheet width also fits the available window. Colors and fonts follow the selected theme rather than a separate fixed palette. HP, healing, and damage colors use the theme’s green, yellow, and red.

## Enable or revert

Settings → Appearance → CSS snippets → dndbeyond-compact. Turn this off to restore the importer’s original appearance. The book-style notes use a separate dnd-2024-book snippet.

This customization is stored in `.obsidian/snippets/dndbeyond-compact.css`. Importer code, character data, and tracker state were not edited.

## Verification

Rendered the installed importer’s own sheet code in an isolated browser preview with sample data. Verified damage, healing, ability rolls, saving throws, death saves, spell slots, spell descriptions, and equipment toggles. Layout and theme inheritance checks passed for desktop dark and narrow light previews. The live Obsidian window was not inspected.

# Book layout conversion — 2026-11-13

Replaced Omni Infobox metadata with native Markdown layouts across 1,734 wiki entries, 22 templates, and the theme-testing sample.

## Layouts

- 337 complete creature entries use one native stat-block callout containing the name, type and alignment, combat statistics, compact ability scores / modifiers / saves, defenses, senses, languages, CR, traits, and actions.
- The creature reference entry remains explicitly a source reference; missing statistics were not invented.
- Creature.md uses the same stat-block structure for future entries.
- Spells, classes, subclasses, equipment, feats, species, backgrounds, rules, sources, the character, and the world note use handbook-style typography, headings, ruled tables, and a light paper background.
- Source links, detailed rules, resource checkboxes, and character-sheet widget payloads remain in the notes.

## Configuration

- Removed infobox frontmatter from the converted notes.
- Disabled the Omni Infobox community plugin; its installation and settings are retained.
- Disabled the omni-infobox-layout snippet and enabled dnd-2024-book.
- New style: `.obsidian/snippets/dnd-2024-book.css`.
- Renamed the empty generic templates to `Entry Template.md` at the vault root and `Book Entry.md` in the configured Templates folder.
- Native stat-block callouts stay in document flow; they do not float over note text.

## Using the templates

Reload Obsidian once with Ctrl+R after this change. Open a note in Reading view to see the complete book layout. Live Preview also receives the typography and callout styling. Plain Source mode shows Markdown.

For a new entry, create an empty note and use the command palette’s Templates: Insert template command. The existing template folder is already configured. Use Creature for a stat block, Spell for a spell, or the matching entry template; use Book Entry for a general note. Fill the template placeholders and source links.

The frontmatter cssclasses values apply the formatting: dnd-book plus dnd-mm for creature stat blocks, or dnd-phb for other entries. The native callout marker is [!statblock]. Existing placeholder and attachment files were retained; placeholder images were removed from the stat-block template.

## Verification

- Parsed all 1,757 changed notes as YAML and verified non-infobox properties remained equivalent.
- Checked rules text, wiki links, all six creature ability scores / modifiers / saves, and character-sheet code blocks against the original notes.
- Read back every saved note and configuration file.
- Rendered sample Animated Object, Aboleth, Fireball, and Human notes in a local browser fixture and visually checked their layout. The live Obsidian view has not been inspected.

## Backup

Full original notes, configuration files, and a move manifest:

`.vault-backups/book-layout-2026-11-13T12-42-11-918Z`

# Infobox rollout — 2026-11-13

Added Omni Infobox quick-reference cards to 1734 wiki entries, using the shared Placeholder.png image. Updated 22 reusable templates, including the root Infobox.md and a generic template in the configured Omni template folder.

## Coverage

| Entry group | Entries |
|---|---:|
| Arṣat Qadmāyā | 1 |
| Characters | 1 |
| Backgrounds | 5 |
| Classes | 229 |
| Equipment | 571 |
| Feats | 19 |
| Lore | 3 |
| Rules | 161 |
| Sources | 5 |
| Species | 10 |
| Spells | 391 |
| Stat Blocks | 338 |

## Quick-reference content

- Spells: level, school, classes, casting time, range, components, duration, concentration, saves or attacks where stated, effects, and scaling.
- Creatures: AC, initiative, HP, speed, ability scores and saves, CR, senses, languages, defenses, traits, actions, reactions, and legendary action budgets where recorded.
- Equipment: cost, weight, damage, properties, mastery, armor, attunement, effects, and compact option tables where recorded.
- Classes and subclasses: core traits, proficiencies, subclasses, feature progression, and subclass features by level. Individual feature cards include their recorded effects and class unlock levels when an exact heading match exists.
- Backgrounds, species, feats, rules, lore, source notes, the world note, and the player character also have cards suited to their existing content.

## Preservation and limits

All existing note bodies and non-infobox properties were preserved. Existing creature callouts, original artwork, detailed rules, PDF links, and character-sheet controls remain. The placeholder is used in the new infobox image field.

These cards summarize the content already in each note; this rollout is not a new audit against all source PDFs. 90 notes explicitly identify summary or source-reference coverage. Missing statistics were not invented. The empty world note is marked as awaiting details. Long extracts point readers back to the full entry.

Character statistics and other infobox values are recorded values, not live calculations or a replacement for the character sheet. Update the card when those values change.

Audit reports, help documentation, and automatic tag snippets were excluded from wiki card generation. Content templates were updated separately.

## Validation

- All 1756 changed Markdown files parsed as valid YAML with the expected Omni Infobox schema.
- Every generated card uses the existing shared placeholder image.
- All saved files were read back and matched the prepared content.
- Original metadata and note bodies were compared against the backup; only the original empty Infobox.md template was replaced.
- Checked representative spells, weapons, species, feats, subclasses, player character, and creature cards; all full creature notes expose AC, HP, speed, and CR.
- Checked wiki-link delimiters and corrected one inherited extra closing bracket in the generated Protection from Poison card; its original body was preserved.

## Backup

Original files and a creation manifest are saved at:

`.vault-backups/infobox-update-2026-11-13T01-48-20-540Z`

The manifest identifies the new generic template; other listed files have an original copy in the backup.

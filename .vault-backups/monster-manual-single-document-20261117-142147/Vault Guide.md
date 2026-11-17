# Vault Guide

- [[Compendium/Compendium|Compendium — browse entities]]
- [[Sources/Sources|Sources — browse books and chapters]]

Each entity has one permanent note in the Compendium. Every contributing source has its own labeled card within that note, even when its content matches another source. Book and chapter pages hold rules and explanatory material. Do not generate monster, animal, item, spell, or other entity catalogues there. Individual entity cards provide their own PDF citations.

Items, spells, creatures, rules, lore, and character options are organized by kind. Identical names can represent different entities: Shield the spell and Shield the item remain separate, as do the Druid class and Druid NPC stat block.

Source PDFs and artwork remain with their book. Existing campaign and Homebrew locations are unchanged. Source IDs and entity IDs are included for future maintenance; each book has a source-manifest.json inventory. These inventories do not automate adding or removing content yet.

When adding material manually, search for an existing entity first, add a card for the new source there, and retain its PDF citation. Keep personal annotations outside source-version sections. Do not delete a shared entity merely because a book is removed.

Formatting conventions: [[Audits/Card-Formatting|Card Formatting]]. Use one source footer per card and put each labeled field on its own rendered line.

Import policy: avoid alphabetical catalogues and long navigational lists inside entries. Preserve lists and tables that define actual rules or available choices; keep those concise. Do not create catalogue-only appendix pages.

Edition policy: the Compendium is edition agnostic. Store entities directly under their kind (for example, `Compendium/Creatures/Elk.md`), without an edition folder. Add 5e and 5.5e versions as separate source cards in the same entity note; preserve existing entity IDs. Keep book folders under `Sources/<edition>/<book>`. When editions reuse a book title, distinguish the source-card headings with edition and publication year, and keep source-manifest section names and heading links aligned. Different mechanics alone do not require a second entity note.

Table policy: put every rules table immediately beside the rule that explains it. Prefer native Markdown tables; use a tightly cropped, embedded PDF table when its layout is complex. Never leave flattened table text, filename headings, or a detached table-image gallery. Combine continued rows or place the continuation directly after the first part. Entity-specific tables belong in the relevant entity’s source card, not in a book-folder catalogue.

# Vault Guide

- [[Compendium/Compendium|Compendium — browse entities]]
- [[Sources/Sources|Sources — browse books and chapters]]

Each entity has one permanent note in the Compendium. Every contributing source has its own labeled card within that note, even when its content matches another source. Each source has one folder containing its PDF and a single Markdown document, following the entire book’s structure. Rules, lists, and tables remain in context. Usable entities live in Compendium source cards and are linked from the book. Preserve the book’s indexes as filterable Markdown tables.

Items, spells, creatures, rules, lore, and character options are organized by kind. Identical names can represent different entities: Shield the spell and Shield the item remain separate, as do the Druid class and Druid NPC stat block.

Source PDFs and artwork remain with their book. Existing campaign and Homebrew locations are unchanged. Source IDs and entity IDs are included for future maintenance; each book has a source-manifest.json inventory. These inventories do not automate adding or removing content yet.

When adding material manually, search for an existing entity first, add a card for the new source there, and retain its PDF citation. Keep personal annotations outside source-version sections. Do not delete a shared entity merely because a book is removed.

Formatting conventions: [[Audits/Card-Formatting|Card Formatting]]. Use one source footer per card and put each labeled field on its own rendered line.

Import policy: preserve complete book reference indexes in its single source document. Use sortable, filterable tables for creature type, habitat, group, and CR. Do not duplicate entity descriptions or stat blocks in the book document.

Edition policy: the Compendium is edition agnostic. Store entities directly under their kind (for example, `Compendium/Creatures/Elk.md`), without an edition folder. Add 5e and 5.5e versions as separate source cards in the same entity note; preserve existing entity IDs. Keep book folders under `Sources/<edition>/<book>`. When editions reuse a book title, distinguish the source-card headings with edition and publication year, and keep source-manifest section names and heading links aligned. Different mechanics alone do not require a second entity note.

Table policy: put every rules table immediately beside the rule that explains it. Prefer native Markdown tables; use a tightly cropped, embedded PDF table when its layout is complex. Never leave flattened table text, filename headings, or a detached table-image gallery. Combine continued rows or place the continuation directly after the first part. Entity-specific tables belong in the relevant entity’s source card, not in a book-folder catalogue.

Monster Manual pilot: [[Sources/5.5e/Monster Manual/D&D 5.5E - Monster Manual|Monster Manual]]. Interactive reference tables use the D&D Source Tables plugin. Source-page-backed cards preserve the original PDF when reliable native transcription is not yet available.

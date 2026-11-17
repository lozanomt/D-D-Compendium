---
type: audit
audit_date: 2026-11-12
reference: "Player’s Handbook (2024)"
status: findings-only
tags:
  - audit/classes
---

# Class audit against the 2024 Player’s Handbook

The class collection is largely based on revised fifth-edition rules, but it is not a complete or consistently accurate Player’s Handbook reference. Several standalone or combined feature notes disagree with correct class overviews.

## Scope and method

- Reviewed all **192 Markdown notes** under Classes: twelve core class overviews, their existing subclass and feature notes, Metamagic, Eldritch Invocations, and five shared feature notes.
- Primary reference: [[D&D 5.5E - Player's Handbook.pdf|the local 2024 Player’s Handbook PDF]], confirmed by the September 2024 printing information. Used its class chapter, tables, subclass sections, and class spell lists.
- Compared traits, level progression, feature wording, resource/recovery rules, existing subclasses, and shared definitions. Used text comparison to locate differences, then checked suspected rules issues against the relevant source text; visually confirmed the disputed Druid and Paladin feature levels. OCR artifacts were not counted as vault errors.
- All twelve core classes are present. Each has one subclass rather than the handbook’s four: **12 of 48 subclasses are represented; 36 are absent from the class collection**. This matches the SRD subclass selection, but does not establish the provenance of every note.
- All eight class spell lists have confirmed omissions. The spell table below records **102 class/spell omission examples**, not 102 distinct spells and not an exhaustive spell reconciliation. Spell descriptions, every school/special marker, feats, linked equipment rules, and external-source classes are outside this audit.
- This is an audit of the supplied PDF, not a comparison with later online errata. No original class notes or PDFs were edited.
- The progression tables were reviewed alongside the source; no additional numerical progression discrepancy was confirmed. This is not a character-by-character transcription certification.

All source page links below use **PDF viewer page numbers**, not printed page numbers. The PDF contains front matter and image pages, so use the links rather than assuming a constant offset.

## Results by class

| Class | Existing subclass | Result beyond missing subclasses | Source PDF range |
|---|---|---|---|
| [[Classes/Barbarian/Barbarian|Barbarian]] | Path of the Berserker | Persistent Rage is an empty feature note, and Feral Instinct has the wrong heading. The overview contains the missing Rage rules. | [[D&D 5.5E - Player's Handbook.pdf#page=54|PDF p. 54]]–[[D&D 5.5E - Player's Handbook.pdf#page=60|PDF p. 60]] |
| [[Classes/Bard/Bard|Bard]] | College of Lore | No additional class-specific mechanical discrepancy identified in the reviewed features. Its spell list and subclass choices are incomplete. | [[D&D 5.5E - Player's Handbook.pdf#page=62|PDF p. 62]]–[[D&D 5.5E - Player's Handbook.pdf#page=70|PDF p. 70]] |
| [[Classes/Cleric/Cleric|Cleric]] | Life Domain | Life Domain omits Bless. Blessed Strikes omits the older-subclass compatibility restriction. | [[D&D 5.5E - Player's Handbook.pdf#page=72|PDF p. 72]]–[[D&D 5.5E - Player's Handbook.pdf#page=80|PDF p. 80]] |
| [[Classes/Druid/Druid|Druid]] | Circle of the Land | Wild Shape omits known-form replacement. The separate Elemental Fury note delays the Primal Strike upgrade from 15 to 18. | [[D&D 5.5E - Player's Handbook.pdf#page=82|PDF p. 82]]–[[D&D 5.5E - Player's Handbook.pdf#page=92|PDF p. 92]] |
| [[Classes/Fighter/Fighter|Fighter]] | Champion | No additional class-specific mechanical discrepancy identified in the reviewed features. The shared Weapon Mastery and Extra Attack summaries need class-specific restrictions. | [[D&D 5.5E - Player's Handbook.pdf#page=94|PDF p. 94]]–[[D&D 5.5E - Player's Handbook.pdf#page=102|PDF p. 102]] |
| [[Classes/Monk/Monk|Monk]] | Warrior of the Open Hand | Tool proficiency is absent from Core Monk Traits. Reviewed combat features and Open Hand features otherwise substantially match. | [[D&D 5.5E - Player's Handbook.pdf#page=104|PDF p. 104]]–[[D&D 5.5E - Player's Handbook.pdf#page=110|PDF p. 110]] |
| [[Classes/Paladin/Paladin|Paladin]] | Oath of Devotion | Combined notes assign three features to incorrect levels; Blessed Warrior is absent; Channel Oath is a nonstandard rename. | [[D&D 5.5E - Player's Handbook.pdf#page=112|PDF p. 112]]–[[D&D 5.5E - Player's Handbook.pdf#page=120|PDF p. 120]] |
| [[Classes/Ranger/Ranger|Ranger]] | Hunter | Starting ammunition and the Druidic Warrior option are missing. | [[D&D 5.5E - Player's Handbook.pdf#page=122|PDF p. 122]]–[[D&D 5.5E - Player's Handbook.pdf#page=130|PDF p. 130]] |
| [[Classes/Rogue/Rogue|Rogue]] | Thief | No additional class-specific mechanical discrepancy identified in the reviewed Rogue and Thief features. Shared Weapon Mastery needs correction. | [[D&D 5.5E - Player's Handbook.pdf#page=132|PDF p. 132]]–[[D&D 5.5E - Player's Handbook.pdf#page=140|PDF p. 140]] |
| [[Classes/Sorcerer/Sorcerer|Sorcerer]] | Draconic Sorcery | No additional class-specific mechanical discrepancy identified in the reviewed features. All ten named Metamagic options are present; spell and subclass coverage is incomplete. | [[D&D 5.5E - Player's Handbook.pdf#page=142|PDF p. 142]]–[[D&D 5.5E - Player's Handbook.pdf#page=154|PDF p. 154]] |
| [[Classes/Warlock/Warlock|Warlock]] | Fiend Patron | Pact of the Chain omits Slaad Tadpole. All 28 named invocation options are present; spell and subclass coverage is incomplete. | [[D&D 5.5E - Player's Handbook.pdf#page=156|PDF p. 156]]–[[D&D 5.5E - Player's Handbook.pdf#page=166|PDF p. 166]] |
| [[Classes/Wizard/Wizard|Wizard]] | Evoker | The shared Spellcasting summary contradicts Wizard cantrip replacement. The class note has an unresolved spellcasting link and a progression-label typo. | [[D&D 5.5E - Player's Handbook.pdf#page=168|PDF p. 168]]–[[D&D 5.5E - Player's Handbook.pdf#page=178|PDF p. 178]] |

“No additional discrepancy identified” is not a completeness pass: shared-note errors can still affect the class, and absent options remain coverage gaps.

## Specific findings

### SH-01 — Rules error

**Affected notes:** [[Classes/Any Class Features/Spellcasting|Any Class Features/Spellcasting]].

**Finding:** The shared note says every listed class can replace a cantrip when gaining a class level, with a Long Rest exception only for Artificer.

**Expected / recommended:** Wizard can replace one cantrip after a Long Rest. The Wizard overview already states this correctly; revise the shared summary to preserve this distinction.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=168|PDF p. 168]].

### SH-02 — Rules error

**Affected notes:** [[Classes/Any Class Features/Weapon Mastery|Any Class Features/Weapon Mastery]].

**Finding:** The shared definition carries the Barbarian’s Melee-only weapon restriction and one-choice replacement rule over to other classes.

**Expected / recommended:** Keep the Barbarian restriction separate. Fighter can choose Simple or Martial weapons, including ranged weapons, and change its weapon choices after a Long Rest. Paladin and Ranger use weapons they are proficient with; Rogue uses its stated Simple/Finesse/Light restrictions. Their class-specific paragraphs are more accurate than the shared note.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=55|PDF p. 55]], [[D&D 5.5E - Player's Handbook.pdf#page=94|PDF p. 94]], [[D&D 5.5E - Player's Handbook.pdf#page=113|PDF p. 113]], [[D&D 5.5E - Player's Handbook.pdf#page=123|PDF p. 123]], [[D&D 5.5E - Player's Handbook.pdf#page=132|PDF p. 132]].

### SH-03 — Missing restriction

**Affected notes:** [[Classes/Any Class Features/Extra Attack|Any Class Features/Extra Attack]].

**Finding:** The generic three-attack summary does not say that the Warlock invocation applies to the pact weapon only.

**Expected / recommended:** Distinguish Fighter’s attacks from Thirsting Blade/Devouring Blade. Devouring Blade requires Warlock level 12 and Thirsting Blade, and improves that invocation’s pact-weapon attacks; it is not a general three-attack benefit for all weapons.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=158|PDF p. 158]], [[D&D 5.5E - Player's Handbook.pdf#page=160|PDF p. 160]].

### SH-04 — Source scope

**Affected notes:** [[Classes/Any Class Features/Spellcasting|Any Class Features/Spellcasting]].

**Finding:** The shared note includes Artificer rules without distinguishing their source.

**Expected / recommended:** Label Artificer material as coming from another source. Artificer is not one of the twelve classes in this Player’s Handbook, so its rules cannot be certified against this PDF.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=52|PDF p. 52]].

### BA-01 — Incomplete note

**Affected notes:** [[Classes/Barbarian/Persistent Rage|Barbarian/Persistent Rage]].

**Finding:** The note contains only its heading.

**Expected / recommended:** Populate it or embed/link the complete level-15 section in the Barbarian overview. Include the once-per-Long-Rest initiative recovery and the revised Rage duration/ending rules.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=56|PDF p. 56]].

### BA-02 — Heading error

**Affected notes:** [[Classes/Barbarian/Feral Instinct|Barbarian/Feral Instinct]].

**Finding:** The heading says Fast Movement although the body describes Feral Instinct.

**Expected / recommended:** Rename the heading to Feral Instinct; the initiative benefit itself matches the handbook.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=56|PDF p. 56]].

### CL-01 — Missing granted spell

**Affected notes:** [[Classes/Cleric/Life Domain/Life Domain|Cleric/Life Domain/Life Domain]].

**Finding:** The level-3 Life Domain spell row omits Bless.

**Expected / recommended:** The row should include Aid, Bless, Cure Wounds, and Lesser Restoration.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=76|PDF p. 76]].

### CL-02 — Missing compatibility rule

**Affected notes:** [[Classes/Cleric/Blessed Strikes|Cleric/Blessed Strikes]]; [[Classes/Cleric/Cleric|Cleric/Cleric]].

**Finding:** The Blessed Strikes description omits the older-subclass compatibility restriction.

**Expected / recommended:** State that if an older Cleric subclass grants either option, only the option selected for this feature is used. This prevents treating both options as cumulative.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=74|PDF p. 74]].

### DR-01 — Missing rule

**Affected notes:** [[Classes/Druid/Wild Shape|Druid/Wild Shape]]; [[Classes/Druid/Druid|Druid/Druid]].

**Finding:** Known Forms omits the rule for replacing a form.

**Expected / recommended:** After each Long Rest, one known form may be replaced with another eligible form.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=83|PDF p. 83]].

### DR-02 — Wrong feature level

**Affected notes:** [[Classes/Druid/Elemental Fury|Druid/Elemental Fury]].

**Finding:** The standalone note upgrades Primal Strike to 2d8 at Druid level 18.

**Expected / recommended:** The upgrade occurs at Druid level 15 through Improved Elemental Fury. The Druid overview and progression table already use level 15.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=84|PDF p. 84]].

### MO-01 — Missing proficiency

**Affected notes:** [[Classes/Monk/Monk|Monk/Monk]].

**Finding:** Core Monk Traits has no Tool Proficiencies row, although starting equipment refers to that choice.

**Expected / recommended:** Add proficiency with one type of Artisan’s Tools or one Musical Instrument of the player’s choice.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=104|PDF p. 104]].

### PA-01 — Wrong feature level

**Affected notes:** [[Classes/Paladin/Aura of Protection|Paladin/Aura of Protection]].

**Finding:** The combined aura note gives Aura of Courage at Paladin level 11.

**Expected / recommended:** Aura of Courage is gained at level 10. The Paladin overview and table already show level 10.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=114|PDF p. 114]].

### PA-02 — Wrong feature level

**Affected notes:** [[Classes/Paladin/Lay on Hands|Paladin/Lay on Hands]].

**Finding:** The standalone note gives Restoring Touch at Paladin level 11.

**Expected / recommended:** Restoring Touch is gained at level 14. The Paladin overview and table already show level 14.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=114|PDF p. 114]].

### PA-03 — Wrong feature level and trigger

**Affected notes:** [[Classes/Paladin/Aura of Protection|Paladin/Aura of Protection]].

**Finding:** The combined aura note gives Devotion’s Smite of Protection at level 11 and describes it through Paladin’s Smite.

**Expected / recommended:** This is an Oath of Devotion level-15 feature and triggers whenever Divine Smite is cast. The dedicated subclass note already states the correct rule.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=117|PDF p. 117]].

### PA-04 — Missing class option

**Affected notes:** [[Classes/Paladin/Paladin|Paladin/Paladin]].

**Finding:** The level-2 Fighting Style paragraph omits the Blessed Warrior alternative.

**Expected / recommended:** Include the alternative of learning two Cleric cantrips as Paladin spells using Charisma, with one replaceable when gaining a Paladin level.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=113|PDF p. 113]].

### PA-05 — Nonstandard terminology

**Affected notes:** [[Classes/Paladin/Channel Oath|Paladin/Channel Oath]]; [[Classes/Paladin/Paladin|Paladin/Paladin]]; [[Classes/Paladin/Abjure Foes|Paladin/Abjure Foes]]; [[Classes/Paladin/Oath of Devotion/Sacred Weapon|Paladin/Oath of Devotion/Sacred Weapon]]; [[Classes/Paladin/Oath of Devotion/Oath of Devotion|Paladin/Oath of Devotion/Oath of Devotion]].

**Finding:** Paladin’s Channel Divinity is renamed Channel Oath in several places, with mixed terminology inside the note.

**Expected / recommended:** Use the handbook name Channel Divinity with class-qualified links, or explicitly label Channel Oath as a vault alias/house naming choice. Do not treat the rename alone as a mechanical change.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=113|PDF p. 113]], [[D&D 5.5E - Player's Handbook.pdf#page=114|PDF p. 114]], [[D&D 5.5E - Player's Handbook.pdf#page=116|PDF p. 116]].

### PA-06 — Heading error

**Affected notes:** [[Classes/Paladin/Paladin's Smite|Paladin/Paladin's Smite]].

**Finding:** The note’s heading is Divine Smite, which is also the spell’s name, although the file represents a class feature.

**Expected / recommended:** Use Paladin’s Smite as the feature heading and retain its link to the Divine Smite spell.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=113|PDF p. 113]].

### RA-01 — Missing equipment

**Affected notes:** [[Classes/Ranger/Ranger|Ranger/Ranger]].

**Finding:** Starting equipment option A omits the ammunition for the Longbow.

**Expected / recommended:** Add 20 Arrows to option A.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=122|PDF p. 122]].

### RA-02 — Missing class option

**Affected notes:** [[Classes/Ranger/Ranger|Ranger/Ranger]].

**Finding:** The level-2 Fighting Style paragraph omits the Druidic Warrior alternative.

**Expected / recommended:** Include the alternative of learning two Druid cantrips as Ranger spells using Wisdom, with one replaceable when gaining a Ranger level.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=123|PDF p. 123]].

### WA-01 — Missing familiar option

**Affected notes:** [[Classes/Warlock/Eldritch Invocations/Pact of the Chain|Warlock/Eldritch Invocations/Pact of the Chain]].

**Finding:** The special familiar list omits Slaad Tadpole.

**Expected / recommended:** Add Slaad Tadpole to the special forms. A missing stat-block note is a separate content task.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=160|PDF p. 160]].

### WI-01 — Unresolved link

**Affected notes:** [[Classes/Wizard/Wizard|Wizard/Wizard]].

**Finding:** The Spellcasting introduction links to 07) Spells, for which no note was found.

**Expected / recommended:** Point the link to the existing Spells reference note or the handbook’s spellcasting section.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=168|PDF p. 168]].

### WI-02 — Typographic error

**Affected notes:** [[Classes/Wizard/Wizard|Wizard/Wizard]].

**Finding:** The level-16 progression row says Ability Score Improvemen.

**Expected / recommended:** Complete the feature name to Ability Score Improvement.

**Handbook:** [[D&D 5.5E - Player's Handbook.pdf#page=169|PDF p. 169]].

## Missing subclasses

These are missing subclass entries, not missing monster/NPC stat blocks with similar names. For example, an Assassin stat-block note does not supply the Rogue subclass.

| Class | Existing subclass | Missing handbook subclasses |
|---|---|---|
| Barbarian | Path of the Berserker | Path of the Wild Heart; Path of the World Tree; Path of the Zealot |
| Bard | College of Lore | College of Dance; College of Glamour; College of Valor |
| Cleric | Life Domain | Light Domain; Trickery Domain; War Domain |
| Druid | Circle of the Land | Circle of the Moon; Circle of the Sea; Circle of the Stars |
| Fighter | Champion | Battle Master; Eldritch Knight; Psi Warrior |
| Monk | Warrior of the Open Hand | Warrior of Mercy; Warrior of Shadow; Warrior of the Elements |
| Paladin | Oath of Devotion | Oath of Glory; Oath of the Ancients; Oath of Vengeance |
| Ranger | Hunter | Beast Master; Fey Wanderer; Gloom Stalker |
| Rogue | Thief | Arcane Trickster; Assassin; Soulknife |
| Sorcerer | Draconic Sorcery | Aberrant Sorcery; Clockwork Sorcery; Wild Magic Sorcery |
| Warlock | Fiend Patron | Archfey Patron; Celestial Patron; Great Old One Patron |
| Wizard | Evoker | Abjurer; Diviner; Illusionist |

The twelve class overviews list only the existing subclass. If those are deliberate allowed-option lists for a particular campaign, label them as such; a shared handbook reference should distinguish availability in the book from availability at a particular table.

## Confirmed spell-list omissions

These spells are absent from the **spell-list section of the class overview**, even when another feature or a separate vault spell note mentions them. For example, Divine Smite appears as a Paladin feature link but is missing from that class’s spell-list table. The following are confirmed examples, not a declaration that every other row is correct.

| Class | Absent spell-list entries | Handbook spell-list pages |
|---|---|---|
| Bard | Blade Ward; Friends; Thunderclap; Cloud of Daggers; Crown of Madness; Feign Death; Fount of Moonlight; Synaptic Static; Yolande’s Regal Presence; Power Word Fortify | [[D&D 5.5E - Player's Handbook.pdf#page=65|PDF p. 65]]–[[D&D 5.5E - Player's Handbook.pdf#page=66|PDF p. 66]] |
| Cleric | Toll the Dead; Word of Radiance; Aura of Vitality; Feign Death; Aura of Purity; Circle of Power; Summon Celestial; Power Word Fortify | [[D&D 5.5E - Player's Handbook.pdf#page=74|PDF p. 74]]–[[D&D 5.5E - Player's Handbook.pdf#page=76|PDF p. 76]] |
| Druid | Thorn Whip; Thunderclap; Beast Sense; Aura of Vitality; Elemental Weapon; Feign Death; Summon Fey; Fount of Moonlight; Grasping Vine; Summon Elemental | [[D&D 5.5E - Player's Handbook.pdf#page=85|PDF p. 85]]–[[D&D 5.5E - Player's Handbook.pdf#page=87|PDF p. 87]] |
| Paladin | Compelled Duel; Divine Smite; Thunderous Smite; Wrathful Smite; Aura of Vitality; Blinding Smite; Crusader’s Mantle; Elemental Weapon; Aura of Purity; Staggering Smite; Banishing Smite; Circle of Power; Destructive Wave; Summon Celestial | [[D&D 5.5E - Player's Handbook.pdf#page=115|PDF p. 115]] |
| Ranger | Hail of Thorns; Beast Sense; Cordon of Arrows; Conjure Barrage; Elemental Weapon; Lightning Arrow; Summon Fey; Conjure Volley; Steel Wind Strike | [[D&D 5.5E - Player's Handbook.pdf#page=124|PDF p. 124]]–[[D&D 5.5E - Player's Handbook.pdf#page=125|PDF p. 125]] |
| Sorcerer | Blade Ward; Friends; Mind Sliver; Thunderclap; Witch Bolt; Arcane Vigor; Cloud of Daggers; Crown of Madness; Synaptic Static; Arcane Gate | [[D&D 5.5E - Player's Handbook.pdf#page=146|PDF p. 146]]–[[D&D 5.5E - Player's Handbook.pdf#page=148|PDF p. 148]] |
| Warlock | Blade Ward; Friends; Mind Sliver; Thunderclap; Toll the Dead; Armor of Agathys; Arms of Hadar; Witch Bolt; Cloud of Daggers; Crown of Madness; Hunger of Hadar; Summon Fey; Summon Undead; Summon Aberration; Jallarzi’s Storm of Radiance; Synaptic Static; Arcane Gate; Summon Fiend; Tasha’s Bubbling Cauldron | [[D&D 5.5E - Player's Handbook.pdf#page=160|PDF p. 160]]–[[D&D 5.5E - Player's Handbook.pdf#page=162|PDF p. 162]] |
| Wizard | Blade Ward; Friends; Mind Sliver; Thunderclap; Toll the Dead; Witch Bolt; Arcane Vigor; Cloud of Daggers; Crown of Madness; Feign Death; Summon Fey; Summon Undead; Summon Aberration; Summon Construct; Circle of Power; Jallarzi’s Storm of Radiance; Steel Wind Strike; Synaptic Static; Yolande’s Regal Presence; Arcane Gate; Summon Fiend; Tasha’s Bubbling Cauldron | [[D&D 5.5E - Player's Handbook.pdf#page=171|PDF p. 171]]–[[D&D 5.5E - Player's Handbook.pdf#page=174|PDF p. 174]] |

### Names that should not be counted as missing spells automatically

Several vault names use SRD-style equivalents. A naming difference alone is not a missing spell. Preserve or add aliases to make the handbook and vault names searchable together. These examples were excluded from the omission findings:

| Handbook name | Existing vault equivalent |
|---|---|
| Bigby’s Hand | Arcane Hand |
| Tasha’s Hideous Laughter | Hideous Laughter |
| Leomund’s Tiny Hut | Tiny Hut |
| Mordenkainen’s Sword | Arcane Sword |
| Tenser’s Floating Disk | Floating Disk |
| Melf’s Acid Arrow | Acid Arrow |
| Evard’s Black Tentacles | Black Tentacles |
| Otiluke’s Resilient Sphere | Resilient Sphere |
| Otiluke’s Freezing Sphere | Freezing Sphere |

Aliases resolve names; checking each spell’s actual mechanics would require a separate spell-description audit.

## Recommended repair order

1. Correct the three Paladin feature levels, Druid’s Primal Strike upgrade, and Life Domain’s missing Bless.
2. Correct the shared Spellcasting, Weapon Mastery, and Extra Attack summaries. Shared notes are linked by multiple classes, so errors there spread across otherwise accurate entries.
3. Restore Wild Shape form replacement, Monk’s tool proficiency, Ranger’s ammunition, and the Blessed Warrior/Druidic Warrior choices. Complete Persistent Rage and Pact of the Chain’s familiar list.
4. Resolve Channel Oath terminology, the broken Wizard link, and incorrect headings.
5. Expand the subclass collection and reconcile complete class spell lists if the goal is full Player’s Handbook coverage. Keep campaign restrictions in campaign notes.
6. Reduce duplicated rule text: use one authoritative class section and embed it into feature notes, or embed feature notes into class overviews. This would prevent correct overviews and incorrect combined summaries from drifting apart again.

## Audit inventory

[[Class-Audit-Inventory-2024|Inventory of all 192 reviewed class notes]]. Original content remains unchanged.

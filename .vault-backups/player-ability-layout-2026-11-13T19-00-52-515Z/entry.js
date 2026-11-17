"use strict";

// Editable source. Run node build.cjs after JavaScript changes.
const { Notice, requestUrl, parseYaml, MarkdownRenderChild } = require("obsidian");
const CoreModule = require("./lib/importer.js");
const ImporterCore = CoreModule.default || CoreModule;
const CharacterAPI = CoreModule.customCore;
const RUNTIME_KEY = "__customRuntime";

function formatPlayerNote(text) {
  const frontmatter = text.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)?.[0] || '';
  const body = text.slice(frontmatter.length);
  if (/^> > \[!player-reference\]/m.test(body)) return text;
  const block = body.match(/^> \[!player-character\][^\n]*\r?\n(?:>[^\n]*\r?\n)*?> \x60{3}[ \t]*(?=\r?\n|$)/m);
  if (!block) return text;
  const reference = (body.slice(0, block.index) + '\n' + body.slice(block.index + block[0].length)).trim();
  let result = block[0].trimEnd();
  if (reference) {
    result += '\n>\n> > [!player-reference]- Imported character reference\n';
    result += reference.split(/\r?\n/).map(line => '> > ' + line).join('\n');
  }
  return frontmatter + '\n' + result + '\n';
}

class CustomDnDBeyondImporter extends ImporterCore {
  constructor(...args) {
    super(...args);
    this.fullCharacterIds = new Set();
    this.widgetProcessors = new Map();
    this.pendingFetches = new Map();
    this.saveTimer = null;
    this.saveQueue = Promise.resolve();
  }

  async loadSettings() {
    await super.loadSettings();
    const runtime = this.pluginSettings[RUNTIME_KEY];
    delete this.pluginSettings[RUNTIME_KEY];
    if (!runtime || runtime.version !== 1) return;

    for (const [id, saved] of Object.entries(runtime.characters || {})) {
      const character = saved?.char;
      if (!character || String(character.id) !== id) continue;
      try {
        this.cacheFullCharacter(character);
      } catch (error) {
        console.warn("Custom importer: ignored an invalid saved character", error);
      }
    }
    for (const [key, value] of Object.entries(runtime.state || {})) {
      if (typeof value === "string" && key.startsWith("dnd-custom-")) {
        this.pluginState.set(key, value);
      }
    }
    if (Array.isArray(runtime.rollHistory)) {
      this.rollHistory = runtime.rollHistory.slice(0, 50);
    }
  }

  async saveSettings() {
    const characters = {};
    for (const id of this.fullCharacterIds) {
      const entry = this.charCache.get(id);
      if (entry?.char) characters[id] = { char: entry.char };
    }
    const data = {
      ...this.pluginSettings,
      [RUNTIME_KEY]: {
        version: 1,
        characters,
        state: Object.fromEntries(this.pluginState),
        rollHistory: this.rollHistory.slice(0, 50),
      },
    };
    this.saveQueue = this.saveQueue.catch(() => {}).then(() => this.saveData(data));
    return this.saveQueue;
  }

  queueSave() {
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.saveSettings().catch(error => console.error("Custom importer: save failed", error));
    }, 300);
  }

  async onload() {
    await super.onload();

    this.registerMarkdownCodeBlockProcessor("dnd-player-character", (source, el, context) =>
      this.renderPlayerStatblock(source, el, context)
    );

    const originalActive = Boolean(
      this.app.plugins?.enabledPlugins?.has("dndbeyond-importer") ||
      this.app.plugins?.plugins?.["dndbeyond-importer"]
    );
    if (!originalActive) {
      const hpProcessor = this.widgetProcessors.get("dnd-custom-hp-tracker");
      super.registerMarkdownCodeBlockProcessor("dnd-hp-tracker", hpProcessor);
      super.registerMarkdownCodeBlockProcessor("dnd-sheet-launcher", (source, el, context) => {
        this.renderSheetLauncher(source, el, context, true);
      });
    }

    const originalSet = this.pluginState.set.bind(this.pluginState);
    this.pluginState.set = (key, value) => {
      const result = originalSet(key, value);
      this.queueSave();
      return result;
    };
    const wrapHistory = value => {
      const history = Array.isArray(value) ? value : [];
      Object.defineProperty(history, "unshift", {
        configurable: true,
        value: (...items) => {
          const result = Array.prototype.unshift.apply(history, items);
          if (history.length > 50) history.length = 50;
          this.queueSave();
          return result;
        },
      });
      return history;
    };
    let history = wrapHistory(this.rollHistory);
    Object.defineProperty(this, "rollHistory", {
      configurable: true,
      get: () => history,
      set: value => { history = wrapHistory(value); this.queueSave(); },
    });

    this.addCommand({
      id: "refresh-active-character-data",
      name: "Custom: Refresh active character sheet data",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        const fm = file && this.app.metadataCache.getFileCache(file)?.frontmatter;
        const id = fm?.dndbeyond_custom_id ?? fm?.dndbeyond_id ??
          (file && this.characterIdFromText(await this.readCharacterNote(file)));
        if (!id) return void new Notice("Open a D&D Beyond character note first.");
        try {
          await this.fetchCharacter(String(id), true);
          new Notice("Character sheet data refreshed. Your note was preserved.");
        } catch (error) {
          new Notice(error.message || "Character data could not be refreshed.");
        }
      },
    });
  }

  registerMarkdownCodeBlockProcessor(language, processor, ...rest) {
    let renderer = processor;
    if (language === "dnd-custom-sheet-launcher") {
      renderer = (source, el, context) => this.renderSheetLauncher(source, el, context, false);
    }
    this.widgetProcessors.set(language, renderer);
    return super.registerMarkdownCodeBlockProcessor(language, renderer, ...rest);
  }

  characterIdFromText(text, customOnly = false) {
    const ids = new Set();
    const blocks = /^[ \t]*\x60{3}(dnd-(?:(?:custom-)?(?:sheet-launcher|hp-tracker)|player-character))[ \t]*\r?\n([\s\S]*?)^[ \t]*\x60{3}[ \t]*$/gm;
    const unquoted = text.replace(/^(?:[ \t]*>[ \t]?)+/gm, "");
    for (const match of unquoted.matchAll(blocks)) {
      if (customOnly) {
        const ownedPlayerBlock = match[1] === "dnd-player-character" && /^\s*refreshMode\s*:\s*note\s*$/m.test(match[2]);
        if (!ownedPlayerBlock && !match[1].startsWith("dnd-custom-")) continue;
      }
      const id = match[2].match(/^\s*charId\s*:\s*(\d+)\s*$/m)?.[1];
      if (id && id !== "0") ids.add(id);
    }
    // A note with widgets for multiple characters is a dashboard, not an import target.
    return ids.size === 1 ? [...ids][0] : null;
  }

  async readCharacterNote(file) {
    const read = this.app.vault.cachedRead || this.app.vault.read;
    return read.call(this.app.vault, file);
  }

  async findImportedNote(id) {
    const files = this.app.vault.getMarkdownFiles();
    // Compatibility with older custom notes that still have an ID property.
    const older = files.find(file => {
      const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
      return fm?.dndbeyond_custom_id != null && String(fm.dndbeyond_custom_id) === id;
    });
    if (older) return older;

    for (const file of files) {
      const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
      let tags = fm?.tags;
      let text;
      if (tags === undefined) {
        text = await this.readCharacterNote(file);
        const yaml = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
        try { tags = yaml ? parseYaml(yaml)?.tags : []; } catch { tags = []; }
      }
      const list = Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(/[ ,]+/) : [];
      const characterNote = list.some(tag => ["player-character", "dnd-character"].includes(String(tag).replace(/^#/, "")));
      if (!characterNote) continue;
      // Original widget names remain read-only compatibility views.
      text ??= await this.readCharacterNote(file);
      if (this.characterIdFromText(text, true) === id) return file;
    }
    return null;
  }

  formatImportedNote(text) {
    return formatPlayerNote(text);
  }

  cacheFullCharacter(character) {
    const id = String(character.id);
    const stats = CharacterAPI.stats(character);
    const pb = CharacterAPI.proficiency(CharacterAPI.totalLevel(character.classes || []));
    const entry = { char: character, stats, pb };
    this.charCache.set(id, entry);
    this.fullCharacterIds.add(id);
    return entry;
  }

  async fetchCharacter(id, force = false) {
    if (!force && this.fullCharacterIds.has(id)) return this.charCache.get(id);
    if (this.pendingFetches.has(id)) return this.pendingFetches.get(id);
    const pending = (async () => {
      const response = await requestUrl({
        url: "https://character-service.dndbeyond.com/character/v5/character/" + encodeURIComponent(id),
        headers: { Accept: "application/json" },
      });
      const character = response.json?.data;
      if (!character || String(character.id) !== id) throw new Error("Unexpected character response.");
      const entry = this.cacheFullCharacter(character);
      await this.saveSettings();
      return entry;
    })();
    this.pendingFetches.set(id, pending);
    try {
      return await pending;
    } finally {
      this.pendingFetches.delete(id);
    }
  }


  makeCharacterSheet(data) {
    const sheet = new CharacterAPI.FullCharacterSheet(this.app, this, data.char, data.stats, data.pb);
    const open = sheet.onOpen.bind(sheet);
    sheet.onOpen = () => { open(); this.formatPlayerSheet(sheet.contentEl, data); };
    return sheet;
  }

  formatPlayerSheet(content, data) {
    // Move the original controls, retaining their listeners and state closures.
    if (!content.querySelectorAll) return;
    const root = content.querySelector('.dndcustom-cs-root');
    if (!root || root.classList.contains('dndcustom-mm-view')) return;
    root.classList.add('dndcustom-mm-view', 'dnd-book');
    const all = (s, el = root) => [...el.querySelectorAll(s)];
    const one = (s, el = root) => el.querySelector(s);
    const sections = new Map(all('.dndcustom-cs-section').map(s => [one('.dndcustom-cs-section-hdr', s)?.textContent.trim(), s]));
    const flow = document.createElement('div'); flow.className = 'dndcustom-mm-flow';
    const add = el => { if (el) flow.append(el); return el; };
    const rename = (el, title) => { const h = el && one('.dndcustom-cs-section-hdr', el); if(h) h.textContent = title; return el; };
    const fold = (el, title) => {
      if (!el) return;
      const details = document.createElement('details'); details.className = 'dndcustom-mm-details';
      const summary = document.createElement('summary'); summary.textContent = title; details.append(summary);
      one('.dndcustom-cs-section-hdr', el)?.remove(); details.append(el); add(details); return details;
    };
    const header = one('.dndcustom-cs-header');
    const tools = document.createElement('div'); tools.className = 'dndcustom-mm-tools';
    const close = one('.dndcustom-cs-close-btn'); if(close) tools.append(close);
    const avatar = one('.dndcustom-cs-avatar'); if(avatar) avatar.remove();
    const subtitle=header && one('.dndcustom-cs-char-sub',header);
    if(subtitle && data.char.alignmentId) subtitle.append(' • '+CharacterAPI.alignment(data.char.alignmentId));
    add(header);
    if (avatar) { const portrait = document.createElement('div'); portrait.className='dndcustom-mm-portrait'; portrait.append(avatar); add(portrait); }
    else {
      const file = this.app.vault.getAbstractFileByPath?.('D&D 5e 2024 Rules/z. Load Bearing Folders/Attachments/Placeholder.png');
      if(file) { const portrait=document.createElement('div'); portrait.className='dndcustom-mm-portrait image-embed'; portrait.setAttribute('src',file.path); const img=document.createElement('img'); img.src=this.app.vault.getResourcePath(file); img.alt='Character portrait placeholder'; portrait.append(img); add(portrait); }
    }
    const core = sections.get('Core Stats'), row = core && one('.dndcustom-cs-core-row',core);
    if(row) {
      const pills=new Map(all('.dndcustom-cs-pill',row).map(p=>[one('.dndcustom-cs-pill-label',p)?.textContent.trim(),p]));
      // HP must remain inside the original row for the engine's update callback.
      const hp=pills.get('HP'); hp?.classList.add('dndcustom-cs-pill--hp');
      const line=(keys)=> {const l=document.createElement('div');l.className='dndcustom-mm-meta-line'; keys.forEach(k=>{const p=pills.get(k);if(p)l.append(p);});row.append(l);};
      line(['AC','Initiative']);line(['HP']);line(['Speed']);line(['Prof. Bonus']);
      one('.dndcustom-cs-section-hdr',core)?.remove(); add(core);
    }
    const abilities=all('.dndcustom-cs-abil-card'), saves=all('.dndcustom-cs-save-row');
    if(abilities.length===6 && saves.length===6) {
      const table=document.createElement('table');table.className='dndcustom-mm-abilities';table.setAttribute('aria-label','Ability scores, check modifiers, and saving throws');
      const head=table.createTHead().insertRow(); for(let group=0;group<3;group++) for(const label of ['','','MOD','SAVE']) {const th=document.createElement('th');th.textContent=label;head.append(th);}
      const body=table.createTBody();
      for(const indices of [[0,1,2],[3,4,5]]) {const tr=body.insertRow();for(const i of indices){const card=abilities[i];
        tr.insertCell().textContent=one('.dndcustom-cs-abil-lbl',card)?.textContent;
        tr.insertCell().textContent=one('.dndcustom-cs-abil-score',card)?.textContent;
        const mod=document.createElement('button');mod.className='dndcustom-mm-roll';mod.textContent=one('.dndcustom-cs-abil-mod',card)?.textContent;mod.title=one('.dndcustom-cs-abil-lbl',card)?.textContent+' ability check';mod.addEventListener('click',()=>card.click());tr.insertCell().append(mod);
        const cell=tr.insertCell(), button=one('.dndcustom-cs-roll-btn',saves[i]);if(button){button.title=saves[i].textContent.trim()+' saving throw';cell.append(button);}
      }} const scroll = document.createElement('div'); scroll.className = 'dndcustom-mm-table-scroll'; scroll.append(table); add(scroll);
    }
    const skills=sections.get('Skills');
    if(skills) {const trained=all('.dndcustom-cs-skill-row',skills).filter(r=>one('.dndcustom-cs-dot--prof, .dndcustom-cs-dot--expert',r));
      if(trained.length){const line=document.createElement('div');line.className='dndcustom-mm-skill-summary';const label=document.createElement('strong');label.textContent='Skills ';line.append(label);trained.forEach((r,i)=>{if(i)line.append(', ');const b=document.createElement('button');b.className='dndcustom-mm-roll';b.textContent=(one('.dndcustom-cs-skill-lbl',r)?.textContent||'')+' '+(one('.dndcustom-cs-roll-btn',r)?.textContent||'');b.addEventListener('click',()=>one('.dndcustom-cs-roll-btn',r)?.click());line.append(b);});add(line);}
    }
    const languages = [...new Set(CharacterAPI.modifiers(data.char).filter(m=>m.type==='language').map(m=>m.friendlySubtypeName || m.friendlyTypeName || m.subType).filter(Boolean))];
    if(languages.length){const line=document.createElement('div');line.className='dndcustom-mm-language-summary';const label=document.createElement('strong');label.textContent='Languages ';line.append(label,languages.join(', '));add(line);}
    fold(sections.get('Proficiencies & Languages'),'Proficiencies');
    fold(sections.get('HP Tracker'),'HP & Death Saves');
    fold(skills,'All Skills');
    add(rename(sections.get('Features & Traits'),'Traits'));
    // Only expand descriptions already included in the character; no extra lookups.
    const defs=[...(data.char.race?.racialTraits||[]),...(data.char.feats||[])].filter(x=>x.definition?.name);
    all('.dndcustom-cs-feat-card', flow).forEach((card,i)=>{if(defs[i]?.definition?.description)one('.dndcustom-cs-feat-hdr',card)?.click();});
    add(rename(sections.get('Actions & Attacks'),'Actions'));
    const spells=sections.get('Spells'),slots=sections.get('Spell Slots');
    if(spells){rename(spells,'Spellcasting');if(slots){one('.dndcustom-cs-section-hdr',slots)?.remove();spells.insertBefore(slots,spells.children[1]||null);}add(spells);}else add(rename(slots,'Spellcasting'));
    add(sections.get('Equipment'));add(sections.get('Currency'));
    fold(sections.get('Class Features'),'Class Features');
    fold(sections.get('Session Notes'),'Session Notes');fold(sections.get('Roll Log'),'Roll Log');
    // Keep future upstream sections visible until explicitly styled.
    const consumed=new Set(['Core Stats','Ability Scores','Saving Throws','Skills','HP Tracker','Features & Traits','Actions & Attacks','Spells','Spell Slots','Equipment','Currency','Class Features','Session Notes','Roll Log','Proficiencies & Languages']);
    for(const [name,section] of sections)if(!consumed.has(name))add(section);
    all('.dndcustom-cs-5e-badge').forEach(el=>tools.append(el));add(tools);
    root.replaceChildren(flow);
  }

  async renderPlayerStatblock(source, el, context = {}) {
    const id = source.match(/^\s*charId\s*:\s*(\d+)\s*$/m)?.[1];
    const rewriteNote = /^\s*refreshMode\s*:\s*note\s*$/m.test(source);
    const frame = el.createDiv({ cls: "dndcustom-player-statblock dnd-book" });
    frame.setAttr("role", "group");
    frame.setAttr("aria-label", "Interactive player character stat block");
    let disposed = false;
    let sheet = null;
    const releaseSheet = () => {
      if (!sheet) return;
      sheet.onClose?.();
      sheet.containerEl?.remove();
      sheet.modalEl?.remove();
      sheet = null;
    };
    if (context.addChild && MarkdownRenderChild) {
      const child = new MarkdownRenderChild(el);
      child.onunload = () => { disposed = true; releaseSheet(); };
      context.addChild(child);
    }
    if (!id || id === "0") {
      frame.createEl("p", { text: "Set charId to your D&D Beyond character ID to load the player tracker." });
      return;
    }

    const render = async (force = false) => {
      if (disposed) return;
      releaseSheet();
      frame.empty();
      frame.createEl("p", { text: "Loading player tracker…", attr: { role: "status" } });
      try {
        const data = await this.fetchCharacter(id, force);
        if (disposed) return;
        frame.empty();
        const content = frame.createDiv({ cls: "dndcustom-cs-content" });
        sheet = this.makeCharacterSheet(data);
        // Reuse the same working sheet renderer inside the note, without opening a modal.
        sheet.contentEl = content;
        sheet.close = () => {
          const current = this.charCache.get(id) || data;
          this.makeCharacterSheet(current).open();
        };
        sheet.onOpen();
        sheet.containerEl?.remove();
        sheet.modalEl?.remove();
        const windowButton = content.querySelector(".dndcustom-cs-close-btn");
        if (windowButton) {
          windowButton.textContent = "Open in window";
          windowButton.setAttr("title", "Open the interactive character sheet in a separate window");
        }
        const header = content.querySelector(".dndcustom-mm-tools") || content.querySelector(".dndcustom-cs-header");
        const refresh = header.createEl("button", { cls: "dndcustom-refresh-btn", text: "Refresh" });
        refresh.setAttr("title", rewriteNote ? "Re-import this generated character note" : "Refresh character data without changing your note");
        refresh.addEventListener("click", async () => {
          refresh.disabled = true;
          try {
            if (rewriteNote) {
              await this.importCharacter(id);
              await render();
            } else await render(true);
          } catch (error) {
            new Notice(error.message || "Character refresh failed.");
          } finally {
            refresh.disabled = false;
          }
        });
      } catch (error) {
        if (disposed) return;
        releaseSheet();
        frame.empty();
        frame.createEl("p", { text: "The full player tracker could not load. Connect to D&D Beyond once to save a complete offline copy." });
        const maxHp = Number(source.match(/^\s*maxHp\s*:\s*(\d+)\s*$/m)?.[1]);
        if (maxHp > 0) {
          // Retain the previous HP widget's explicit fallback values for offline use.
          this.widgetProcessors.get("dnd-custom-hp-tracker")?.(source, frame, context);
        }
        const retry = frame.createEl("button", { cls: "dndcustom-refresh-btn", text: "Retry loading full tracker" });
        retry.addEventListener("click", () => render(true));
        console.warn("Custom importer: inline tracker could not load", error);
      }
    };
    await render();
  }

  renderSheetLauncher(source, el, context, legacy) {
    const id = source.match(/^\s*charId\s*:\s*(\d+)\s*$/m)?.[1];
    const row = el.createDiv({ cls: "dndcustom-launcher-row" });
    const open = row.createEl("button", { cls: "dndcustom-sheet-btn", text: "Open Interactive Character Sheet" });
    const refresh = row.createEl("button", { cls: "dndcustom-refresh-btn", text: "Refresh from D&D Beyond" });
    if (!id || id === "0") {
      open.disabled = refresh.disabled = true;
      open.title = refresh.title = "This note has no D&D Beyond character ID.";
      return;
    }
    refresh.title = legacy
      ? "Refresh full character data while preserving this existing note."
      : "Refresh the imported note and interactive character sheet.";

    open.addEventListener("click", async () => {
      open.disabled = true;
      open.textContent = "Loading character…";
      try {
        const entry = await this.fetchCharacter(id);
        this.makeCharacterSheet(entry).open();
      } catch (error) {
        console.error("Custom importer: character loading failed", error);
        new Notice("Couldn't load the full character. Connect to D&D Beyond once to save an offline copy. " + (error.message || ""));
      } finally {
        open.disabled = false;
        open.textContent = "Open Interactive Character Sheet";
      }
    });

    refresh.addEventListener("click", async () => {
      refresh.disabled = true;
      refresh.textContent = "Refreshing…";
      try {
        if (legacy) await this.fetchCharacter(id, true);
        else await this.importCharacter(id);
        refresh.textContent = "Refreshed";
      } catch (error) {
        refresh.textContent = "Refresh failed";
        new Notice(error.message || "Character refresh failed.");
      } finally {
        refresh.disabled = false;
        setTimeout(() => { refresh.textContent = "Refresh from D&D Beyond"; }, 1500);
      }
    });
  }

  async importCharacter(input) {
    const result = await super.importCharacter(input);
    // Successful imports contain the complete character response.
    const raw = String(input);
    const id = raw.match(/\/characters\/(\d+)/)?.[1] || raw.match(/^\d+$/)?.[0];
    const entry = id && this.charCache.get(id);
    if (entry?.char) {
      this.fullCharacterIds.add(id);
      await this.saveSettings();
    }
    return result;
  }

  async onunload() {
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    await this.saveSettings();
  }
}

module.exports = CustomDnDBeyondImporter;

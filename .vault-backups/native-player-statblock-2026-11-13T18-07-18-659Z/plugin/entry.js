"use strict";

// Editable source. Run node build.cjs after JavaScript changes.
const { Notice, requestUrl, parseYaml } = require("obsidian");
const CoreModule = require("./lib/importer.js");
const ImporterCore = CoreModule.default || CoreModule;
const CharacterAPI = CoreModule.customCore;
const RUNTIME_KEY = "__customRuntime";

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
    const blocks = /^[ \t]*\x60{3}(dnd-(?:custom-)?(?:sheet-launcher|hp-tracker))[ \t]*\r?\n([\s\S]*?)^[ \t]*\x60{3}[ \t]*$/gm;
    for (const match of text.matchAll(blocks)) {
      if (customOnly && !match[1].startsWith("dnd-custom-")) continue;
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
        new CharacterAPI.FullCharacterSheet(this.app, this, entry.char, entry.stats, entry.pb).open();
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

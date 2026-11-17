"use strict";

// Editable source. After JavaScript changes, run node build.cjs in this folder.

/**
 * Personal plugin entry point.
 * Original importer: Jktaisa, installed version 1.1.4.
 * This copy has its own plugin ID, settings, widgets, CSS, and note identity.
 *
 * Edit styles.css for layout and appearance.
 * Edit this class to add commands or extend importing behavior.
 * The copied, namespaced implementation lives in lib/importer.js.
 */
const CoreModule = require("./lib/importer.js");
const ImporterCore = CoreModule.default || CoreModule;

class CustomDnDBeyondImporter extends ImporterCore {
  async onload() {
    await super.onload();

    // Add personal commands, event listeners, or setup here.
    // Use this.addCommand(...) and this.registerEvent(...) so Obsidian
    // can clean them up when the plugin is disabled or reloaded.
  }

  async importCharacter(input) {
    // Add preprocessing here, or customize the implementation in lib/importer.js.
    return super.importCharacter(input);
  }
}

module.exports = CustomDnDBeyondImporter;

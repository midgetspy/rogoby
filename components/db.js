import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { existsSync } from 'fs'

export class Database {
    #dbFilename = './config/config.db'

    #db = null

    async getDb() {
        if (this.#db === null) {
            let existingDb = existsSync(this.#dbFilename);

            this.#db = await open({
                filename: this.#dbFilename,
                mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
                driver: sqlite3.Database
            });

            if (!existingDb) {
                await this.initializeDb();
            }
        }

        return this.#db;
    }

    async createEffectPreset(effectPreset) {
        let db = await this.getDb();

        let insertedEffectPreset = await db.run(`
            INSERT INTO effectPreset (
                name,
                effectId,
                width,
                speed,
                intensity,
                paletteId,
                custom1,
                custom2,
                custom3
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            effectPreset.name,
            effectPreset.effectId,
            effectPreset.width,
            effectPreset.speed,
            effectPreset.intensity,
            effectPreset.paletteId,
            effectPreset.custom1,
            effectPreset.custom2,
            effectPreset.custom3
        );
        effectPreset.id = insertedEffectPreset.lastID;

        console.log('added an effectPreset with id', effectPreset.id);

        return this._insertColorsForEffectPreset(effectPreset);
    }

    async updateEffectPreset(effectPreset) {
        let db = await this.getDb();

        let result = await db.run(`
            UPDATE effectPreset SET
                name = ?,
                effectId = ?,
                width = ?,
                speed = ?,
                intensity= ?,
                paletteId = ?,
                custom1 = ?,
                custom2 = ?,
                custom3 = ?
            WHERE id = ?`,
            effectPreset.name,
            effectPreset.effectId,
            effectPreset.width,
            effectPreset.speed,
            effectPreset.intensity,
            effectPreset.paletteId,
            effectPreset.custom1,
            effectPreset.custom2,
            effectPreset.custom3,
            effectPreset.id
        );
        console.log('updated effectPreset with id', effectPreset.id);

        return await this._insertColorsForEffectPreset(effectPreset);
    }

    async _insertColorsForEffectPreset(effectPreset) {
        let db = await this.getDb();

        await db.run("DELETE FROM effectPresetColor WHERE effectPresetId = ?", effectPreset.id);

        for (let i in effectPreset.colors) {
            await db.run("INSERT INTO effectPresetColor (red, green, blue, effectPresetId) VALUES (?, ?, ?, ?)",
                effectPreset.colors[i].red,
                effectPreset.colors[i].green,
                effectPreset.colors[i].blue,
                effectPreset.id
            );
        }

        return effectPreset;
    }

    async deleteEffectPreset(id) {
        let db = await this.getDb();

        const result = await db.run("DELETE FROM effectPreset WHERE id = ?", id);
        await db.run("DELETE FROM effectPresetColor WHERE effectPresetId = ?", id);

        return result.changes > 0;
    }

    async getEffectPresets() {
        let db = await this.getDb();
        const effectPresets = await db.all("SELECT * FROM effectPreset");
        return await Promise.all(effectPresets.map(async effectPreset => await this._populateColorsForEffectPreset(effectPreset)));
    }

    async getEffectPreset(id) {
        let db = await this.getDb();
        const effectPreset = await db.get("SELECT * FROM effectPreset WHERE id = ?", id);
        return await this._populateColorsForEffectPreset(effectPreset);
    }

    async _populateColorsForEffectPreset(effectPreset) {
        if (!effectPreset) {
            return effectPreset;
        }

        let db = await this.getDb();

        const colors = await db.all(`SELECT id, red, green, blue FROM effectPresetColor WHERE effectPresetId = ?`, effectPreset.id);
        effectPreset.colors = colors;

        return effectPreset;
    }


    async getPresets() {
        let db = await this.getDb();
        const presets = await db.all("SELECT * FROM sectionPreset");
        return await Promise.all(presets.map(async preset => await this._populateSectionsForPreset(preset)));
    }

    async getPreset(id) {
        let db = await this.getDb();

        const preset = await db.get("SELECT * FROM sectionPreset WHERE id = ?", id);

        return await this._populateSectionsForPreset(preset);
    }

    async _populateSectionsForPreset(preset) {
        if (!preset) {
            return preset;
        }

        let db = await this.getDb();

        const sections = await db.all(`SELECT id, name, length, reversed, mirrored FROM section WHERE sectionPresetId = ?`, preset.id);
        preset.sections = sections.map(x => ({
            ...x,
            reversed: x.reversed == 1,
            mirrored: x.mirrored == 1
        }));

        return preset;
    }

    async createPreset(preset) {
        let db = await this.getDb();

        let insertedPreset = await db.run("INSERT INTO sectionPreset (name) VALUES (?)", preset.name);
        preset.id = insertedPreset.lastID;
        console.log('added a sectionPreset with id', preset.id);

        this._insertSectionsForPreset(preset);

        return preset.id;
    }

    async updatePreset(preset) {
        let db = await this.getDb();

        await db.run("UPDATE sectionPreset SET name = ? WHERE id = ?", preset.name, preset.id);
        console.log('updated the sectionPreset with id', preset.id);

        this._insertSectionsForPreset(preset);

        return preset.id;
    }

    async _insertSectionsForPreset(preset) {
        let db = await this.getDb();

        await db.run("DELETE FROM section WHERE sectionPresetId = ?", preset.id);

        for (let i in preset.sections) {
            await db.run("INSERT INTO section (name, length, reversed, mirrored, sectionPresetId) VALUES (?, ?, ?, ?, ?)",
                preset.sections[i].name,
                preset.sections[i].length,
                preset.sections[i].reversed,
                preset.sections[i].mirrored,
                preset.id
            );
        }

        return;
    }


    async deletePreset(id) {
        let db = await this.getDb();

        const result = await db.run("DELETE FROM sectionPreset WHERE id = ?", id);
        await db.run("DELETE FROM section WHERE sectionPresetId = ?", id);

        return result.changes > 0;
    }

    async initializeDb() {
        let db = await this.getDb();

        await db.run(
            `CREATE TABLE IF NOT EXISTS section (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                length INTEGER,
                reversed BOOLEAN,
                mirrored BOOLEAN,
                sectionPresetId INTEGER,
                FOREIGN KEY(sectionPresetId) REFERENCES sectionPreset(id)
            )`
        );

        console.log("Created section table.");

        await db.run(
            `CREATE TABLE IF NOT EXISTS sectionPreset (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT
            )`
        );

        console.log("Created sectionPreset table.");

        await db.run(
            `CREATE TABLE IF NOT EXISTS effectPreset (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                effectId INTEGER,
                width INTEGER,
                speed INTEGER,
                intensity INTEGER,
                paletteId INTEGER,
                custom1 INTEGER,
                custom2 INTEGER,
                custom3 INTEGER
            )`
        );

        console.log("Created effectPreset table.");

        await db.run(
            `CREATE TABLE IF NOT EXISTS effectPresetColor (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                red INTEGER,
                green INTEGER,
                blue INTEGER,
                effectPresetId INTEGER,
                FOREIGN KEY(effectPresetId) REFERENCES effectPreset(id)
            )`
        );

        console.log("Created effectPresetColor table.");
    }
}
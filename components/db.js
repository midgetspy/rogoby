export class EffectPresetRow {
    constructor (id, name, effectName, colors) {
        this.id = id
        this.name = name;
        this.effectName = effectName;
        this.colors = colors;
    }
}

export class SectionRow {
    constructor (id, name, length, reversed, mirrored) {
        this.id = id;
        this.name = name;
        this.length = length;
        this.reversed = reversed;
        this.mirrored = mirrored;
    }
}

export class SectionConfiguration {
    constructor(id, name, sections) {
        this.id = id
        this.name = name
        this.sections = sections
    }
}
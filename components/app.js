import {immerable} from "immer"

export class Color {
    static Black = new Color(0,0,0);
    static Red = new Color(255,0,0);
    static Green = new Color(8,255,0);
    static Blue = new Color(0,0,255);
    static Yellow = new Color(255,200,0);
    static White = new Color(255,255,255);

    constructor(red, green, blue) {
        this.red = red;
        this.green = green;
        this.blue = blue;
    }
}

class ApiEffect {
    static Solid = (color) => new ApiEffect(0, 128, 128, color);
    static Running = (speed, intensity, fg, bg) => new ApiEffect(15, speed, intensity, fg, bg);
    static Colorwave = (speed, hue, color) => new ApiEffect(67, speed, hue, color);
    static Phased = (speed, intensity, fg, bg) => new ApiEffect(105, speed, intensity, fg, bg);
    static Railway = (speed, smoothness, fg, bg) => new ApiEffect(78, speed, smoothness, fg, bg);
    static Saw = (speed, width, fg, bg) => new ApiEffect(16, speed, width, fg, bg);
    static Sine = (speed, intensity, fg, bg) => new ApiEffect(108, speed, intensity, fg, bg);

    constructor(id, speed, intensity, color1, color2=Color.Black, color3=Color.Black, paletteId=0) {
        this.id = id;
        this.speed = speed;
        this.intensity = intensity;
        this.color1 = color1;
        this.color2 = color2;
        this.color3 = color3;
        this.paletteId = paletteId;
    }
}

export class WledEffectPreset {
    [immerable] = true

    setWidth(width) {
        this.width = width;
    }

    setColors(colors) {
        this.colors = colors;
    }

    _createEffects() {
        return [new ApiEffect(this.effectId, this.speed, this.intensity, this.colors[0] ?? Color.Black, this.colors[1] ?? Color.Black, this.colors[2] ?? Color.Black, this.paletteId ?? 0)]
    }

    constructor(name, effectId, width, speed, intensity, colors, paletteId, custom1, custom2, custom3) {
        this.name = name
        this.effectId = effectId;
        this.width = width;
        this.speed = speed;
        this.intensity = intensity;
        this.colors = colors;
        this.paletteId = paletteId;
        this.custom1 = custom1;
        this.custom2 = custom2;
        this.custom3 = custom3;
    }

    renderForSegment(idStart, segmentStart, segment) {
        let effects = this._createEffects(segment)
        return effects.map((effect, i) => {
            return {
                "id":idStart+i,
                "start":segmentStart+i*this.width,
                "stop":segmentStart+segment.length,
                "grp":this.width,
                "spc":effects.length-1,
                "of":0,
                "on":true,
                "frz":false,
                "bri":255,
                "cct":127,
                "col": [effect.color1, effect.color2, effect.color3].map(x => [x.red, x.green, x.blue]),
                "fx":effect.id,
                "sx":effect.speed,
                "ix":effect.intensity,
                "pal":effect.paletteId,
                "sel":false,
                "rev":segment.reversed,
                "mi":segment.mirrored
            };
        });
    }
}

export class VirtualEffect extends WledEffectPreset {
    static displayName = "Virtual Effect";
    static maxColors = 10;
    static effectId = 1000;

    constructor (presetName, width, colors) {
        super(presetName, 0, 1, 128, 128, colors, 0, 0, 0, 0)
    }

    _createEffect(color) {
        throw new Error("_createEffect must be defined in a subclass");
    }

    _createEffects(segment) {
        // copy it
        let effectColors = [...this.colors]

        // reverse it
        if (segment.reversed) {
            effectColors.reverse();
        }

        // rotate it so the end of the reversed pattern lands on the last LED
        let offset = effectColors.length - segment.length % effectColors.length;
        effectColors = [...effectColors.slice(offset), ...effectColors.slice(0, offset)];

        return effectColors.map((color) => this._createEffect(color));
    }
}

export class StaticPattern extends VirtualEffect {
    static displayName = "Static Pattern";
    static effectId = 1000;

    _createEffect(color) {
        return ApiEffect.Solid(color);
    }
}

export class ColorwavePattern extends VirtualEffect {
    static displayName = "Colorwave Pattern";
    static effectId = 1001;

    _createEffect(color) {
        return ApiEffect.Colorwave(this.speed, this.intensity, color);
    }
}

export const VirtualEffectList = [StaticPattern, ColorwavePattern];

export class Section {
    id = -1;
    
    constructor(name, length, reversed=false, mirror=false) {
        this.name = name;
        this.length = length;
        this.reversed = reversed;
        this.mirrored = mirror;
    }

    setEffect(effect) {
        this.effect = effect;
        return this;
    }
}

export class LedString {
    id = -1;
    sections = [];

    constructor(name, sections) {
        this.name = name;
        this.sections = sections;
    }

    setSections(sections) {
        this.sections = sections;
    }

    render() {
        let nextId = 0, nextLed = 0, apiSegments = [];

        for (let i in this.sections) {
            if (apiSegments.length > 0) {
                nextLed = Math.max(...apiSegments.map(x => x.stop));
                nextId = apiSegments[apiSegments.length-1].id + 1;
            }

            let section = this.sections[i];
            if (section.effect) {
                apiSegments = apiSegments.concat(section.effect.renderForSegment(nextId, nextLed, section));
            } else {
                console.log('no pattern defined yet for', section, section.effect);
            }
        }

        return {
            "on": true,
            "bri": 255,
            "transition": 0,
            "mainseg": 0,
            "seg": apiSegments.concat(Array(20).fill({"stop":0}))
        }
    }

}

let a = new StaticPattern("foo", 3, [Color.Red, Color.Green, Color.Blue]);
let a2 = new WledEffectPreset("foo", 67, 2, 3, 4, [Color.Red, Color.Blue, Color.Green], 5, 6, 7, 8);
let b = new Section("bar", 8, true, false);
let c = a.renderForSegment(55, 0, b);
console.log('out is', JSON.stringify(c, null, 3));
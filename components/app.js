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
    static CandleMulti = (speed, intensity, fg, bg) => new ApiEffect(102, speed, intensity, fg, bg);
    static SolidPatternTri = (size, color1, color2, color3) => new ApiEffect(84, 0, size, color1, color2, color3);
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

    renderForSegment(idStart, sectionStart, section) {
        let effects = this._createEffects(section)
        return effects.map((effect, i) => {
            let start = sectionStart+i*this.width;
            let stop = sectionStart+section.length;
            let grouping = this.width;
            let spacing = (effects.length-1)*this.width;
            let segmentLength = (stop - start) - (stop - start + spacing) % (spacing + grouping);
            console.log("G", grouping, "S", spacing, "L", stop - start, "result", segmentLength);
            return {
                "n":section.name + (effects.length > 1 ? " (" + (i+1) + ")" : ""),
                "id":idStart+i,
                "start":start,
                "stop":start + segmentLength,
                "grp":grouping,
                "spc":spacing,
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
                "rev":section.reversed,
                "mi":section.mirrored
            };
        });
    }
}

export class VirtualEffect extends WledEffectPreset {
    static displayName = "Virtual Effect";
    static maxColors = 10;
    static effectId = 1000;

    constructor (presetName, width, colors) {
        super(presetName, 0, width, 128, 128, colors, 0, 0, 0, 0)
    }

    _createEffect(color) {
        throw new Error("_createEffect must be defined in a subclass");
    }

    _createEffects(segment) {
        // copy it
        let effectColors = [...this.colors]

        if (segment.reversed) {
            // reverse it
            effectColors.reverse();

            // rotate it so the end of the reversed pattern lands on the last LED
            // doesn't work perfectly when width > 1 and length % width > 0 but good enough for now
            let offset = effectColors.length - Math.ceil(segment.length/this.width) % effectColors.length;
            effectColors = [...effectColors.slice(offset), ...effectColors.slice(0, offset)];
        }

        return effectColors.map((color) => this._createEffect(color));
    }

    renderForSegment(idStart, segmentStart, segment) {
        if (segment.mirrored) {
            let firstLength = Math.ceil(segment.length/2);
            let firstSegment = new Section(segment.name + " First Half", firstLength, false, false);
            let firstRender = super.renderForSegment(idStart, segmentStart, firstSegment);

            let secondLength = Math.floor(segment.length/2);
            let secondSegment = new Section(segment.name + " Second Half", secondLength, true, false);
            let secondRender = super.renderForSegment(idStart+firstRender.length, segmentStart+firstSegment.length, secondSegment);

            return [...firstRender, ...secondRender];
        } else {
            return super.renderForSegment(idStart, segmentStart, segment);
        }
    }
}

export class StaticPattern extends VirtualEffect {
    static displayName = "Static Pattern";
    static effectId = 1000;

    _createEffects(segment) {
        if (this.colors.length == 3) {
            return [ApiEffect.SolidPatternTri(0, this.colors[0], this.colors[1], this.colors[2])]
        } else {
            return super._createEffect(segment);
        }
    }

    _createEffect(color) {
        return ApiEffect.Solid(color);
    }
}

export class ColorwavePattern extends VirtualEffect {
    static displayName = "Colorwave Pattern";
    static effectId = 1001;

    _createEffect(color) {
        return ApiEffect.Colorwave(1, 1, color);
    }
}

export class CandleMultiPattern extends VirtualEffect {
    static displayName = "Candle Pattern";
    static effectId = 1002;

    _createEffect(color) {
        return ApiEffect.CandleMulti(1, 80, color, Color.Black);
    }
}

export const VirtualEffectList = [StaticPattern, ColorwavePattern, CandleMultiPattern];

export class Section {
    id = -1;
    
    constructor(name, length, reversed=false, mirrored=false) {
        this.name = name;
        this.length = length;
        this.reversed = reversed;
        this.mirrored = mirrored;
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

// let a = new StaticPattern("foo", 1, [Color.Red, Color.Green, Color.Blue]);
// let a2 = new WledEffectPreset("foo", 67, 2, 3, 4, [Color.Red, Color.Blue, Color.Green], 5, 6, 7, 8);
// let b = new Section("bar", 14, false, true);
// let c = a.renderForSegment(0, 0, b);
// console.log('out is', JSON.stringify(c, null, 3));
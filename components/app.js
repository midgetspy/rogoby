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

    #componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
      
    hexString() {
        return "#" + this.#componentToHex(this.red) + this.#componentToHex(this.green) + this.#componentToHex(this.blue);
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

    constructor(id, speed, intensity, color1, color2=Color.Black, color3=Color.Black) {
        this.id = id;
        this.speed = speed;
        this.intensity = intensity;
        this.color1 = color1;
        this.color2 = color2;
        this.color3 = color3;
    }
}

class ApiSegment {
    #id
    #start
    #stop
    #grouping
    #spacing
    #reverse
    #mirror
    #effect

    constructor(id, start, stop, effect, grouping=1, spacing=0, reverse=false, mirror=false) {
        this.#id = id;
        this.#start = start;
        this.#stop = stop;
        this.#grouping = grouping;
        this.#spacing = spacing;
        this.#reverse = reverse;
        this.#effect = effect;
        this.#mirror = mirror;
    }

    render() {
        return {
            "id":this.#id,
            "start":this.#start,
            "stop":this.#stop,
            "grp":this.#grouping,
            "spc":this.#spacing,
            "of":0,
            "on":true,
            "frz":false,
            "bri":255,
            "cct":127,
            "col":[
                [
                    this.#effect.color1.red,
                    this.#effect.color1.green,
                    this.#effect.color1.blue
                ],
                [
                    this.#effect.color2.red,
                    this.#effect.color2.green,
                    this.#effect.color2.blue
                ],
                [
                    this.#effect.color3.red,
                    this.#effect.color3.green,
                    this.#effect.color3.blue
                ]
            ],
            "fx":this.#effect.id,
            "sx":this.#effect.speed,
            "ix":this.#effect.intensity,
            "pal":0,
            "sel":false,
            "rev":this.#reverse,
            "mi":this.#mirror
            };
    }
}

class StaticPattern {
    static displayName = "Static Pattern";
    static maxColors = 10;
    colors = [];
    #width = 1;

    setWidth(width) {
        this.#width = width;
    }

    setColors(colors) {
        this.colors = colors;
    }

    _createEffects() {
        return this.colors.map((color) => ApiEffect.Solid(color));
    }

    renderForSegment(idStart, segmentStart, segment) {
        let effects = this._createEffects()
        return effects.map((effect, i) => {
            return new ApiSegment(
                idStart+i,
                segmentStart+i*this.#width,
                segmentStart+segment.length,
                effect,
                this.#width,
                effects.length-1,
                segment.reversed,
                segment.mirrored,
            ).render()
        });
    }
}

class ColorwavePattern extends StaticPattern {
    static displayName = "Colorwave Pattern";
    static maxColors = 2;
    #hue = 128;
    #speed = 1;

    _createEffects() {
        return this.colors.map((color) => ApiEffect.Colorwave(this.#speed, this.#hue, color));
    }
}

class Running extends StaticPattern {
    static displayName = "Running";
    static maxColors = 2;
    #speed = 20;
    #runWidth = 255;

    _createEffects() {
        return [ApiEffect.Running(this.#speed, this.#runWidth, this.colors[0] ?? Color.Black, this.colors[1] ?? Color.Black)];
    }

}

class Phased extends StaticPattern {
    static displayName = "Phased";
    static maxColors = 2;
    #speed = 40;
    #intensity = 255;

    _createEffects() {
        return [ApiEffect.Phased(this.#speed, this.#intensity, this.colors[0] ?? Color.Black, this.colors[1] ?? Color.Black)];
    }
}

class Railway extends StaticPattern {
    static displayName = "Railway";
    static maxColors = 2;
    #speed = 128;
    #smoothness = 255;

    _createEffects() {
        return [ApiEffect.Railway(this.#speed, this.#smoothness, this.colors[0] ?? Color.Black, this.colors[1] ?? Color.Black)];
    }

}

class Saw extends StaticPattern {
    static displayName = "Saw";
    static maxColors = 2;
    #speed = 20;
    #sawWidth = 128;

    _createEffects() {
        return [ApiEffect.Saw(this.#speed, this.#sawWidth, this.colors[0] ?? Color.Black, this.colors[1] ?? Color.Black)];
    }
}

class Sine extends StaticPattern {
    static displayName = "Sine";
    static maxColors = 2;
    #speed = 20;
    #intensity = 128;

    _createEffects() {
        return [ApiEffect.Sine(this.#speed, this.#intensity, this.colors[0] ?? Color.Black, this.colors[1] ?? Color.Black)];
    }
}

export const EffectList = [StaticPattern, ColorwavePattern, Running, Phased, Railway, Saw, Sine];

export class Section {
    id = -1;
    
    constructor(name, length, reverse=false, mirror=false) {
        this.name = name;
        this.length = length;
        this.reversed = reverse;
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

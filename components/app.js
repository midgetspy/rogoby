export class Color {
    static Black = new Color(0,0,0)
    static Red = new Color(255,0,0)
    static Green = new Color(8,255,0)
    static Blue = new Color(0,0,255)
    static Yellow = new Color(255,200,0)
    static White = new Color(255,255,255)

    constructor(red, green, blue) {
        this.red = red
        this.green = green
        this.blue = blue
    }

    #componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
      
    hexString() {
        return "#" + this.#componentToHex(this.red) + this.#componentToHex(this.green) + this.#componentToHex(this.blue);
    }
}

class Effect {
    static Solid = (color) => new Effect(0, 128, 128, color)
    static Running = (speed, intensity, fg, bg) => new Effect(15, speed, intensity, fg, bg)
    static Colorwave = (speed, hue, color) => new Effect(67, speed, hue, color)
    static Phased = (speed, intensity, fg, bg) => new Effect(105, speed, intensity, fg, bg)
    static Railway = (speed, smoothness, fg, bg) => new Effect(78, speed, smoothness, fg, bg)
    static Saw = (speed, width, fg, bg) => new Effect(16, speed, width, fg, bg)
    static Sine = (speed, intensity, fg, bg) => new Effect(108, speed, intensity, fg, bg)

    constructor(id, speed, intensity, color1, color2=Color.Black, color3=Color.Black) {
        this.id = id
        this.speed = speed
        this.intensity = intensity
        this.color1 = color1
        this.color2 = color2
        this.color3 = color3
    }
}

export class Section {
    constructor(name, length, reverse=false, mirror=false) {
        this.name = name
        this.length = length
        this.reverse = reverse
        this.mirror = mirror
    }

    setPattern(pattern) {
        this.pattern = pattern
        return this
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
        this.#id = id
        this.#start = start
        this.#stop = stop
        this.#grouping = grouping
        this.#spacing = spacing
        this.#reverse = reverse
        this.#effect = effect
        this.#mirror = mirror
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
            }
    }
}

export class Pattern {
    displayName = "Static Pattern"
    maxColors = 10
    _effects = []
    colors = []
    #width = 1

    setWidth(width) {
        this.#width = width
    }

    setColors(colors) {
        this.colors = colors
        this._effects = colors.map((color) => Effect.Solid(color))
    }

    addColor(color) {
        this._effects.push(Effect.Solid(color))
        return this
    }

    renderForSegment(idStart, segmentStart, segment) {
        return this._effects.map((effect, i) => {
            return new ApiSegment(
                idStart+i,
                segmentStart+i*this.#width,
                segmentStart+segment.length,
                effect,
                this.#width,
                this._effects.length-1,
                segment.reverse,
                segment.mirror,
            ).render()
        })
    }
}

export class ColorwavePattern extends Pattern {
    displayName = "Colorwave Pattern"
    maxColors = 10
    #hue = 128
    #speed = 1

    setColors(colors) {
        this._effects = colors.map((color) => Effect.Colorwave(this.#speed, this.#hue, color))
    }

    addColor(color) {
        this._effects.push(Effect.Colorwave(this.#speed, this.#hue, color))
        return this
    }
}

export class RunningPattern extends Pattern {
    static displayName = "Running"
    maxColors = 2
    constructor(color1, color2, speed=20, width=255) {
        super()
        this._effects.push(Effect.Running(speed, width, color1, color2))
    }
}

export class PhasedPattern extends Pattern {
    static displayNmae = "Phased"
    maxColors = 2
    constructor(color1, color2, speed=40, intensity=255) {
        super()
        this._effects.push(Effect.Phased(speed, intensity, color1, color2))
    }
}

export class RailwayPattern extends Pattern {
    static displayName = "Railway"
    maxColors = 2
    constructor(color1, color2, speed=128, smoothness=255) {
        super()
        this._effects.push(Effect.Railway(speed, intensity, color1, color2))
    }
}

export class SawPattern extends Pattern {
    static displayName = "Saw"
    maxColors = 2
    constructor(color1, color2, speed=20, width=128) {
        super()
        this._effects.push(Effect.Saw(speed, width, color1, color2))
    }
}

export class SinePattern extends Pattern {
    static displayName = "Sine"
    maxColors = 2
    constructor(color1, color2, speed=20, intensity=128) {
        super()
        this._effects.push(Effect.Sine(speed, intensity, color1, color2))
    }
}

export class LedString {
    #apiSegments = []
    
    addSection(section) {
        let nextId = 0, nextLed = 0

        if (this.#apiSegments.length > 0) {
            nextLed = Math.max(...this.#apiSegments.map(x => x.stop))
            nextId = this.#apiSegments[this.#apiSegments.length-1].id + 1
        }

        if (section.pattern) {
            this.#apiSegments = this.#apiSegments.concat(section.pattern.renderForSegment(nextId, nextLed, section))
        } else {
            console.log('no pattern defined yet for', section)
        }

        return this
    }

    render() {
        return {
            "on": true,
            "bri": 255,
            "transition": 0,
            "mainseg": 0,
            "seg": this.#apiSegments.concat(Array(20).fill({"stop":0}))
        }
    }

}

// let rgby = new Pattern()
//     .addColor(Color.Red)
//     .addColor(Color.Green)
//     .addColor(Color.Blue)
//     .addColor(Color.Yellow)

// let rgbyWave = new ColorwavePattern(1, 128)
//     .addColor(Color.Red)
//     .addColor(Color.Green)
//     .addColor(Color.Blue)
//     .addColor(Color.Yellow)

// let rgRunning = new RunningPattern(Color.Red, Color.Green)

// let rgPhased = new PhasedPattern(Color.Red, Color.Green)

// let string1 = new LedString()
//     .addSection(rgby, new Section(100))
//     .addSection(rgbyWave, new Section(50))

// let string2 = new LedString()
//     .addSection(rgRunning, new Section(100, false, true))
//     .addSection(rgPhased, new Section(50))

//console.log(JSON.stringify(string2.render(), null, 3))

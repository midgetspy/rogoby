import { useState } from 'react';
import Head from 'next/head';
import iro from '@jaames/iro'
import React, { useEffect, useRef } from 'react'
import { Color, Section, Pattern, ColorwavePattern, RunningPattern, PhasedPattern, RailwayPattern, SawPattern,
    SinePattern, LedString } from '../components/app'

export default function NewHotness() {
    const [sections, setSections] = useState([new Section("Main", 124), new Section("Other", 22)]);
    const [chosenSection, setChosenSection] = useState(sections[0])
    
    function chooseSection(section) {
        setChosenSection(section)
    }

    function test() {
        let foo = new LedString()

        console.log('sections to render', sections)

        for (let i in sections) {
            foo = foo.addSection(sections[i])
        }

        let rendered = foo.render()

        console.log('rendered', rendered);
    }


    return (
        <>
            <Head>
                <title>WLED 2D</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <SectionChooser sections={sections} setSection={chooseSection}/>
            <SectionComponent section={chosenSection} />
            <button onClick={test}>Test</button>
        </>
    )
}

function SectionChooser({ sections, setSection }) {
    function handleChange(e) {
        console.log(e.target)
        console.log(sections[e.target.value])
        setSection(sections[e.target.value])
    }
    
    return (
        <select onChange={handleChange}>
        {sections.map((section, index) =>
            <option key={index} value={index}>{section.name}</option>
        )}
        </select>
    )
}
    
function SectionComponent({ section }) {
    const [pattern, setPattern] = useState();

    useEffect(() => {
        setPattern(section.pattern)
    }, [section]);

    function setPattern2(pattern) {
        section.setPattern(pattern)
        setPattern(pattern)
    }

    let patternComponent = ''
    if (pattern && pattern.constructor.name === Pattern.name) {
        patternComponent = <StaticPatternComponent pattern={pattern} setPattern={setPattern2} />
    }

    return (
        <>
            <h2>{section.name} ({section.length})</h2>
            <PatternChooser setPattern={setPattern2} /><br />
            {patternComponent}
        </>
    )
}

function PatternChooser({ setPattern }) {
    const patterns = [new Pattern(), new ColorwavePattern()]//, RunningPattern, PhasedPattern, RailwayPattern, SawPattern, SinePattern]

    function handleChange(e) {
        console.log(e.target)
        console.log(patterns[e.target.value])
        setPattern(patterns[e.target.value])
    }
    
    return (
        <select onChange={handleChange}>
            <option />
        {patterns.map((pattern, index) =>
            <option key={index} value={index}>{pattern.displayName}</option>
        )}
        </select>
    )
}

function StaticPatternComponent({ pattern, setPattern }) {
    const [colors, setColors] = useState([]);

    useEffect(() => {
        setColors(pattern.colors)
    }, [pattern]);

    function addColor(toAdd) {
        setColors(oldColors => {
            let newColors = [...oldColors, new Color(toAdd[0], toAdd[1], toAdd[2])]
            pattern.setColors(newColors)
            return pattern.colors
        });
    };

    return (
        <>
            <b>{pattern.displayName}</b><br />
            {colors.map((color) => (
                <div key={crypto.randomUUID()} style={{width: 10, height: 10, backgroundColor: color.hexString()}}></div>
            ))}
            <ColorPicker setColor={addColor} />
        </>
    )
}

function HomePage() {

    const staticSection = new Section("Main", 123);
    const staticPattern = new Pattern()
    staticPattern.setColors([Color.Yellow, Color.Green, Color.Blue])
    //staticSection.setPattern(staticPattern)

    const [colors, setColors] = useState([]);
    const [numLeds, setNumLeds] = useState(0);
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState()
    const [selectedPattern, setSelectedPattern] = useState()

    const patterns = [new Pattern(), new ColorwavePattern()]//, RunningPattern, PhasedPattern, RailwayPattern, SawPattern, SinePattern]

    function wrapSetSelectedPattern(pattern) {
        console.log('selecting pattern', pattern)
        setSelectedPattern(pattern)
    }

    function wrapSetSelectedSection(section) {
        console.log('selecting section', section)
        setSelectedSection(section)
    }

    useEffect(() => {
        fetch("api/wled")
            .then(res => res.json())
            .then(numLeds => {
                setNumLeds(numLeds)
                setSections([new Section(numLeds), new Section(0)])
                //setSection(new Section(numLeds))
            })
        }, 
    []);

    function addColor(toAdd) {
        setColors(oldColors => [...oldColors, new Color(toAdd[0], toAdd[1], toAdd[2])])
    }

    function resetColors() {
        setColors([])
    }

    function createWledObject() {
        let pattern = new Pattern()
        for (let i in colors) {
            pattern.addColor(colors[i])
        }
        let string = new LedString()
        for (let i in sections) {
            sections[i].setPattern(pattern)
            string.addSection(sections[i])
        }
        return string.render()
    }

    function sendToWled() {
        let payload = createWledObject()
        fetch('api/wled', {
            method: "POST",
            body: JSON.stringify(payload)
        })
        .then((res) => res.json())
        .then((data) => {
            console.log('response', data)
        })

    }

    return (
        <>
            <Head>
                <title>WLED 2D</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <SectionComponent section={staticSection} />

            {/* <select>
            {sections.map((x) => (
                <option key={crypto.randomUUID()}>{x.length}</option>
            ))}
            </select>
            <Selector selectOptions={sections.map((x) => ({ name: x.length, value: x }))} selectOption={wrapSetSelectedSection} />
            <Selector selectOptions={patterns.map((x) => ({ name: x.displayName, value: x }))} selectOption={wrapSetSelectedPattern} />
            {colors.map((color) => (
                <div key={crypto.randomUUID()} style={{width: 10, height: 10, backgroundColor: color.hexString()}}></div>
            ))}

            <ColorPicker setColor={addColor} />
            <button onClick={resetColors}>Reset Pattern</button>
            <button onClick={sendToWled} disabled={colors.length === 0}>Send to WLED</button> */}
        </>
    );
}

function Selector({ selectOptions, selectOption }) {
    useEffect(() => {
        console.log("checking list", selectOptions)
        // if (selectOptions.length > 0) {
        //     selectOption(selectOptions[0])
        // }
    }, [selectOptions])

    function handleChange(e) {
        console.log(selectOptions)
        console.log(e.target)
        console.log(selectOptions[e.target.value].value)
        selectOption(selectOptions[e.target.value].value)
    }
    
    return (
        <select onChange={handleChange}>
        {selectOptions.map((option, index) =>
            <option key={index} value={index}>{option.name}</option>
        )}
        </select>
    )
}


function ColorPicker({ setColor, color }) {
    const ref = useRef()
    const colorPicker = useRef()

    const [lastHue, setLastHue] = useState(0)

    useEffect(() => {
      const cp = (colorPicker.current = new iro.ColorPicker(ref.current, { color }))
    }, [])

    function handleClick() {
        let rgb = colorPicker.current.color.rgb
        setColor([rgb.r, rgb.g, rgb.b])
    }

    function pickColor(color) {
        if(color == "rnd"){
            color = {h: 0, s: Math.floor(50*Math.random()+50), v: 100};
            do {
                color.h = Math.floor(360*Math.random())
            } while (Math.abs(color.h-lastHue)<50);
            setLastHue(color.h);
        }
        setPicker(color);
    }

    function setPicker(color) {
        var t = new iro.Color(color);
        if (t.value > 0) {
            colorPicker.current.color.set(t)
         } else {
            colorPicker.current.color.setChannel("hsv","v",0)
         }
    }

    let defaultColors = [
        ["Red", "#ff0000"],
        ["Orange", "#ffa000"],
        ["Yellow", "#ffc800"],
        ["Warm White", "#ffe0a0"],
        ["White", "#ffffff"],
        ["Black", "#000000"],
        ["Pink", "#ff00ff"],
        ["Blue", "#0000ff"],
        ["Cyan", "#00ffc8"],
        ["Green", "#08ff00"]
    ]

    return (
        <>
            <div ref={ref} />
            <div id="qcs-w">
                {defaultColors.map(([name,hexString]) => (
                        <div key={name} className="qcs" onClick={() => pickColor(hexString)} title={name} style={{backgroundColor: hexString}}></div>
                ))}
                <div className="qcs" onClick={() => pickColor("rnd")} title="Random" style={{background: "linear-gradient(to right,red,orange,#ff0,green,#00f,purple)", transform:"translateY(-11px)"}}>R</div>
            </div>
            <button onClick={handleClick}>Select Color</button>
        </>
    );
}

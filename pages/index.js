import { useState } from 'react';
import Head from 'next/head';
import iro from '@jaames/iro'
import React, { useEffect, useRef } from 'react'
import { Color, Section, LedString, EffectList } from '../components/app'

export default function NewHotness() {
    const [chosenLedString, setChosenLedString] = useState();
    const [ledStrings, setLedStrings] = useState([
        new LedString("Whole String", [new Section("Main", 150, false, false)]),
        new LedString("Separate", [new Section("Porch", 10), new Section("Gutter", 97), new Section("Garage", 43)])
    ]);
    const [newLedStringText, setNewLedStringText] = useState('');

    const [numLeds, setNumLeds] = useState(0);
    useEffect(() => {
        fetch("api/wled")
            .then(res => res.json())
            .then(numLeds => {
                setNumLeds(numLeds);
                if (ledStrings.length == 0) {
                    let defaultLedString = new LedString("Whole String", [new Section("Main", numLeds, false, false)]);
                    setLedStrings([defaultLedString]);
                    setChosenLedString(defaultLedString);
                }
            });
        },
    []);

    function addNewLedString() {
        let [name, sectionString] = newLedStringText.split(" ");
        let sections = sectionString.split(",").map((x, i) => {
            let sectionPieces = x.split(":");
            if (sectionPieces.length == 1) {
                return new Section(i, parseInt(x), false, false);
            } else {
                return new Section(sectionPieces[0], parseInt(sectionPieces[1]));
            }
        });
        setLedStrings(oldLedStrings => [...oldLedStrings, new LedString(name, sections)]);
    }

    return (
        <>
            <Head>
                <title>WLED 2D</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <input value={newLedStringText} onChange={e => setNewLedStringText(e.target.value)}></input> <button onClick={addNewLedString}>Add LED String</button><br />

            <LedStringChooser ledStrings={ledStrings} setLedString={setChosenLedString} />
            {chosenLedString && <LedStringComponent ledString={chosenLedString} />}
        </>
    );
}

function LedStringChooser({ ledStrings, setLedString}) {
    function handleChange(e) {
        console.log('string chosen', ledStrings[e.target.value]);
        setLedString(ledStrings[e.target.value]);
    }
    
    return (
        <label>
            Led String:
            <select onChange={handleChange}>
            {ledStrings.map((ledString, index) =>
                <option key={index} value={index}>{ledString.name}</option>
            )}
            </select>
        </label>
    );
}

function LedStringComponent({ ledString }) {
    const [sections, setSections] = useState(ledString.sections);
    const [name, setName] = useState('');
    const [chosenSection, setChosenSection] = useState();

    useEffect(() => {
        setName(ledString.name);
        setSections(ledString.sections);
        setChosenSection(ledString.sections[0])
    }, [ledString]);

    function createWledObject() {
        let string = new LedString();
        string.setSections(sections);
        return string.render();
    }

    function sendToWled() {
        let payload = createWledObject();
        console.log('sending payload', payload);
        fetch('api/wled', {
            method: "POST",
            body: JSON.stringify(payload)
        })
        .then((res) => res.json())
        .then((data) => {
            console.log('response', data);
        });
    }

   
    function chooseSection(section) {
        setChosenSection(section);
    }

    return (
        <>
            <h1>{name}</h1>
            <SectionChooser sections={sections} setSection={chooseSection} />
            {chosenSection && <SectionComponent section={chosenSection} />}
            <button onClick={sendToWled}>Test</button>
        </>
    );
}

function SectionChooser({ sections, setSection }) {
    function handleChange(e) {
        console.log('section chosen', sections[e.target.value])
        setSection(sections[e.target.value])
    }
    
    return (
        <label>
            Section:
            <select onChange={handleChange}>
            {sections.map((section, index) =>
                <option key={index} value={index}>{section.name}</option>
            )}
            </select>
        </label>
    );
}
    
function SectionComponent({ section }) {
    const [pattern, setPattern] = useState();
    const [patternName, setPatternName] = useState();

    const [reversed, setReversed] = useState(section.reversed);
    const [mirrored, setMirrored] = useState(section.mirrored);

    useEffect(() => {
        if (!patternName) {
            setPattern2(undefined)
        }
        else if (!section.pattern || patternName !== section.pattern.constructor.name) {
            for (let i in EffectList) {
                if (EffectList[i].name === patternName) {
                    setPattern2(new EffectList[i]());
                    break;
                }
            }
        }
    }, [patternName]);

    useEffect(() => {
        setPattern(section.pattern);
        setPatternName(section.pattern?.constructor?.name ?? '');
        setReversed(section.reversed);
        setMirrored(section.mirrored);
    }, [section]);

    useEffect(() => {
        section.reversed = reversed;
    }, [reversed])

    useEffect(() => {
        section.mirrored = mirrored;
    }, [mirrored])

    function setPattern2(pattern) {
        section.setPattern(pattern);
        setPattern(pattern);
    }

    return (
        <>
            <h2>{section.name} ({section.length})</h2>
            <Checkbox labelText={"Reversed:"} isChecked={reversed} setIsChecked={setReversed} /><br />
            <Checkbox labelText={"Mirrored:"} isChecked={mirrored} setIsChecked={setMirrored} /><br/>
            <EffectChooser patternName={patternName} setPatternName={setPatternName} /><br />
            {pattern && <EffectComponent pattern={pattern} setPattern={setPattern2} />}
        </>
    );
}

function Checkbox({labelText, isChecked, setIsChecked}) {
    return (
        <>
            <label>
                {labelText}
                <input type="checkbox" checked={isChecked} onChange={() => setIsChecked(!isChecked)} />
            </label>
        </>
    );
}

function EffectChooser({ patternName, setPatternName }) {
    const patternNames = EffectList.reduce((map, pattern) => (map[pattern.name] = pattern.displayName, map), {});
    
    return (
        <label>
            Effect:
            <select onChange={e => setPatternName(e.target.value)} value={patternName}>
                <option value="" />
                {Object.entries(patternNames).map(([name, displayName], index) => <option key={index} value={name}>{displayName}</option>)}
            </select>
        </label>
    );
}

function EffectComponent({ pattern, setPattern }) {
    const [colors, setColors] = useState([]);

    useEffect(() => {
        setColors(pattern.colors);
    }, [pattern]);

    function setColors2(newColors) {
        pattern.setColors(newColors);
        setColors(pattern.colors);
    }

    return (
        <>
            <b>{pattern.displayName}</b><br />
            <ColorPicker setColors={setColors2} colors={colors} maxToPick={pattern.maxColors} />
        </>
    );
}

function ColorPicker({ colors, setColors, maxToPick }) {
    const ref = useRef();
    const colorPicker = useRef();

    const [lastHue, setLastHue] = useState(0);

    useEffect(() => {
      const cp = (colorPicker.current = new iro.ColorPicker(ref.current));
    }, []);

    function handleClick() {
        let rgb = colorPicker.current.color.rgb;
        setColors([...colors, new Color(rgb.r, rgb.g, rgb.b)]);
    }

    function pickColor(color) {
        if(color == "rnd"){
            color = {h: 0, s: Math.floor(50*Math.random()+50), v: 100};
            do {
                color.h = Math.floor(360*Math.random());
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
            colorPicker.current.color.setChannel("hsv","v",0);
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
    ];

    return (
        <>
            {colors.map((color) => (
                <div key={crypto.randomUUID()} style={{width: 30, height: 30, backgroundColor: color.hexString()}}></div>
            ))}
            <div ref={ref} />
            <div id="qcs-w">
                {defaultColors.map(([name,hexString]) => (
                        <div key={name} className="qcs" onClick={() => pickColor(hexString)} title={name} style={{backgroundColor: hexString}}></div>
                ))}
                <div className="qcs" onClick={() => pickColor("rnd")} title="Random" style={{background: "linear-gradient(to right,red,orange,#ff0,green,#00f,purple)", transform:"translateY(-11px)"}}>R</div>
            </div>
            <button onClick={handleClick} disabled={colors.length >= maxToPick}>Select Color</button>
            <button onClick={() => setColors([])}>Reset colors</button>
        </>
    );
}


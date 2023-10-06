import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useImmer } from 'use-immer';
import iro from '@jaames/iro'
import { EffectList } from '../components/app'
import ObjectChooser from '../components/chooser'


const defaultPreset = {id: -1, name: '', effectName: 'StaticPattern', colors: []};

export default function PresetEditor() {
    const [existingPresets, setExistingPresets] = useImmer([]);
    const [selectedPresetIndex, setSelectedPresetIndex] = useState(-1);
    const [selectedPreset, setSelectedPreset] = useImmer(defaultPreset);

    const effectNames = EffectList.map(effectClass => effectClass.displayName);
    const [selectedEffectIndex, setSelectedEffectIndex] = useState(0);

    const [tempColors, setTempColors] = useImmer([[]]);

    useEffect(loadPresetsFromDatabase, []);

    function loadPresetsFromDatabase() {
        fetch("api/effect")
            .then(res => res.json())
            .then(resultJson => {
                setExistingPresets(resultJson);
            });
    }
    
    useEffect(() => {
        let selectedPreset = defaultPreset;
        if (selectedPresetIndex > -1) {
            selectedPreset = existingPresets[selectedPresetIndex];
        }
        let effectIndex = EffectList.findIndex(x => x.name === selectedPreset.effectName)
        setSelectedEffectIndex(effectIndex);
        setSelectedPreset(selectedPreset);
        let tempColors = effectNames.map((x, i) => i === effectIndex ? selectedPreset.colors : [])
        setTempColors(tempColors);
    }, [selectedPresetIndex]);

    useEffect(() => {
        setSelectedPreset(draft => {
            draft.effectName = EffectList[selectedEffectIndex].name;
            draft.colors = tempColors[selectedEffectIndex];
        })
    }, [selectedEffectIndex]);

    useEffect(() => {
        setExistingPresets(draft => {
            if (selectedPresetIndex !== -1) {
                draft[selectedPresetIndex] = selectedPreset;
            }
        });
    }, [selectedPreset]);

    function setPresetName(name) {
        setSelectedPreset(draft => {
            draft.name = name;
        });
    }

    function setColors(colors) {
        setTempColors(draft => {
            draft[selectedEffectIndex] = colors;
        });
        setSelectedPreset(draft => {
            draft.colors = colors;
        });
    }

    function savePreset() {
        console.log('saving preset', selectedPreset);
        let req = null;
        if (selectedPreset.id === -1) {
            req = fetch('api/effect', {
                method: "POST",
                body: JSON.stringify(selectedPreset)
            });
        } else {
            req = fetch('api/effect/' + selectedPreset.id, {
                method: "PUT",
                body: JSON.stringify(selectedPreset)
            });
        }

        req.then((res) => res.json())
        .then((data) => {
            console.log('response', data, 'for id', selectedPreset.id);
            if (selectedPreset.id === -1) {
                console.log('adding it to the existing presets')
                setExistingPresets(draft => { draft.push(data) });
                setSelectedPresetIndex(existingPresets.length);
            }
            setSelectedPreset(data);
        });
    }

    function deletePreset() {
        fetch('api/effect/' + selectedPresetIndex, { method: "DELETE" })
        .then(loadPresetsFromDatabase);
    }

    function getMaxColors() {
        console.log('getting maxColors from', EffectList, 'at index', selectedEffectIndex);
        return EffectList[selectedEffectIndex].maxColors
    }

    return (
        <>
            <Head>
                <title>WLED 2D - Preset Editor</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <ObjectChooser selectedIndex={selectedPresetIndex} setSelectedIndex={setSelectedPresetIndex} choices={existingPresets.map(x => x.name)} defaultOption={"New Preset"} labelText={"Preset to edit"} /><br />
            <label>Preset name: <input value={selectedPreset.name} onChange={e => setPresetName(e.target.value)} /></label><br />
            <ObjectChooser selectedIndex={selectedEffectIndex} setSelectedIndex={setSelectedEffectIndex} choices={EffectList.map(x => x.displayName)} labelText={"Effect:"} /><br />
            <ColorPicker setColors={setColors} colors={tempColors[selectedEffectIndex]} maxToPick={getMaxColors} /><br />
            <button onClick={savePreset} disabled={!selectedPreset.name || selectedPreset.colors.length == 0}>Save Preset</button>
            <button onClick={deletePreset}>Delete</button>
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
        setColors([...colors, {red: rgb.r, green: rgb.g, blue: rgb.b}]);
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
                <div key={crypto.randomUUID()} style={{width: 30, height: 30, backgroundColor: "rgb("+color.red+", "+color.green+", "+color.blue+")"}}></div>
            ))}
            <div ref={ref} />
            <div id="qcs-w">
                {defaultColors.map(([name,hexString]) => (
                        <div key={name} className="qcs" onClick={() => pickColor(hexString)} title={name} style={{backgroundColor: hexString}}></div>
                ))}
                <div className="qcs" onClick={() => pickColor("rnd")} title="Random" style={{background: "linear-gradient(to right,red,orange,#ff0,green,#00f,purple)", transform:"translateY(-11px)"}}>R</div>
            </div>
            <button onClick={handleClick} disabled={colors.length >= maxToPick}>Add Color</button>
            <button onClick={() => setColors([])}>Reset Colors</button>
        </>
    );
}


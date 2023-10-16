import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useImmer } from 'use-immer';
import iro from '@jaames/iro'
import { VirtualEffectList, WledEffectPreset, Color } from '../components/app'
import ObjectChooser from '../components/chooser'


const defaultPreset = {id: -1, name: 'New Preset', effectId: 1000, colors: [], width: 1};

export default function PresetEditor() {
    const [existingPresets, setExistingPresets] = useImmer([]);
    const [workingCopyPresets, setWorkingCopyPresets] = useImmer([]);
    const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);

    const virtualEffectNames = VirtualEffectList.map(effectClass => effectClass.displayName);
    const [selectedEffectIndex, setSelectedEffectIndex] = useState(0);

    useEffect(loadPresetsFromDatabase, []);

    function loadPresetsFromDatabase() {
        fetch("api/effect")
            .then(res => res.json())
            .then(resultJson => {
                console.log('from db', resultJson);
                setExistingPresets(resultJson);
                setWorkingCopyPresets(resultJson);
                setSelectedPresetIndex(0);
            });
    }
    
    useEffect(() => {
        console.log('selectedPresetIndex changed', selectedPresetIndex);
        let selectedPreset = null;
        if (selectedPresetIndex < existingPresets.length) {
            selectedPreset = workingCopyPresets[selectedPresetIndex];

            console.log('selectedPreset found is', selectedPreset)
    
            let effectIndex = VirtualEffectList.findIndex(x => x.effectId === selectedPreset.effectId) ?? -1;
            console.log('index in the list for this effect is', effectIndex);
            setSelectedEffectIndex(effectIndex);
        }

    }, [selectedPresetIndex]);

    useEffect(() => {
        console.log("selectedEffectIndex changed", selectedEffectIndex);

        if (selectedEffectIndex == -1) {
            setWorkingCopyPresets(draft => {
                if (draft[selectedPresetIndex] && draft[selectedPresetIndex].effectId >= 1000) {
                    draft[selectedPresetIndex].effectId = -1;
                }
            });
        } else {
            let effectId = VirtualEffectList[selectedEffectIndex]?.effectId ?? -1;
            console.log("looked up effectId", effectId);
    
            setWorkingCopyPresets(draft => {
                if (draft[selectedPresetIndex]) {
                    draft[selectedPresetIndex].effectId = effectId;
                }
            });
        }
    }, [selectedEffectIndex]);

    useEffect(() => {
        console.log("working copy changed to", workingCopyPresets);
    }, [workingCopyPresets]);

    function setPresetName(name) {
        setWorkingCopyPresets(draft => {
            console.log('changing name at index', selectedPresetIndex);
            draft[selectedPresetIndex].name = name;
        });
    }

    function setColors(colors) {
        setWorkingCopyPresets(draft => {
            draft[selectedPresetIndex].colors = colors;
        })
    }

    function savePreset() {
        let selectedPreset = workingCopyPresets[selectedPresetIndex];
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

            setExistingPresets(draft => {
                draft[selectedPresetIndex] = data;
            });
        });
    }

    function deletePreset() {
        fetch('api/effect/' + existingPresets[selectedPresetIndex].id, { method: "DELETE" })
        .then(loadPresetsFromDatabase);
    }

    function addNewPreset() {
        setWorkingCopyPresets(draft => {
            draft.push(defaultPreset);
            setSelectedPresetIndex(draft.length-1);
        });
        setExistingPresets(draft => {
            draft.push(defaultPreset);
        });

    }

    function getMaxColors() {
        console.log('getting maxColors from', VirtualEffectList, 'at index', selectedEffectIndex);
        return VirtualEffectList[selectedEffectIndex].maxColors
    }

    function importFromWled() {
        fetch("api/wled/state")
            .then(res => res.json())
            .then(resultJson => {
                console.log('wled state', resultJson);
                let activeSegmentIndex = resultJson.seg.findIndex(x => x.sel == true);
                if (activeSegmentIndex == -1) {
                    activeSegmentIndex = resultJson.mainSeg;
                }

                let seg = resultJson.seg[activeSegmentIndex];

                let obj = new WledEffectPreset(workingCopyPresets[selectedPresetIndex].name, seg.fx, 1, seg.sx, seg.ix, seg.col.map(x => new Color(x[0], x[1], x[2])), seg.pal, seg.c1, seg.c2, seg.c3);
                obj.id = workingCopyPresets[selectedPresetIndex].id;

                console.log("obj built up", obj);

                setWorkingCopyPresets(draft => {
                    draft[selectedPresetIndex] = obj;
                });
            });
    }

    return (
        <>
            <Head>
                <title>WLED 2D - Preset Editor</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <button onClick={addNewPreset}>Create Preset</button>
            {workingCopyPresets.length > 0 && 
            <div>
                <ObjectChooser selectedIndex={selectedPresetIndex} setSelectedIndex={setSelectedPresetIndex} choices={existingPresets.map(x => x.name)} labelText={"Preset to edit"} /><br />
                <label>Preset name: <input value={workingCopyPresets[selectedPresetIndex].name} onChange={e => setPresetName(e.target.value)} /></label><br />
                <ObjectChooser selectedIndex={selectedEffectIndex} setSelectedIndex={setSelectedEffectIndex} choices={VirtualEffectList.map(x => x.displayName)} defaultOption={"WLED Effect Preset"} labelText={"Effect:"} /><br />
                {workingCopyPresets[selectedPresetIndex].colors.map((color,i) => (
                    <div key={i} style={{width: 30, height: 30, border:2, backgroundColor: "rgb("+color.red+", "+color.green+", "+color.blue+")"}}></div>
                ))}
                {selectedEffectIndex != -1 && <ColorPicker setColors={setColors} colors={workingCopyPresets[selectedPresetIndex].colors} maxToPick={getMaxColors} />}
                {selectedEffectIndex == -1 && <div>
                    <button onClick={importFromWled}>Import from WLED</button><br />
                    Effect ID: {workingCopyPresets[selectedPresetIndex].effectId}
                </div>}
                <br />
                <button onClick={savePreset} disabled={!workingCopyPresets[selectedPresetIndex].name || workingCopyPresets[selectedPresetIndex].colors.length == 0 || workingCopyPresets[selectedPresetIndex].effectId == -1}>Save Preset</button>
                <button onClick={deletePreset}>Delete</button>
            </div>
            }
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


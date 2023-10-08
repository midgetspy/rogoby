import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useImmer } from 'use-immer';
import ObjectChooser from '../components/chooser'

const defaultString = {name: '', sections: []};

export default function PresetEditor() {
    const [existingPresets, setExistingPresets] = useImmer([]);
    const [selectedStringIndex, setSelectedStringIndex] = useState(-1);
    const [selectedString, setSelectedString] = useImmer(defaultString);

    useEffect(loadPresetsFromDatabase, []);

    function loadPresetsFromDatabase() {
        fetch("api/sections")
            .then(res => res.json())
            .then(resultJson => {
                console.log('plain object', resultJson);
                setExistingPresets(resultJson);
            });
    }

    useEffect(() => {
        console.log('index chosen', selectedStringIndex)
        let selectedString = defaultString;
        if (selectedStringIndex > -1) {
            selectedString = existingPresets[selectedStringIndex];
        }
        console.log('selectedString set to', selectedString);
        setSelectedString(selectedString);
    }, [selectedStringIndex]);

    useEffect(() => {
        setExistingPresets(draft => {
            console.log("updating existing presets at index", selectedStringIndex);
            draft[selectedStringIndex] = selectedString;
        });
    }, [selectedString]);

    function saveString() {
        console.log("saving string", selectedString);

        let req = null
        if (selectedString.id !== undefined) {
            req = fetch("api/sections/" + selectedString.id, {
                method: 'PUT',
                body: JSON.stringify(selectedString)
            });
        } else {
            console.log("posting string");
            req = fetch("api/sections", {
                method: 'POST',
                body: JSON.stringify(selectedString)
            });
        }
        
        req.then(res => res.json())
        .then(data => {
            console.log('response', data);
            loadPresetsFromDatabase();
        });
    }

    function deleteString() {
        console.log('deleting with id', selectedString.id)
        fetch('api/sections/' + selectedString.id, { method: "DELETE" })
            .then(loadPresetsFromDatabase);
    }

    return (
        <>
            <Head>
                <title>WLED 2D - String Editor</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <ObjectChooser selectedIndex={selectedStringIndex} setSelectedIndex={setSelectedStringIndex} choices={existingPresets.map(x => x.name)} defaultOption={"New Preset"} labelText="Preset to edit:" /><br />
            <LedStringEditor string={selectedString} setString={setSelectedString} /><br />
            <button onClick={saveString}>Save</button>
            <button onClick={deleteString}>Delete</button>
        </>
    );
}

function LedStringEditor({ string, setString }) {

    function deleteSection(index) {
        setString(draft => {
            draft.sections.splice(index, 1);
        })
    }

    function addNewSection() {
        setString(draft => {
            draft.sections.push({name: 'New Section', length: 111, reversed: false, mirrored: false});
        });
    }

    function setSectionName(index, name) {
        setString(draft => {
            draft.sections[index].name = name;
        });
    }

    function setSectionLength(index, length) {
        setString(draft => {
            draft.sections[index].length = length;
        });
    }

    function setSectionReversed(index, reversed) {
        setString(draft => {
            draft.sections[index].reversed = !draft.sections[index].reversed
        });
    }

    function setSectionMirrored(index, mirrored) {
        setString(draft => {
            draft.sections[index].mirrored = !draft.sections[index].mirrored
        });
    }

    function handleNameChange(e) {
        setString(draft => {
            draft.name = e.target.value;
        });
    }

    return (
        <>
            <label>Name: <input value={string.name} onChange={handleNameChange} /></label><br />
            <li>
                {string && string.sections.map((x, i) => <ul key={i}>
                    <b>Section {i}</b><br />
                    <label>Name: <input value={x.name} onChange={e => setSectionName(i, e.target.value)} /></label><br />
                    <label>Length: <input value={x.length} onChange={e => setSectionLength(i, e.target.value)} /></label><br />
                    <label>Reversed: <input type="checkbox" checked={string.reversed} onChange={e => setSectionReversed(i, e)} /></label>
                    <label>Mirrored: <input type="checkbox" checked={string.mirrored} onChange={e => setSectionMirrored(i, e.target.value === 'on')} /></label>
                    <button onClick={() => deleteSection(i)}>Delete</button>
                </ul>)}
            </li>
            <button onClick={addNewSection}>Add new section</button>
        </>
    );
}

function SectionEditor({ section }) {
    const [selectedSectionId, setSelectedSectionId] = useState();

    return (
        <>
            <ul key={x.id}>
                <input value={x.name} onChange={e => setSectionName(x.id, e.target.value)} />
                ({x.length})
                <button onClick={() => deleteSection(x.id)}>Delete</button>
            </ul>
        </>
    )
}
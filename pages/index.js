import { useState } from 'react';
import { useImmer } from 'use-immer';
import Head from 'next/head';
import React, { useEffect } from 'react'
import ObjectChooser from '../components/chooser'

export default function Homepage() {
    const [sectionPresets, setSectionPresets] = useImmer([]);
    const [selectedSectionIndex, setSelectedSectionIndex] = useState();
    const [effectPresets, setEffectPresets] = useState([]);
    const [selectedEffectIndex, setSelectedEffectIndex] = useState();

    useEffect(() => {
        fetch("api/sections")
            .then(res => res.json())
            .then(presets => {
                setSectionPresets(presets);
                setSelectedSectionIndex(0);

                fetch("api/effect")
                    .then(res => res.json())
                    .then(effectPresets => {
                        setEffectPresets(effectPresets);
                        setSelectedEffectIndex(0);
                        for (let i in presets) {
                            for (let j in presets[i].sections)
                            presets[i].sections[j].effectPresetId = effectPresets[0].id;
                        }
                    });    
            });
    }, []);

    function setEffectByIndex(sectionIndex, effectIndex) {
        console.log('setting effect for section at index', sectionIndex, 'to effect index', effectIndex, 'in', sectionPresets);
        let effectPresetId = effectPresets[effectIndex].id;
        setSectionPresets(draft => {
            draft[selectedSectionIndex].sections[sectionIndex].effectPresetId = effectPresetId;
        });
    }

    function sendToWled() {
        console.log("Sending to WLED", sectionPresets[selectedSectionIndex]);

        fetch('api/wled/state', {
            method: "POST",
            body: JSON.stringify(sectionPresets[selectedSectionIndex])
        })
            .then((res) => res.json())
            .then((data) => {
                console.log('response', data);
            });
    }

    return (
        <>
            <Head>
                <title>WLED 2D</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <a href="effects">Edit effect presets</a> | <a href="sections">Edit section presets</a><br />

            <ObjectChooser selectedIndex={selectedSectionIndex} setSelectedIndex={setSelectedSectionIndex} choices={sectionPresets.map(x => x.name)} labelText="Sections:" /><br />
            {sectionPresets[selectedSectionIndex] && sectionPresets[selectedSectionIndex].sections.map((x, i) => 
                <div key={i} >
                    <ObjectChooser selectedIndex={sectionPresets[selectedSectionIndex].sections.effectPresetId} setSelectedIndex={j => setEffectByIndex(i, j)} choices={effectPresets.map(x => x.name)} labelText={x.name + ":"} /><br />
                </div>
            )}
            <button onClick={sendToWled}>Apply to WLED</button>

        </>
    );
}

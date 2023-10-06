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
                for (let i in presets) {
                    for (let j in presets[i].sections)
                    presets[i].sections[j].effectId = 0;
                }
                setSectionPresets(presets);
                setSelectedSectionIndex(0);
            });
        fetch("api/effect")
            .then(res => res.json())
            .then(presets => {
                setEffectPresets(presets);
                setSelectedEffectIndex(0);
            });
    }, []);

    function setEffectByIndex(sectionIndex, effectIndex) {
        console.log('setting effect for section at index', sectionIndex, 'to effect index', effectIndex, 'in', sectionPresets);
        let effectId = effectPresets[effectIndex].id;
        setSectionPresets(draft => {
            draft[selectedSectionIndex].sections[sectionIndex].effectId = effectId;
        });
    }

    function sendToWled() {
        console.log("build request from", sectionPresets[selectedSectionIndex])
        let objToSend = sectionPresets[selectedSectionIndex].sections.map(x => ({
            id: x.id,
            effectId: x.effectId
        }));
        console.log("Sending to WLED", objToSend);
    }

    return (
        <>
            <Head>
                <title>WLED 2D</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <ObjectChooser selectedIndex={selectedSectionIndex} setSelectedIndex={setSelectedSectionIndex} choices={sectionPresets.map(x => x.name)} labelText="Sections:" /><br />
            {sectionPresets[selectedSectionIndex] && sectionPresets[selectedSectionIndex].sections.map((x, i) => 
                <div key={i} >
                    <ObjectChooser selectedIndex={sectionPresets[selectedSectionIndex].sections.effectId} setSelectedIndex={j => setEffectByIndex(i, j)} choices={effectPresets.map(x => x.name)} labelText={x.name + ":"} /><br />
                </div>
            )}
            <button onClick={sendToWled}>Apply to WLED</button>

        </>
    );
}

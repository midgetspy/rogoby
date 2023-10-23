import { Database } from "../../../components/db";
import { Section, LedString, EffectList, VirtualEffectList, WledEffectPreset } from "../../../components/app";

const db = new Database();

export default async function handler(req, res) {
    if (req.method === 'GET') {
        fetch("http://"+process.env.WLED_IP+"/json/state")
            .then(res => res.json())
            .then(json => res.status(200).json(json));
    } else if (req.method === 'POST') {

        let stateRequest = JSON.parse(req.body);
        console.log('stateRequest', stateRequest);

        let sections = await Promise.all(stateRequest.sections.map(async x => {
            let section = new Section(x.name, x.length, x.reversed, x.mirrored);
            console.log('x is', x);
            let effect = await db.getEffectPreset(x.effectPresetId);
            let virtualEffect = VirtualEffectList.find(x => x.effectId == effect.effectId);
            if (virtualEffect) {
                let effectPreset = new virtualEffect(effect.presetName, effect.width ?? 1, effect.colors);
                console.log('made virtual effect', effectPreset);
                section.setEffect(effectPreset);
            } else {
                let effectPreset = new WledEffectPreset(effect.presetName, effect.effectId, effect.width, effect.speed, effect.intensity, effect.colors, effect.paletteId, effect.custom1, effect.custom2, effect.custom3);
                console.log('made wled effect', effectPreset);
                section.setEffect(effectPreset);
            }
            return section;
        }));

        let ledString = new LedString(stateRequest.name);
        ledString.setSections(sections);

        console.log('full object', ledString);

        let renderedString = ledString.render();

        console.log("Sending the following JSON to WLED:", JSON.stringify(renderedString, null, 3));

        fetch("http://"+process.env.WLED_IP+"/json/state", {
            method: "POST",
            body: JSON.stringify(renderedString)
        })
            .then(res => res.json())
            .then(json => res.status(200).json(json));

        return res.status(200).json('ok');
    } else {
        res.status(405).send({ message: 'Only POST/GET requests allowed' })
        return
    }
}

import { Database } from "../../../components/db";
import { Section, LedString, EffectList } from "../../../components/app";

const db = new Database();

export default async function handler(req, res) {
    if (req.method === 'POST') {

        let stateRequest = JSON.parse(req.body);
        console.log('stateRequest', stateRequest);

        let sections = await Promise.all(stateRequest.sections.map(async x => {
            let section = new Section(x.name, x.length, x.reversed, x.mirrored);
            let effect = await db.getEffectPreset(x.effectId);
            let effectObj = new (EffectList.find(x => x.name === effect.effectName))();
            effectObj.setColors(effect.colors);
            section.setEffect(effectObj);
            return section;
        }));

        let ledString = new LedString(stateRequest.name);
        ledString.setSections(sections);

        console.log('full object', ledString);

        let renderedString = ledString.render();

        console.log("Sending the following JSON to WLED:", JSON.stringify(renderedString, null, 3));

        // fetch("http://"+process.env.WLED_IP+"/json/state", {
        //     method: "POST",
        //     body: req.body
        // })
        //     .then(res => res.json())
        //     .then(json => res.status(200).json(json));

        return res.status(200).json('ok');
    } else {
        res.status(405).send({ message: 'Only POST/GET requests allowed' })
        return
    }
}

import { Database } from "../../../components/db";
import { StaticPattern, ColorwavePattern, Color, WledEffectPreset } from "../../../components/app";

const db = new Database()

const staticData = [
    new ColorwavePattern("RGB", 1, [Color.Red, Color.Green, Color.Blue]),
    new WledEffectPreset("Some preset", 57, 1, 128, 128, [Color.Blue, Color.Red, Color.Black], 0, 0, 0, 0),
]

export default async function handler(req, res) {
    const { id } = req.query;
    console.log(req.method, id);

    if (req.method === 'GET') {
        if (id === undefined) {
            let presets = await db.getEffectPresets();
            res.status(200).json(presets);
        } else {
            let preset = await db.getEffectPreset(id);
            console.log('got preset for id', id, preset)
            if (preset) {
                res.status(200).json(preset);
            } else {
                res.status(404).json("not found");
            }
        }
        return;
    } else if (req.method === 'POST') {
        if (id !== undefined) {
            res.status(400).send({ message: 'id cannot be sent for POST requests'});
            return;
        }
        console.log("body", req.body);
        let obj = JSON.parse(req.body);
        console.log("obj", obj);
        let presetId = await db.createEffectPreset(obj);
        res.status(200).json(presetId);
    } else if (req.method === 'PUT') {
        if (id === undefined) {
            res.status(400).send({ message: 'Must specify an id when using PUT'});
            return;
        }
        let obj = JSON.parse(req.body)
        console.log('updating row with id', id, req.body, obj);
        let result = await db.updateEffectPreset(obj);
        res.status(200).json(result);
    } else if (req.method === 'DELETE') {
        if (id === undefined) {
            res.status(400).send({ message: 'Must specify an id when using DELETE'});
            return;
        }
        let result = await db.deleteEffectPreset(id);
        res.status(result ? 200 : 404).json('');
    } else {
        res.status(405).send({ message: 'Unsupported HTTP verb' })
        return
    }
}

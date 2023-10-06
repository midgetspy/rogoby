import { EffectPresetRow } from "../../../components/db";
import { Color } from "../../../components/app";

export default function handler(req, res) {
    const { id } = req.query;
    console.log(req.method, id);

    if (req.method === 'GET') {
        let storedEffects = [
            new EffectPresetRow(0, "Off", "StaticPattern", [Color.Black]),
            new EffectPresetRow(1, "RGBY", "StaticPattern", [Color.Red, Color.Green, Color.Blue, Color.Yellow]),
            new EffectPresetRow(2, "WGWR", "ColorwavePattern", [Color.White, Color.Green, Color.White, Color.Red]),
        ];
        res.status(200).json(storedEffects);
    } else if (req.method === 'POST') {
        if (id !== undefined) {
            res.status(400).send({ message: 'id cannot be sent for POST requests'});
            return;
        }
        let obj = JSON.parse(req.body);
        obj.id = 123;
        console.log("adding new row", req.body);
        res.status(200).json(obj);
    } else if (req.method === 'PUT') {
        if (id === undefined) {
            res.status(400).send({ message: 'Must specify an id when using PUT'});
            return;
        }
        let obj = JSON.parse(req.body)
        console.log('updating row with id', id, req.body, obj);
        res.status(200).json(obj);
    } else if (req.method === 'DELETE') {
        if (id === undefined) {
            res.status(400).send({ message: 'Must specify an id when using DELETE'});
            return;
        }
        console.log('deleting row with id', id);
        res.status(id == 1 ? 200 : 400).json('success');
    } else {
        res.status(405).send({ message: 'Unsupported HTTP verb' })
        return
    }
}

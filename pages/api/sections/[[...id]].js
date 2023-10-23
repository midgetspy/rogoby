import { Database } from "../../../components/db";

const db = new Database()

export default async function handler(req, res) {
    const { id } = req.query;
    console.log(req.method, id);

    if (req.method === 'GET') {
        if (id === undefined) {
            let presets = await db.getPresets();
            res.status(200).json(presets);
        } else {
            let preset = await db.getPreset(id);
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
        console.log("adding new row", req.body);
        let presetId = await db.createPreset(JSON.parse(req.body));
        res.status(200).json(presetId);
    } else if (req.method === 'PUT') {
        if (id === undefined) {
            res.status(400).send({ message: 'Must specify an id when using PUT'});
            return;
        }
        console.log('updating row with id', id, req.body);
        let presetId = await db.updatePreset(JSON.parse(req.body));
        res.status(200).json(presetId);
    } else if (req.method === 'DELETE') {
        if (id === undefined) {
            res.status(400).send({ message: 'Must specify an id when using DELETE'});
            return;
        }
        console.log('deleting row with id', id);

        let result = await db.deletePreset(id);
        res.status(result ? 200 : 404).json('');
    } else {
        res.status(405).send({ message: 'Unsupported HTTP verb' })
        return
    }
}

import { SectionRow, SectionConfiguration } from "../../../components/db";

const allSeparate = new SectionConfiguration(1, "All separate", [
    new SectionRow(1, "Porch", 10, false, false),
    new SectionRow(2, "Soffit", 97, false, false),
    new SectionRow(3, "Garage", 43, true, true),
]);

const allTogether = new SectionConfiguration(2, "Whole house", [
    new SectionRow(4, "Whole House", 150, false, false)
]);

const presets = [allSeparate, allTogether];

export default function handler(req, res) {
    const { id } = req.query;
    console.log(req.method, id);

    if (req.method === 'GET') {
        if (id === undefined) {
            res.status(200).json(presets);
        } else {
            console.log('looking up preset', id);
            let result = presets.find(x => x.id == id);
            if (result) {
                res.status(200).json(result);
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
        res.status(200).json('success');
    } else if (req.method === 'PUT') {
        if (id === undefined) {
            res.status(400).send({ message: 'Must specify an id when using PUT'});
            return;
        }
        console.log('updating row with id', id, req.body);
        res.status(200).json('success');
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

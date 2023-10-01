export default function handler(req, res) {
    if (req.method === 'GET') {
        fetch("http://"+process.env.WLED_IP+"/json/info")
            .then(res => res.json())
            .then(json => res.status(200).json(json.leds.count));
    } else if (req.method === 'POST') {
        console.log("Sending the following JSON to WLED:", req.body)

        fetch("http://"+process.env.WLED_IP+"/json/state", {
            method: "POST",
            body: req.body
        })
            .then(res => res.json())
            .then(json => res.status(200).json(json));
    } else {
        res.status(405).send({ message: 'Only POST/GET requests allowed' })
        return
    }
}

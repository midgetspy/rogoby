export default function handler(req, res) {
    if (req.method === 'GET') {
        fetch("http://"+process.env.WLED_IP+"/json/info")
            .then(res => res.json())
            .then(json => res.status(200).json(json.leds.count));
    } else {
        res.status(405).send({ message: 'Unsupported method ' + req.method })
        return
    }
}

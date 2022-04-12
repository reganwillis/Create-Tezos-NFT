const backend = require('./backend.js');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(cors({origin: 'http://localhost:9000', optionsSuccessStatus: 200}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var NFT_name = "test";
var NFT_description = "test";
var NFT_image = "../images/test_NFT.jpg";
var attributes = {};

// home page
app.get('/', (req, res) => res.send("You are at Create Tezos NFT backend!"));

// pin data to IPFS
app.get('/pinToIPFSWithPinata', async (req, res) => {

    let pinata = await backend.connectToPinata().then((result) => {
        return result;
    }).catch((err) => {
        res.send("ERROR: connectToPinata() failed: " + err + '\n');
    });

    await backend.pinToIPFSWithPinata(pinata, NFT_name, NFT_description, NFT_image, attributes).then((result) => {
        res.send(result);
    }).catch((err) => {
        res.send("ERROR: pinToIPFSWithPinata() failed: " + err + '\n');
    });
});

// get data for IPFS
app.post('/sendNFTDataToServer', async (req, res) => {
    NFT_name = req.body.data.NFT_name;
    NFT_description = req.body.data.NFT_description;
    NFT_image = req.body.data.NFT_image;
    attributes = req.body.data.attributes;
    res.send('success');
});

app.listen(
    port,
    () => console.log('app listening at http://localhost:' + port)
);
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');

// connect to pinata
async function connectToPinata() {
    // get api keys from file
    let pinata_keys_raw = fs.readFileSync('../secret.json');
    let pinata_keys = JSON.parse(pinata_keys_raw);
    const pinata_api_key = (pinata_keys.pinata.key);
    const pinata_secret_api_key = (pinata_keys.pinata.secret);
    
    try {
        let pinata = pinataSDK(pinata_api_key, pinata_secret_api_key); // pinata instance

        let ret = await pinata.testAuthentication().then((result) => {
            return pinata;  // if authentication passes return the pinata instance
        }).catch((err) => {
            throw new Error('Pinata authentication failed.');
        });

        return ret;

    } catch(err) {
        throw new Error("Pinata API key or secret API key not provided.");
    };
}

/**
 * Send image to pinata, then send image metadata to pinata.
 * @param {*} pinata 
 * @param {string} NFT_name - name of NFT to add to IPFS
 * @param {string} NFT_description - description of NFT to add to IPFS
 * @param {string} NFT_image - NFT image to add to IPFS
 * @returns {string} - IPFS hash of pinned JSON metadata to be added to smart contract NFT metadata
 */
async function pinToIPFSWithPinata(pinata, NFT_name, NFT_description, NFT_image, attributes_json) {

    // send file to pinata
    const options = {
        pinataMetadata: {
            name: NFT_name,
            keyvalues: {
                description: NFT_description
            }
        },
        pinataOptions: {
            cidVersion: 0
        }
    }
    const read = fs.createReadStream(NFT_image);
    const pinned = await pinata.pinFileToIPFS(read, options).then((result) => {
        return result;
    }).catch((err) => {
        throw new Error("Pinning data to IPFS failed: " + err);
    });

    // create metadata about file pinned to pinata
    const body = {
        name: NFT_name,
        description: NFT_description,
        artifactUri: `ipfs://${pinned.IpfsHash}`,
        attributes: attributes_json
    };

    // pin metadata to pinata and return to be added to smart contract
    const pinnedJSON = await pinata.pinJSONToIPFS(body, options).then((result) => {
        return result;
    }).catch((err) => {
        throw new Error("Pinning metadata to IPFS failed: " + err);
    });

    return pinnedJSON;
}

module.exports = {connectToPinata, pinToIPFSWithPinata};
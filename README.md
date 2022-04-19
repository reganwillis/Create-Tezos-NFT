# Create-Tezos-NFT
Dapp with smart contract to mint an NFT to the Tezos blockchain or transfer it to another account.

## Usage
This repository is designed to be used in the [Little Flower repository](https://github.com/reganwillis/Little-Flower). When the mint button is pressed (and the player chooses yes) a browser will open at the [frontend local server address](http://localhost:9000/). Because the dapp is only hosted locally, the user will need to start their own backend and frontend server for the dapp to work.

In command prompt navigate to the top folder and run `npm install`.

### Backend - Node
In the command promt navigate to `./backend` and run `node index.js`. Hosted at http://localhost:3000/.

### Frontend - Webpack
In the command prompt navigate to the top folder and run commands:

    npm run build
    npx webpack serve
Hosted at http://localhost:9000/.

### Use Dapp
Create [Pinata API keys](https://app.pinata.cloud/keys) and add them to a new file `./secret.json` with the structure:
{
    "pinata" : {
        "key" : "<API key>",
        "secret" : "<API secret>",
    }
}

At the [frontend](http://localhost:9000/) connect a wallet (WARNING: recommend using Kukai wallet because that is the only one that has been tested) and approve the transaction in the [Kukai app](https://hangzhounet.kukai.app/), making sure to only use Hangzhounet. View the browser console to see a link to the transaction on the blockchain.

### Use Without Little Flower
Little Flower adds an image and attributes file to the `./dist` folder that are used to create the NFT. To run this dapp outside of the Little Flower game, add an image called `little-flower-nft.jpg` and a text file called `attributes.txt` to `./dist`. The text file should be in JSON format. See the [Create Flower README](https://github.com/reganwillis/Create-Flower/tree/v1.0.0#independent-usage) for the format Little Flower follows.

## Smart Contract
The LIGO smart contract code is at `./contracts/fa2_contract.mligo`. It's entrypoints are Mint and Transfer. It has currently only been deployed to Hangzhounet.
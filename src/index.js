// frontend

import { MichelsonMap, TezosToolkit } from "@taquito/taquito";
import { char2Bytes } from "@taquito/utils"
import { BeaconWallet } from "@taquito/beacon-wallet";
import { NetworkType, ColorMode } from "@airgap/beacon-sdk";

// setup wallet
const Tezos = new TezosToolkit("https://hangzhounet.api.tez.ie");
const beacon = new BeaconWallet({ name: "Tezos Blockchain NFT", preferredNetwork: NetworkType.HANGZHOUNET, });
const contract_id = "KT1XbmU47Hyw47Tq4LShdYAKa6GMuB3fmNcQ";

Tezos.setWalletProvider(beacon);
beacon.client.setColorMode(ColorMode.DARK);

var connected_account;
connectWallet();

// hide success displays
document.getElementById("transfer-hidden").style.display = 'none';

// button functionality
document.getElementById("connect-wallet").onclick = connectWallet;
document.getElementById("disconnect-wallet").onclick = disconnectWallet;
document.getElementById("mint-nft").onclick = mintNFT;
document.getElementById("transfer-nft").onclick = transferNFT;

/**
 * Connect user wallet if none is already connected.
 * Called on page load and when connect-wallet button clicked.
 */
async function connectWallet() {
  // check if wallet already connected
  const active_account = await beacon.client.getActiveAccount();

  if (active_account) {
    connected_account = active_account;
    console.log("Wallet already connected: ", connected_account.address);
  } else {

    // connect to wallet
    try {
      console.log("Connecting to wallet...");
      connected_account = await beacon.client.requestPermissions({network: {type: 'hangzhounet'}});
      console.log("New wallet connected: :", connected_account.address);
    } catch (err) {
      console.log("ERROR: Unable to connect to wallet: ", err);
    }
  }
};

/**
 * Disconnect user wallet.
 * If there is no wallet connected nothing will change.
 * Called when disconnect-wallet button clicked.
 */
async function disconnectWallet() {
  console.log("Disconnecting wallet...");
  await beacon.clearActiveAccount();
  console.log("Wallet disconnected. No active wallet.");
};

/**
 * Call the backend server to send NFT data and pin that data to IPFS.
 * @param {string} nft_name - name of NFT to send to server
 * @param {string} nft_description - description of NFT to send to server
 * @param {string} nft_image - NFT image to send to server
 * @param {JSON} attributes_json - attributes of NFT to send to server
 * @returns {string} - IPFS hash of pinned JSON metadata to be added to smart contract NFT metadata
 */
async function getIPFSLink(nft_name, nft_description, nft_image, attributes_json) {
  // send data to backend
  const data = {NFT_name: nft_name, NFT_description: nft_description, NFT_image: nft_image, attributes: attributes_json};

  await fetch('http://localhost:3000/sendNFTDataToServer', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({data})
  }).then((result) => {
    return result.status;
  }).catch((err) => {
    throw new Error('Unable to send NFT data to backend: ' + err);
  });

  // fetch promise from backend
  let promise = await fetch('http://localhost:3000/pinToIPFSWithPinata').then((result) => {
    return result;
  }).catch((err) => {
    throw new Error('Unable to fetch IPFS link from backend: ' + err);
  });

  // unpack promise
  let ret = await promise.text().then((result) => {
    return result;
  }).catch((err) => {
    throw new Error('Unable to get text of IPFS link:' + err);
  });

  return ret;
}

/**
 * Call smart contract Mint entrypoint.
 */
async function mintNFT() {
  // first check that wallet has been connected (if not, connect)
  connectWallet();

  console.log("Minting NFT on the Tezos blockchain...");
  const user = "Temp User";  // TODO: get name from user
  const nft_title = "Little Flower Grown by " + user;
  const nft_description = "Minted from the Little Flower game. https://twitter.com/regrowgames";
  const nft_image = '../dist/little-flower-nft.jpg';

  // get nft image metadata
  const promise = await fetch("attributes.txt").then((response) => {return response}).catch((err) => {throw new Error("Unable to fetch attributes.txt: " + err)});
  const attributes_text = await promise.text().then((result) => {return result}).catch((err) => {throw new Error('Error unpacking attributes: ' + err)});
  const attributes_json = JSON.parse(attributes_text);

  // get pinata metadata to send to smart contract
  const IPFS_link = await getIPFSLink(nft_title, nft_description, nft_image, attributes_json).then((res) => {
    let IPFS_hash = JSON.parse(res).IpfsHash;
    let IPFS_link = "ipfs://" + IPFS_hash;
    return IPFS_link;
  });

  // TODO: display link to image to user (or just display image)
  console.log("NFT uploaded to IPFS: ", IPFS_link);

  // connect to smart contract and call mint method
  const ret = await Tezos.wallet.at(contract_id).then((result) => {
    console.log(`Available contract methods: ${Object.keys(result.methods)}\n`)
    const metadata = new MichelsonMap();
    metadata.set("", char2Bytes(""));
    metadata.set("name", char2Bytes(nft_title));
    metadata.set("symbol", char2Bytes("XTZ"));
    metadata.set("decimals", char2Bytes("0n"));
    metadata.set("description", char2Bytes(nft_description));
    metadata.set("IPFS Link", char2Bytes(IPFS_link));
    return result.methods.mint(connected_account.address, metadata).send();
  });

  // TODO: display block explorer link to user
  console.log('View operation on block explorer: https://hangzhounet.tzkt.io/' + ret.opHash);
}

/**
 * Call smart contract transfer entrypoint.
 * TODO: consolidate similar aspects between mintNFT and transferNFT
 */
async function transferNFT() {
  // first check that wallet has been connected (if not, connect)
  connectWallet();

  // get NFT ID and wallet to transfer it to
  const transfer_to = document.getElementById('address').value;
  const transfer_id = document.getElementById('nft-id').value;

  // check that input is not empty
  try {
    console.log("Transfering NFT "+transfer_id+" to "+transfer_to+"...");

    // connect to smart contract and call mint method
    const ret = await Tezos.wallet.at(contract_id).then((result) => {
      console.log(`Available contract methods: ${Object.keys(result.methods)}\n`)
      const transfer_input = [
        {
          to_: transfer_to,
          token_id: transfer_id
        }
      ]
      // call contract transfer function
      return result.methods.transfer(connected_account.address, transfer_input).send();
    });

    // success - display block explorer link to user
    var link = document.createElement('a');
    var link_text = document.createTextNode('View operation on block explorer');
    link.appendChild(link_text);
    link.href = 'https://hangzhounet.tzkt.io/' + ret.opHash;
    document.getElementById('transfer-success').appendChild(link);
    document.getElementById("transfer-hidden").style.display = 'block';
    console.log('View operation on block explorer: https://hangzhounet.tzkt.io/' + ret.opHash);
  } catch (err) {
    alert("ERROR: Unable to transfer NFT, ensure inputs are correct.");
    throw new Error("Error with transfer function: ", err);
  }
}
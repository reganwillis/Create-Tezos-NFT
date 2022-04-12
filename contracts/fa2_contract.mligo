(*
    FA2 smart contract for minting an NFT to the Tezos blockchain.
    TZIP-012 FA2 ERC-721 standards: contains mint and transfer entrypoints, does not contain balance_of or update_operators.
    Using PascalLIGO syntax.
    Written by Regan Willis.
*)

(*
    ~ NFT Metadata ~
    map [
        "" -> Bytes.pack("");
        "name" -> Bytes.pack("Init NFT");
        "symbol" -> Bytes.pack("XTZ");
        "decimals" -> Bytes.pack("0n");
        "description" -> Bytes.pack("NFT description");
        "IPFS link" -> Bytes.pack("")
    ]

    ~ Contract Metadata ~
    contract_metadata = map [
        "name" -> Bytes.pack("Little Flower NFT Contract");
        "author" -> Bytes.pack("Regan Willis")
    ]

    ~ Origination Storage ~
    record [
        ledger = big_map [(0n) -> ("tz1gvYATcrCe36vGMpwPBKDfwW1Q2ePQgRUr" : address)];
        token_metadata = big_map[(0n) -> (map [
            "" -> Bytes.pack("");
            "name" -> Bytes.pack("Init NFT");
            "symbol" -> Bytes.pack("XTZ");
            "decimals" -> Bytes.pack("0n");
            "description" -> Bytes.pack("NFT description");
            "IPFS link" -> Bytes.pack("")
        ])];
        nft_id = 1n;
        nft_metadata = map [
            "" -> Bytes.pack("");
            "name" -> Bytes.pack("Init NFT");
            "symbol" -> Bytes.pack("XTZ");
            "decimals" -> Bytes.pack("0n");
            "description" -> Bytes.pack("NFT description");
            "IPFS link" -> Bytes.pack("")
        ];
        contract_metadata = map [
            "name" -> Bytes.pack("Little Flower NFT Contract");
            "author" -> Bytes.pack("Regan Willis")
        ]
    ]
*)

// contract storage
type ledger_table is big_map (nat, address)
type metadata is map (string, bytes)
type token_metadata_table is big_map (nat, metadata)

// define custom types
type transfer_destination is record [to_ : address; token_id : nat;]

// entry points, storage, and return types
type entry_points is
    Mint of address * metadata
|   Transfer of address * list (transfer_destination)
type storage is
    record [
        ledger : ledger_table;  // associates NFT IDs with their owner
        token_metadata : token_metadata_table;  // associates NFT IDs with their metadata
        nft_id : nat;  // holds the id of the next nft_id
        nft_metadata: metadata;  // metadata of current nft
        contract_metadata: metadata  // stores metadata associated with the contract
    ]
type return is list (operation) * storage

(*
    Map an NFT owner to the NFT ID in the ledger.
    params :
        * ledger_table curr_ledger - copy of ledger that will be updated and returned
        * nat id - id of the NFT that is being added to ledger
        * address owner - owner of the NFT that is being added to ledger
    returns :
        * ledger_table curr_ledger - updated ledger
*)
function addToLedger (var curr_ledger : ledger_table; var id : nat; var owner : address) : ledger_table is {
    curr_ledger [(id)] := owner
} with curr_ledger

(*
    Map an NFT ID to the NFT metadata in the token_metadata.
    params :
        * token_metadata_table curr_token_metadata - copy of token_metadata that will be updated and returned
        * nat id - id of the NFT that is being added to token_metadata
        * string curr_metadata - metadata of the NFT that is being added to token_metadata
    returns :
        * token_metadata_table curr_token_metadata - updated token_metadata

*)
function addToTokenMetadata (var curr_token_metadata : token_metadata_table; var id : nat; var curr_metadata : metadata) : token_metadata_table is {
    curr_token_metadata [(id)] := curr_metadata
} with curr_token_metadata

(*
    Updates ledger to assign a new owner to an NFT ID.
    params  :
        * ledger_table curr_ledger - copy of the ledger that will be updated
        * nat id - id of the NFT thats owner is being updated
        * address owner - new owner of id
    returns :
        * ledger_table updated_ledger - updated ledger
*)
function updateLedger (var curr_ledger : ledger_table; var id : nat; var owner : address) : ledger_table is {
    const updated_ledger : ledger_table = Big_map.update(id, Some(owner), curr_ledger);
} with updated_ledger

(*
    Entrypoint for minting NFTs.
    params :
        * address * string input -
            owner to mint NFT to
            metadata to be stored with the NFT
        * storage store - storage to pull NFT metadata from
    returns :
        * return (unnamed) - pair made of a list of operations and an updated storage variable
*)
function mint (const input : address * metadata; const store : storage) : return is {
    const new_nft_id = store.nft_id + 1n;  // create new NFT ID for next NFT
} with ((nil : list (operation)), store with record [
    ledger = addToLedger(store.ledger, store.nft_id, input.0);
    token_metadata = addToTokenMetadata(store.token_metadata, store.nft_id, input.1);
    nft_id = new_nft_id;
    nft_metadata = input.1;
    contract_metadata = store.contract_metadata])

(*
    Entrypoint for transfering NFTs.
    params  :
    * address * list (transfer_destination) input -
        owner of NFTs in transfer list
        list of NFT IDs and what address to send them to
    * storage store - storage to access and update ledger
*)
function transfer (const input : address * list (transfer_destination); const store : storage) : return is {

    // check validity on transfer batch
    function iter_op (const l : list (transfer_destination)) : unit is {
        function iterated (const destination : transfer_destination) : unit is {

            // return address of token owner or fail if doesn't exist
            function address_of_token_owner (const o : option (address)) : address is
                case o of [
                |   Some(o) -> o
                |   None -> failwith("FA2_TOKEN_UNDEFINED")
                ];
            
            const token_owner : option (address) = store.ledger [(destination.token_id)];
            const token_owner_address : address = address_of_token_owner(token_owner);
            if token_owner_address =/= input.0 then failwith ("FA2_INSUFFICIENT_BALANCE");
        } with unit;
    } with List.iter(iterated, l);
    iter_op (input.1);

    // transfer tokens in transfer batch
    var new_ledger : ledger_table := store.ledger;
    for destination in list input.1 {
        new_ledger := updateLedger(new_ledger, destination.token_id, destination.to_);
    };

    // update storage with new ledger
    const updated_store : storage = record [
        ledger = new_ledger;
        token_metadata = store.token_metadata;
        nft_id = store.nft_id;
        nft_metadata = store.nft_metadata;
        contract_metadata = store.contract_metadata
    ];
} with ((nil : list (operation)), updated_store)

(*
    Access function.
    params :
        * entry_points action - contract parameter
        * storage store - on-chain storage of nft data that is inputted
    returns :
        * main_return (unnamed) - pair made of a list of operations and a new storage variable
*)
function main (const action : entry_points; const store : storage) : return is
    case action of [
        Mint (owner, _metadata) -> mint ((owner, _metadata), store)
    |   Transfer (owner, _destinations) -> transfer ((owner, _destinations), store)
    ]
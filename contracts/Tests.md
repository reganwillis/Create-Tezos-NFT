# Tests

## Transfer

### FA2_TOKEN_UNDEFINED - Fail Case
If the token_id to transfer does not exist, fail with "FA_TOKEN_UNDEFINED".
**Input**
Dry Run
Access function: `main`
Parameters:

    Transfer(("tz1gvYATcrCe36vGMpwPBKDfwW1Q2ePQgRUr" : address), (list [record [to_ = ("tz1gvYATcrCe36vGMpwPBKDfwW1Q2ePQgRUr" : address); token_id = 3n]]))
Storage:

    record [
        ledger = big_map [(1n) -> ("tz1gvYATcrCe36vGMpwPBKDfwW1Q2ePQgRUr" : address)];
        token_metadata = big_map[(1n) -> ("test token metadata")];
        nft_id = 1n;
        nft_metadata = "Init NFT"
    ]

**Expected Output**
`failwith("FA2_TOKEN_UNDEFINED")`

**Output**
`failwith("FA2_TOKEN_UNDEFINED")`

### FA2_INSUFFICIENT_BALANCE - Fail Case
If the token_id exists but the given owner does not own the token, fail with "FA2_INSUFFICIENT_BALANCE".
**Input**
Dry Run
Access function: `main`
Parameters:

    Transfer(("tz1UPBMNHjF8QS788pgHgCM6imek9KnDXSVC" : address), (list [record [to_ = ("tz1gvYATcrCe36vGMpwPBKDfwW1Q2ePQgRUr" : address); token_id = 1n]]))
Storage:

    record [
        ledger = big_map [(1n) -> ("tz1gvYATcrCe36vGMpwPBKDfwW1Q2ePQgRUr" : address)];
        token_metadata = big_map[(1n) -> ("test token metadata")];
        nft_id = 1n;
        nft_metadata = "Init NFT"
    ]

**Expected Output**
`failwith("FA2_INSUFFICIENT_BALANCE")`

**Output**
`failwith("FA2_INSUFFICIENT_BALANCE")`
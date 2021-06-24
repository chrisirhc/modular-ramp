// A Human-Readable ABI; any supported ABI format could be used
export const ERC20_ABI = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",

  // Authenticated Functions
  "function transfer(address to, uint amount) returns (boolean)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint amount)"
];

// // This can be an address or an ENS name
// const address = "dai.tokens.ethers.eth";

// // An example Provider
// const provider = ethers.getDefaultProvider();

// // An example Signer
// const signer = ethers.Wallet.createRandom().connect(provider);

// // Read-Only; By connecting to a Provider, allows:
// // - Any constant function
// // - Querying Filters
// // - Populating Unsigned Transactions for non-constant methods
// // - Estimating Gas for non-constant (as an anonymous sender)
// // - Static Calling non-constant methods (as anonymous sender)
// const erc20 = new ethers.Contract(address, abi, provider);

// // Read-Write; By connecting to a Signer, allows:
// // - Everything from Read-Only (except as Signer, not anonymous)
// // - Sending transactions for non-constant functions
// const erc20_rw = new ethers.Contract(address, abi, signer)
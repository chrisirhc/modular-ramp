export const BlockChain = {
  terra: "Terra",
  ethereum: "Ethereum",
  bsc: "Binance Smart Chain",
} as const;

export type BlockChainType = keyof typeof BlockChain;
export const BLOCKCHAIN_OPTIONS: BlockChainType[] = ["ethereum", "terra"];

export const NETWORK_TYPES = {
  testnet: "Testnet",
  mainnet: "Mainnet",
} as const;

export type NetworkType = keyof typeof NETWORK_TYPES;

export const NETWORK_TYPE_OPTIONS: NetworkType[] = ["testnet", "mainnet"];

export const DEFAULT_NETWORK_TYPE: keyof typeof NETWORK_TYPES = "testnet";

// From Terra Bridge app
export type ShuttleNetwork = "bsc" | "ethereum";

export interface LocalTerraNetwork {
  /** Graphql server URL */
  mantle: string;
  /** Ethereum */
  shuttle: Record<ShuttleNetwork, string>;
  lcd: string;
  fcd: string;
}

export const TERRA_NETWORK_CHAIN_IDS: Record<NetworkType, string> = {
  mainnet: "columbus-4",
  testnet: "tequila-0004",
};

export const TERRA_NETWORKS: Record<NetworkType, LocalTerraNetwork> = {
  mainnet: {
    mantle: "https://mantle.terra.dev/",
    // Validate via https://github.com/terra-money/shuttle/blob/main/TERRA_ASSET.md#usage-instructions
    shuttle: {
      ethereum: "terra13yxhrk08qvdf5zdc9ss5mwsg5sf7zva9xrgwgc",
      bsc: "terra1g6llg3zed35nd3mh9zx6n64tfw3z67w2c48tn2",
    },
    fcd: "https://fcd.terra.dev",
    lcd: "https://lcd.terra.dev",
  },
  testnet: {
    mantle: "https://tequila-mantle.terra.dev/",
    shuttle: {
      ethereum: "terra10a29fyas9768pw8mewdrar3kzr07jz8f3n73t3",
      bsc: "terra1paav7jul3dzwzv78j0k59glmevttnkfgmgzv2r",
    },
    fcd: "https://tequila-fcd.terra.dev",
    lcd: "https://tequila-lcd.terra.dev",
  },
};

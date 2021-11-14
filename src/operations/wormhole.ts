import { getAddress } from "ethers/lib/utils";
import { NetworkType } from "../constants";

// from wormhole / bridge_ui
export const POLYGON_TOKEN_BRIDGE_ADDRESS: Record<NetworkType, string> = {
  testnet: getAddress("0x0290FB167208Af455bB137780163b7B7a9a10C16"),
  mainnet: getAddress("0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE"),
} as const;

export const ETH_TOKEN_BRIDGE_ADDRESS: Record<NetworkType, string> = {
  // On Goerli testnet.
  testnet: getAddress("0xa6CDAddA6e4B6704705b065E01E52e2486c0FBf6"),
  mainnet: getAddress("0x3ee18B2214AFF97000D974cf647E7C347E8fa585"),
} as const;

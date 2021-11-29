import { ChainId, getSignedVAA } from "@certusone/wormhole-sdk";
import { getAddress } from "ethers/lib/utils";
import { NetworkType } from "../constants";

export const WORMHOLE_RPC_HOSTS: Record<NetworkType, ReadonlyArray<string>> = {
  testnet: [
    "https://wormhole-v2-testnet-api.certus.one",
    "https://wormhole-v2-testnet-api.mcf.rocks",
    "https://wormhole-v2-testnet-api.chainlayer.network",
    "https://wormhole-v2-testnet-api.staking.fund",
    "https://wormhole-v2-testnet-api.chainlayer.network",
  ],
  mainnet: [
    "https://wormhole-v2-mainnet-api.certus.one",
    "https://wormhole.inotel.ro",
    "https://wormhole-v2-mainnet-api.mcf.rocks",
    "https://wormhole-v2-mainnet-api.chainlayer.network",
    "https://wormhole-v2-mainnet-api.staking.fund",
    "https://wormhole-v2-mainnet-api.chainlayer.network",
  ],
} as const;

export let CURRENT_WORMHOLE_RPC_HOST = -1;

export const getNextRpcHost = (networkType: NetworkType) =>
  ++CURRENT_WORMHOLE_RPC_HOST % WORMHOLE_RPC_HOSTS[networkType].length;

export async function getSignedVAAWithRetry(
  emitterChain: ChainId,
  emitterAddress: string,
  sequence: string,
  networkType: NetworkType,
  retryAttempts?: number
) {
  let result;
  let attempts = 0;
  while (!result) {
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      result = await getSignedVAA(
        WORMHOLE_RPC_HOSTS[networkType][getNextRpcHost(networkType)],
        emitterChain,
        emitterAddress,
        sequence
      );
    } catch (e) {
      if (retryAttempts !== undefined && attempts > retryAttempts) {
        throw e;
      }
    }
  }
  return result;
}

// from wormhole / bridge_ui
export const POLYGON_TOKEN_BRIDGE_ADDRESS: Record<NetworkType, string> = {
  testnet: getAddress("0x377D55a7928c046E18eEbb61977e714d2a76472a"),
  mainnet: getAddress("0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE"),
} as const;

export const POLYGON_BRIDGE_ADDRESS: Record<NetworkType, string> = {
  testnet: getAddress("0x0CBE91CF822c73C2315FB05100C2F714765d5c20"),
  mainnet: getAddress("0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7"),
} as const;

export const ETH_BRIDGE_ADDRESS: Record<NetworkType, string> = {
  testnet: getAddress("0x706abc4E45D419950511e474C7B9Ed348A4a716c"),
  mainnet: getAddress("0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B"),
} as const;

export const ETH_TOKEN_BRIDGE_ADDRESS: Record<NetworkType, string> = {
  // On Goerli testnet.
  testnet: getAddress("0xF890982f9310df57d00f659cf4fd87e65adEd8d7"),
  mainnet: getAddress("0x3ee18B2214AFF97000D974cf647E7C347E8fa585"),
} as const;

export const SOL_BRIDGE_ADDRESS: Record<NetworkType, string> = {
  testnet: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
  mainnet: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
} as const;

export const SOL_TOKEN_BRIDGE_ADDRESS: Record<NetworkType, string> = {
  testnet: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
  mainnet: "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
} as const;

export const TERRA_BRIDGE_ADDRESS: Record<NetworkType, string> = {
  testnet: "terra1pd65m0q9tl3v8znnz5f5ltsfegyzah7g42cx5v",
  mainnet: "terra1dq03ugtd40zu9hcgdzrsq6z2z4hwhc9tqk2uy5",
} as const;

export const TERRA_TOKEN_BRIDGE_ADDRESS: Record<NetworkType, string> = {
  testnet: "terra1pseddrv0yfsn76u4zxrjmtf45kdlmalswdv39a",
  mainnet: "terra10nmmwe8r3g99a9newtqa7a75xfgs2e8z87r2sf",
} as const;

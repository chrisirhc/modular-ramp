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
  testnet: getAddress("0x0290FB167208Af455bB137780163b7B7a9a10C16"),
  mainnet: getAddress("0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE"),
} as const;

export const ETH_BRIDGE_ADDRESS: Record<NetworkType, string> = {
  testnet: getAddress("0x44F3e7c20850B3B5f3031114726A9240911D912a"),
  mainnet: getAddress("0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B"),
} as const;

export const ETH_TOKEN_BRIDGE_ADDRESS: Record<NetworkType, string> = {
  // On Goerli testnet.
  testnet: getAddress("0xa6CDAddA6e4B6704705b065E01E52e2486c0FBf6"),
  mainnet: getAddress("0x3ee18B2214AFF97000D974cf647E7C347E8fa585"),
} as const;

export const SOL_BRIDGE_ADDRESS: Record<NetworkType, string> = {
  testnet: "Brdguy7BmNB4qwEbcqqMbyV5CyJd2sxQNUn6NEpMSsUb",
  mainnet: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
} as const;

export const SOL_TOKEN_BRIDGE_ADDRESS: Record<NetworkType, string> = {
  testnet: "A4Us8EhCC76XdGAN17L4KpRNEK423nMivVHZzZqFqqBg",
  mainnet: "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
} as const;

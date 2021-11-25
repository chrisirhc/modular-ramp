import React, { createContext } from "react";
import { NetworkType } from "../constants";
import { ethers, utils, BigNumber, providers } from "ethers";

export type Balance = {
  balance: BigNumber;
  decimals: any;
  symbol: string;
};

export type EthereumContextProps = {
  USTBalance: Balance | null;
  publicAddress: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.providers.JsonRpcSigner | null;
  refreshBalance: () => void;
  networkType: NetworkType | null;
};

export const EthereumContext = createContext<EthereumContextProps>({
  USTBalance: null,
  publicAddress: null,
  provider: null,
  signer: null,
  refreshBalance: () => {},
  networkType: null,
});

import React, { createContext, useEffect, useState } from "react";
import { Box, Button } from "@chakra-ui/react";
import { NetworkType } from "../constants";
import { ethers, utils, BigNumber, providers } from "ethers";
import { ERC20_ABI } from "../erc20";

// From https://github.com/terra-money/shuttle/blob/main/TERRA_ASSET.md#erc20-contracts
const UST_CONTRACT: Record<NetworkType, string> = {
  testnet: "0x6cA13a4ab78dd7D657226b155873A04DB929A3A4",
  mainnet: "0xa47c8bf37f92aBed4A126BDA807A7b7498661acD",
};

export interface EthConnect {
  setProviderAndSigner: React.Dispatch<
    React.SetStateAction<{
      provider: ethers.providers.Web3Provider | null;
      signer: ethers.providers.JsonRpcSigner | null;
    } | null>
  >;
  setPublicAddress: React.Dispatch<React.SetStateAction<string | null>>;
}

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

function printBalance(bal: Balance | null) {
  return (bal && utils.formatUnits(bal.balance, bal.decimals)) || "";
}

interface EthWalletConnectorRenderProps {
  connect: () => void;
  publicAddress: string | null;
  networkMismatch: boolean;
  USTBalance: Balance | null;
}

export function EthWalletConnectorRender({
  connect,
  publicAddress,
  networkMismatch,
  USTBalance,
}: EthWalletConnectorRenderProps) {
  return (
    <Box>
      <Button onClick={connect} disabled={Boolean(publicAddress)}>
        {publicAddress ? `Connected` : "Connect"} to Ethereum
      </Button>
      {networkMismatch ? (
        <Box ps={2} color="red">
          Network mismatch.
        </Box>
      ) : null}
      <Box ps={2}>
        <small>
          {publicAddress}
          {USTBalance ? (
            <div>
              <pre>{printBalance(USTBalance)} UST</pre>
            </div>
          ) : null}
        </small>
      </Box>
    </Box>
  );
}

export function useRefreshBalance({
  providerAndSigner,
  publicAddress,
  shouldRefreshBalance,
  networkType,
  setUSTBalance,
  setShouldRefreshBalance,
}: {
  providerAndSigner: {
    provider: ethers.providers.Web3Provider | null;
    signer: ethers.providers.JsonRpcSigner | null;
  } | null;
  publicAddress: string | null;
  shouldRefreshBalance: boolean;
  networkType: NetworkType;
  setUSTBalance: React.Dispatch<React.SetStateAction<Balance | null>>;
  setShouldRefreshBalance: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  useEffect(() => {
    let canceled = false;

    (async () => {
      if (
        !providerAndSigner ||
        !providerAndSigner?.provider ||
        !publicAddress ||
        !shouldRefreshBalance
      ) {
        return;
      }

      const { provider } = providerAndSigner;
      try {
        const erc20 = new ethers.Contract(
          UST_CONTRACT[networkType],
          ERC20_ABI,
          provider
        );
        const balance: BigNumber = await erc20.balanceOf(publicAddress);
        const decimals = await erc20.decimals();
        const symbol = await erc20.symbol();
        if (canceled) {
          return;
        }
        setUSTBalance({ balance, decimals, symbol });
        setShouldRefreshBalance(false);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [
    providerAndSigner,
    publicAddress,
    shouldRefreshBalance,
    networkType,
    setUSTBalance,
    setShouldRefreshBalance,
  ]);
}

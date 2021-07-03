import React, { createContext, useEffect, useState } from "react";
import { Box, Button } from "@chakra-ui/react";

import { ethers, utils, BigNumber } from "ethers";
import { ERC20_ABI } from "./erc20";

// From https://github.com/terra-money/shuttle/blob/main/TERRA_ASSET.md#erc20-contracts
const UST_CONTRACT = {
  ropsten: "0x6cA13a4ab78dd7D657226b155873A04DB929A3A4",
  mainnet: "0xa47c8bf37f92aBed4A126BDA807A7b7498661acD",
};
const ETH_TARGET_NETWORK = "ropsten";

export type EthereumContextProps = {
  USTBalance: Balance | null;
  publicAddress: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.providers.JsonRpcSigner | null;
  refreshBalance: () => void;
};

export const EthereumContext = createContext<EthereumContextProps>({
  USTBalance: null,
  publicAddress: null,
  provider: null,
  signer: null,
  refreshBalance: () => {},
});

type Props = {
  children: React.ReactNode;
};

type Balance = {
  balance: BigNumber;
  decimals: any;
  symbol: string;
};

function printBalance(bal: Balance | null) {
  return (bal && utils.formatUnits(bal.balance, bal.decimals)) || "";
}

const CONNECTED_KEY = "eth_connected";

export function EthWalletConnector({ children }: Props) {
  const [publicAddress, setPublicAddress] = useState<string | null>(null);
  const [USTBalance, setUSTBalance] = useState<Balance | null>(null);
  const [providerAndSigner, setProviderAndSigner] = useState<{
    provider: ethers.providers.Web3Provider | null;
    signer: ethers.providers.JsonRpcSigner | null;
  } | null>(null);
  const [shouldRefreshBalance, setShouldRefreshBalance] = useState<boolean>(true);

  useEffect(() => {
    if (sessionStorage.getItem(CONNECTED_KEY) === CONNECTED_KEY) {
      connect();
    }
  }, []);

  useEffect(() => {
    let canceled = false;

    (async () => {
      if (!providerAndSigner || !providerAndSigner?.provider || !publicAddress || !shouldRefreshBalance) {
        return;
      }

      const { provider } = providerAndSigner;
      const erc20 = new ethers.Contract(
        UST_CONTRACT[ETH_TARGET_NETWORK],
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
    })();

    return () => {
      canceled = true;
    }
  }, [providerAndSigner, publicAddress, shouldRefreshBalance]);

  return (
    <>
      <Box>
        <h3>Ethereum</h3>
        <Button onClick={connect} disabled={Boolean(publicAddress)}>
          {publicAddress ? `Connected to ${publicAddress}` : "Connect"}
        </Button>
        {USTBalance ? (
          <div>
            UUSD balance
            <pre>{printBalance(USTBalance)} UST</pre>
          </div>
        ) : null}
      </Box>
      <EthereumContext.Provider
        value={{
          /* useMemo */
          USTBalance,
          publicAddress,
          provider: providerAndSigner?.provider || null,
          signer: providerAndSigner?.signer || null,
          refreshBalance,
        }}
      >
        {children}
      </EthereumContext.Provider>
    </>
  );

  async function connect() {
    // Only works with Metamask right now.
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    setProviderAndSigner({
      provider,
      signer,
    });

    await provider.send("eth_requestAccounts", []);
    const publicAddress = await signer.getAddress();
    setPublicAddress(publicAddress);

    sessionStorage.setItem(CONNECTED_KEY, CONNECTED_KEY);
  }

  function refreshBalance() {
    setShouldRefreshBalance(true);
  }
}

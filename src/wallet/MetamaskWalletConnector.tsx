import React, { createContext, useEffect, useState } from "react";
import { Box, Button } from "@chakra-ui/react";
import { ethers, utils, BigNumber, providers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";

import { NetworkType } from "../constants";
import {
  Balance,
  EthereumContext,
  EthereumContextProps,
  EthWalletConnectorRender,
  useRefreshBalance,
} from "./EtherumWalletBase";

const CHAIN_ID: Record<NetworkType, string> = {
  testnet: "0x3",
  mainnet: "0x1",
};

type Props = {
  networkType: NetworkType;
  onChange: (e: EthereumContextProps) => void;
};

export { EthereumContext };
export type { Balance, EthereumContextProps };

const CONNECTED_KEY = "eth_connected";

export function EthWalletConnector({ networkType, onChange }: Props) {
  const [publicAddress, setPublicAddress] = useState<string | null>(null);
  const [USTBalance, setUSTBalance] = useState<Balance | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [providerAndSigner, setProviderAndSigner] = useState<{
    provider: ethers.providers.Web3Provider | null;
    signer: ethers.providers.JsonRpcSigner | null;
  } | null>(null);
  const [shouldRefreshBalance, setShouldRefreshBalance] =
    useState<boolean>(true);

  const connect = useConnectMetamask({
    setProviderAndSigner,
    setPublicAddress,
  });

  useInitMetamask({ connect, networkType, setChainId });

  useRefreshBalance({
    providerAndSigner,
    publicAddress,
    shouldRefreshBalance,
    networkType,
    setUSTBalance,
    setShouldRefreshBalance,
  });

  useEffect(() => {
    onChange({
      USTBalance,
      publicAddress,
      provider: providerAndSigner?.provider || null,
      signer: providerAndSigner?.signer || null,
      refreshBalance,
      networkType,
    });
  }, [onChange, USTBalance, publicAddress, providerAndSigner, networkType]);

  const networkMismatch = chainId !== CHAIN_ID[networkType];
  return (
    <EthWalletConnectorRender
      connect={connect}
      publicAddress={publicAddress}
      networkMismatch={networkMismatch}
      USTBalance={USTBalance}
    />
  );

  function refreshBalance() {
    setShouldRefreshBalance(true);
  }
}

function useConnectMetamask({
  setProviderAndSigner,
  setPublicAddress,
}: {
  setProviderAndSigner: React.Dispatch<
    React.SetStateAction<{
      provider: ethers.providers.Web3Provider | null;
      signer: ethers.providers.JsonRpcSigner | null;
    } | null>
  >;
  setPublicAddress: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  return connect;

  async function connect() {
    if (!window.ethereum) {
      return;
    }
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
}

function useInitMetamask({
  connect,
  networkType,
  setChainId,
}: {
  connect: () => void;
  networkType: NetworkType;
  setChainId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  useEffect(() => {
    init();
    if (sessionStorage.getItem(CONNECTED_KEY) === CONNECTED_KEY) {
      connect();
    }
  }, []);

  async function init() {
    const provider = await detectEthereumProvider();

    if (provider) {
      // If the provider returned by detectEthereumProvider is not the same as
      // window.ethereum, something is overwriting it, perhaps another wallet.
      if (provider !== window.ethereum) {
        console.error("Do you have multiple wallets installed?");
      }
    } else {
      console.log("Please install MetaMask!");
    }

    const ethereumT = window.ethereum;
    if (!ethereumT) {
      return;
    }
    type MetaMaskProvider = providers.ExternalProvider & {
      on: (e: string, f: (_: any) => void) => void;
    };
    const ethereum: MetaMaskProvider = ethereumT as MetaMaskProvider;
    if (!ethereum.request) {
      return;
    }

    const chainId = await ethereum.request({ method: "eth_chainId" });
    if (chainId !== CHAIN_ID[networkType]) {
      console.error("Network chosen does not match Eth network");
    }
    setChainId(chainId);

    ethereum.on("chainChanged", handleChainChanged);

    function handleChainChanged(_chainId: any) {
      // We recommend reloading the page, unless you must do otherwise
      window.location.reload();
    }
  }
}

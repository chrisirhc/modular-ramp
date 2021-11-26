import React, { FC, useEffect, useState, useMemo, useCallback } from "react";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { providers } from "ethers";
import {
  Balance,
  EthConnect,
  EthProviderProps,
  EthWalletConnectorRender,
  useChangeEthereumContext,
  useRefreshBalance,
} from "./EtherumWalletBase";

//  Wrap with Web3Provider from ethers.js
export const WalletConnectWalletProvider: FC<EthProviderProps> = ({
  networkType,
  onChange,
}) => {
  const [publicAddress, setPublicAddress] = useState<string | null>(null);
  const [USTBalance, setUSTBalance] = useState<Balance | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [disconnect, setDisconnect] = useState<() => void>(() => {});
  const [providerAndSigner, setProviderAndSigner] = useState<{
    provider: providers.Web3Provider | null;
    signer: providers.JsonRpcSigner | null;
  } | null>(null);
  const [shouldRefreshBalance, setShouldRefreshBalance] =
    useState<boolean>(true);

  const connect = useConnectWalletconnect({
    setProviderAndSigner,
    setPublicAddress,
  });

  const connectWithDisconnect = useCallback(async () => {
    const disconnect = await connect();
    setDisconnect(disconnect);
  }, [connect, setDisconnect]);

  const refreshBalance = useRefreshBalance({
    providerAndSigner,
    publicAddress,
    networkType,
    setUSTBalance,
  });

  useChangeEthereumContext({
    onChange,
    USTBalance,
    publicAddress,
    providerAndSigner,
    refreshBalance,
    networkType,
  });

  return (
    <EthWalletConnectorRender
      connect={connectWithDisconnect}
      disconnect={disconnect}
      publicAddress={publicAddress}
      networkMismatch={false}
      USTBalance={USTBalance}
    />
  );
};

function useConnectWalletconnect({
  setProviderAndSigner,
  setPublicAddress,
}: EthConnect) {
  const connect = useCallback(async () => {
    //  Create WalletConnect Provider
    const wcProvider = new WalletConnectProvider({
      infuraId: "4e4974318a944fdbbe46502c86aedd99",
      rpc: {
        137: "https://polygon-rpc.com",
      },
    });

    const provider = new providers.Web3Provider(wcProvider);
    const signer = provider.getSigner();
    setProviderAndSigner({
      provider,
      signer,
    });

    //  Enable session (triggers QR Code modal)
    await wcProvider.enable();

    const publicAddress = await signer.getAddress();
    setPublicAddress(publicAddress);

    return () => {
      wcProvider.disconnect();
    };
  }, [setProviderAndSigner, setPublicAddress]);

  return connect;
}

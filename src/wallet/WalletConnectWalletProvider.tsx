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
  const [providerAndSigner, setProviderAndSigner] = useState<{
    provider: providers.Web3Provider | null;
    signer: providers.JsonRpcSigner | null;
  } | null>(null);
  const [shouldRefreshBalance, setShouldRefreshBalance] =
    useState<boolean>(true);

  const [connect, disconnect] = useConnectWalletconnect({
    setProviderAndSigner,
    setPublicAddress,
  });

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
      connect={connect}
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
  //  Create WalletConnect Provider
  const wcProvider = useMemo(
    () =>
      new WalletConnectProvider({
        infuraId: "4e4974318a944fdbbe46502c86aedd99",
        // rpc: {
        //   137: "https://polygon-rpc.com",
        // },
      }),
    []
  );

  const connect = useCallback(async () => {
    console.log("Connecting");

    //  Enable session (triggers QR Code modal)
    await wcProvider.enable();

    wcProvider.on("chainChanged", (chainId: number) => {
      console.log(chainId);
    });

    // Subscribe to session disconnection
    wcProvider.on("disconnect", (code: number, reason: string) => {
      console.log(code, reason);
    });

    const provider = new providers.Web3Provider(wcProvider);
    const signer = provider.getSigner();
    setProviderAndSigner({
      provider,
      signer,
    });

    const publicAddress = await signer.getAddress();
    setPublicAddress(publicAddress);

    return () => {};
  }, [setProviderAndSigner, setPublicAddress, wcProvider]);

  const disconnect = useCallback(() => wcProvider.disconnect(), [wcProvider]);

  return [connect, disconnect];
}

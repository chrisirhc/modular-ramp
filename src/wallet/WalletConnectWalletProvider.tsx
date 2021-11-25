import React, { FC, useEffect, useState, useMemo } from "react";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { providers } from "ethers";
import {
  Balance,
  EthConnect,
  EthereumContext,
  EthereumContextProps,
  EthWalletConnectorRender,
} from "./EtherumWalletBase";

//  Wrap with Web3Provider from ethers.js
export const WalletConnectWalletProvider: FC = (props) => {
  const [publicAddress, setPublicAddress] = useState<string | null>(null);
  const [USTBalance, setUSTBalance] = useState<Balance | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
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

  return (
    <EthWalletConnectorRender
      connect={connect}
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
  return connect;

  async function connect() {
    //  Create WalletConnect Provider
    const wcProvider = new WalletConnectProvider({
      infuraId: "4e4974318a944fdbbe46502c86aedd99",
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
  }
}

import React, { FC, useEffect, useMemo } from "react";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { providers } from "ethers";
import { EthereumContext, EthereumContextProps } from "./EtherumContext";

//  Wrap with Web3Provider from ethers.js
export const WalletConnectWalletProvider: FC = (props) => {
  useEffect(() => {
    async function createClient() {
      //  Create WalletConnect Provider
      const provider = new WalletConnectProvider({
        infuraId: "4e4974318a944fdbbe46502c86aedd99",
      });

      const web3Provider = new providers.Web3Provider(provider);

      //  Enable session (triggers QR Code modal)
      await provider.enable();
    }

    createClient();
  }, []);

  return <div>Test</div>;
};

import { WalletDialogProvider } from "@solana/wallet-adapter-material-ui";
import { useWallet, WalletProvider } from "@solana/wallet-adapter-react";
import {
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getMathWallet,
} from "@solana/wallet-adapter-wallets";
import React, { FC, useMemo } from "react";

import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-material-ui";

export const SolanaWalletProvider: FC = (props) => {
  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking --
  // Only the wallets you want to instantiate here will be compiled into your application
  const wallets = useMemo(() => {
    return [
      getPhantomWallet(),
      getSolflareWallet(),
      // getTorusWallet({
      //     options: { clientId: 'Go to https://developer.tor.us and create a client ID' }
      // }),
      // getLedgerWallet(),
      // getSolongWallet(),
      getMathWallet(),
      getSolletWallet(),
    ];
  }, []);

  return (
    <WalletProvider wallets={wallets}>
      <WalletDialogProvider>{props.children}</WalletDialogProvider>
    </WalletProvider>
  );
};

export const SolanaWalletKey = () => {
  const wallet = useSolanaWallet();
  return (
    <div>
      <WalletMultiButton />
      {wallet && <WalletDisconnectButton startIcon={null} />}
    </div>
  );
};

export default SolanaWalletKey;

export const useSolanaWallet = useWallet;

import React, { createContext, useEffect, useState } from "react";
import { Box, Button } from "@chakra-ui/react";

import { Coins } from "@terra-money/terra.js";
import {
  getChainOptions,
  WalletProvider,
  WalletControllerChainOptions,
  ConnectType,
  useWallet,
  TxResult,
  NetworkInfo,
} from "@terra-money/wallet-provider";
import { CreateTxOptions } from "@terra-money/terra.js";

import { printTerraAmount } from "./utils";
import { NetworkType } from "./constants";
import { getLCDClient } from "./operations/terra";

// Return true if the balance has changed
export type RefreshBalanceRet = {
  balanceHasChanged: boolean;
};
export type RefreshBalanceFn =
  | (() => Promise<RefreshBalanceRet>)
  | (() => void);

export type TerraContextProps = {
  post:
    | ((
        tx: CreateTxOptions,
        txTarget?:
          | {
              terraAddress?: string | undefined;
            }
          | undefined
      ) => Promise<TxResult>)
    | null;
  address: string | null;
  balance: Coins | null;
  refreshBalance: RefreshBalanceFn;
  networkType: NetworkType | null;
  network: NetworkInfo | null;
};

export interface InfoResponse {
  chainID: string;
  fcd: string;
  lcd: string;
  name: string;
}

export const TerraContext = createContext<TerraContextProps>({
  post: null,
  address: null,
  balance: null,
  refreshBalance: () => {},
  networkType: null,
  network: null,
});

export type Props = {
  networkType: NetworkType;
  onChange: (t: TerraContextProps) => void;
};

const CONNECTED_KEY = "terra_connected";

type ShouldRefreshBalanceType = {
  resolve: (ret: RefreshBalanceRet | Promise<RefreshBalanceRet>) => void;
};

function TerraWalletProvider({ children }: { children: React.ReactNode }) {
  const [chainOptions, setChainOptions] = useState<
    WalletControllerChainOptions | undefined
  >();
  useEffect(() => {
    getChainOptions().then((chainOptions) => setChainOptions(chainOptions));
  }, []);
  return chainOptions ? (
    <WalletProvider {...chainOptions}>{children}</WalletProvider>
  ) : null;
}

export function TerraWalletConnector(props: Props) {
  return (
    <TerraWalletProvider>
      <TerraWalletConnectorUI {...props} />
    </TerraWalletProvider>
  );
}

function TerraWalletConnectorUI({ networkType, onChange }: Props) {
  const { network, wallets, connect, post } = useWallet();
  const [balance, setBalance] = useState<Coins | null>(null);
  const [shouldRefreshBalance, setShouldRefreshBalance] =
    useState<null | ShouldRefreshBalanceType>(null);
  const wallet = wallets[0]?.terraAddress;

  // Helps with refreshes and development
  useEffect(() => {
    if (sessionStorage.getItem(CONNECTED_KEY) === CONNECTED_KEY) {
      // connect();
    }
  }, []);

  useEffect(() => {
    refreshBalance();
  }, [wallet, networkType]);

  // Use state to set up a refreshing state
  useEffect(() => {
    let canceled = false;
    if (!shouldRefreshBalance) {
      return;
    }
    if (!wallet) {
      return;
    }
    (async () => {
      const newBalance = await getLCDClient({ network }).bank.balance(wallet);
      if (canceled) {
        return;
      }
      const balanceHasChanged = balance?.toJSON() !== newBalance.toJSON();
      if (balanceHasChanged) {
        setBalance(newBalance);
      }
      shouldRefreshBalance.resolve({
        balanceHasChanged,
      });
      // I had no idea where to put this line. And why if I put it anywhere above, it wouldn't work.
      // The interaction between canceled and shouldRefreshBalance, + the setState function, totally messed me up.
      // Please remember sending a function to setState, not expected!
      setShouldRefreshBalance(null);
    })();
    return () => {
      canceled = true;
      // Should resolve the old balance into the new version
      // Should this reject the old refresh call or return a new one?
    };
  }, [shouldRefreshBalance, wallet, balance, network]);

  // Argument of type '() => Promise<{ balanceHasChanged: boolean; } | undefined>' is not assignable to parameter of type 'RefreshBalanceRet'.
  // Property 'balanceHasChanged' is missing in type '() => Promise<{ balanceHasChanged: boolean; } | undefined>' but required in type 'RefreshBalanceRet'.

  useEffect(() => {
    if (network && networkType !== network.name) {
      console.error("Network chosen does not match Terra extension network");
    }

    onChange({
      post,
      /* TODO: Use Memo */
      address: wallets[0]?.terraAddress,
      balance,
      networkType,
      network,
      refreshBalance,
    });
  }, [onChange, balance, networkType, wallets, post, network]);

  const uusdBal = balance && balance.get("uusd");
  const networkMismatch = network && networkType !== network.name;
  return (
    <Box>
      <Button
        onClick={() => connect(ConnectType.WALLETCONNECT)}
        disabled={Boolean(wallet)}
      >
        {wallets[0] ? `Connected` : "Connect"} to Terra
      </Button>
      {networkMismatch ? (
        <Box ps={2} color="red">
          Network mismatch.
        </Box>
      ) : null}
      <Box ps={2}>
        <small>
          {wallet}
          {uusdBal ? (
            <div>
              <pre>{printTerraAmount(uusdBal)} UST</pre>
            </div>
          ) : null}
        </small>
      </Box>
    </Box>
  );

  /**
   * Be careful with referencing state within this function.
   * The function is used elsewhere and needs to always get the latest
   * values. Hence, the use of getters and useRef to store state.
   *
   * There might be cleaner patterns for doing this.
   * TODO: in the future.
   */
  async function refreshBalance(): Promise<RefreshBalanceRet> {
    // This seems super complex/unreadable. Are we overthinking this? Lol.
    const newPromise: Promise<RefreshBalanceRet> = new Promise((resolve) => {
      // Careful about calling setState with a function.
      // React calls instead of setting it as state.
      setShouldRefreshBalance((prevResolve) => {
        prevResolve?.resolve(newPromise);
        return {
          resolve,
        };
      });
    });
    return newPromise;
  }
}

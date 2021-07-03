import React, { createContext, useEffect, useRef, useState } from "react";
import { Box, Button } from "@chakra-ui/react";

import {
  Extension,
  Coin,
  Coins,
  Dec,
  MsgSend,
  StdFee,
  CreateTxOptions,
  Int,
} from "@terra-money/terra.js";
import { getLCDClient, TERRA_DECIMAL, printTerraAmount } from "./utils";

// Return true if the balance has changed
export type RefreshBalanceRet = {
  balanceHasChanged: boolean;
};
export type RefreshBalanceFn =
  | (() => Promise<RefreshBalanceRet>)
  | (() => void);

export type TerraContextProps = {
  extension: Extension | null;
  address: string | null;
  balance: Coins | null;
  refreshBalance: RefreshBalanceFn;
};

export const TerraContext = createContext<TerraContextProps>({
  extension: null,
  address: null,
  balance: null,
  refreshBalance: () => {},
});

type Props = {
  onChange: (t: TerraContextProps) => void;
};

const CONNECTED_KEY = "terra_connected";

type ShouldRefreshBalanceType = {
  resolve: (ret: RefreshBalanceRet | Promise<RefreshBalanceRet>) => void;
};

export function TerraWalletConnector({ onChange }: Props) {
  const [extension, setExtension] = useState<Extension | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [balance, setBalance] = useState<Coins | null>(null);
  const [shouldRefreshBalance, setShouldRefreshBalance] =
    useState<null | ShouldRefreshBalanceType>(null);

  // Helps with refreshes and development
  useEffect(() => {
    if (sessionStorage.getItem(CONNECTED_KEY) === CONNECTED_KEY) {
      connect();
    }
  }, []);

  useEffect(() => {
    refreshBalance();
  }, [wallet]);

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
      const newBalance = await getLCDClient().bank.balance(wallet);
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
  }, [shouldRefreshBalance, wallet, balance]);

  // Argument of type '() => Promise<{ balanceHasChanged: boolean; } | undefined>' is not assignable to parameter of type 'RefreshBalanceRet'.
  // Property 'balanceHasChanged' is missing in type '() => Promise<{ balanceHasChanged: boolean; } | undefined>' but required in type 'RefreshBalanceRet'.

  useEffect(() => {
    onChange({
      /* TODO: Use Memo */
      extension,
      address: wallet,
      balance,
      refreshBalance,
    });
  }, [onChange, extension, wallet, balance]);

  const uusdBal = balance && balance.get("uusd");

  return (
    <Box>
      <Button onClick={connect} disabled={Boolean(wallet)}>
        {wallet ? `Connected` : "Connect"} to Terra
      </Button>
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

  type ConnectResponse = {
    address: string;
  };

  function connect() {
    const extension = new Extension();
    extension.connect();
    extension.on("onConnect", (w: ConnectResponse) => {
      setWallet(w.address);
    });
    setExtension(extension);
    sessionStorage.setItem(CONNECTED_KEY, CONNECTED_KEY);
  }

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
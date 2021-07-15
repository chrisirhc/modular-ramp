import React, { createContext, useEffect, useState } from "react";
import { Box, Button } from "@chakra-ui/react";

import { Extension, Coins } from "@terra-money/terra.js";
import { printTerraAmount } from "./utils";
import { NetworkType, TERRA_NETWORKS } from "./constants";
import { getLCDClient } from "./operations/terra";

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
  networkType: NetworkType | null;
};

export interface InfoResponse {
  chainID: string;
  fcd: string;
  lcd: string;
  name: string;
}

export const TerraContext = createContext<TerraContextProps>({
  extension: null,
  address: null,
  balance: null,
  refreshBalance: () => {},
  networkType: null,
});

type Props = {
  networkType: NetworkType;
  onChange: (t: TerraContextProps) => void;
};

const CONNECTED_KEY = "terra_connected";

type ShouldRefreshBalanceType = {
  resolve: (ret: RefreshBalanceRet | Promise<RefreshBalanceRet>) => void;
};

export function TerraWalletConnector({ networkType, onChange }: Props) {
  const [extension, setExtension] = useState<Extension | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [balance, setBalance] = useState<Coins | null>(null);
  const [connectInfo, setConnectInfo] = useState<InfoResponse | null>(null);
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
      const newBalance = await getLCDClient({ networkType }).bank.balance(
        wallet
      );
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
  }, [shouldRefreshBalance, wallet, balance, networkType]);

  // Argument of type '() => Promise<{ balanceHasChanged: boolean; } | undefined>' is not assignable to parameter of type 'RefreshBalanceRet'.
  // Property 'balanceHasChanged' is missing in type '() => Promise<{ balanceHasChanged: boolean; } | undefined>' but required in type 'RefreshBalanceRet'.

  useEffect(() => {
    if (connectInfo && TERRA_NETWORKS[networkType].lcd !== connectInfo.lcd) {
      console.error("Network chosen does not match Terra extension network");
    }

    onChange({
      /* TODO: Use Memo */
      extension,
      address: wallet,
      balance,
      networkType,
      refreshBalance,
    });
  }, [onChange, extension, wallet, balance, networkType, connectInfo]);

  const uusdBal = balance && balance.get("uusd");
  const networkMismatch =
    connectInfo && TERRA_NETWORKS[networkType].lcd !== connectInfo.lcd;

  return (
    <Box>
      <Button onClick={connect} disabled={Boolean(wallet)}>
        {wallet ? `Connected` : "Connect"} to Terra
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

  type ConnectResponse = {
    address: string;
  };

  function connect() {
    const extension = new Extension();
    extension.connect();
    extension.on("onConnect", (w: ConnectResponse) => {
      setWallet(w.address);

      extension.info();
      extension.on("onInfo", (info: InfoResponse) => {
        setConnectInfo(info);
      });
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

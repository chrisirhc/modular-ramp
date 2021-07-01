import React, { createContext, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
} from "@chakra-ui/react";

import { Extension, Coin, Coins, Dec, MsgSend, StdFee, CreateTxOptions, Int } from "@terra-money/terra.js";
import { getLCDClient, TERRA_DECIMAL, printTerraAmount } from "./utils";

// Return true if the balance has changed
export type RefreshBalanceRet = {
  balanceHasChanged: boolean,
};
export type RefreshBalanceFn = (() => Promise<RefreshBalanceRet>) | (() => void);

export type TerraContextProps = {
  extension: Extension | null,
  address: string | null,
  balance: Coins | null,
  refreshBalance: RefreshBalanceFn,
};

export const TerraContext = createContext<TerraContextProps>({
  extension: null,
  address: null,
  balance: null,
  refreshBalance: () => {},
});

type Props = {
  children: React.ReactNode,
};

const CONNECTED_KEY = 'terra_connected';

export function WalletConnector({children}: Props) {
  const [extension, setExtension] = useState<Extension | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [balance, setBalance] = useState<Coins | null>(null);

  // Helps with refreshes and development
  useEffect(() => {
    if (sessionStorage.getItem(CONNECTED_KEY) === CONNECTED_KEY) {
      connect();
    }
  }, []);

  useEffect(() => {
    refreshBalance()
  }, [wallet]);

  const uusdBal = balance && balance.get("uusd");

  return (
    <>
      <Box p={2}>
        <h3>Terra</h3>
        <Button onClick={connect} disabled={Boolean(wallet)}>
          {
            wallet ?
            `Connected to ${wallet}` :
            'Connect to Terra Station'
          }
        </Button>
        {
          uusdBal ? (
            <div>
              UUSD balance
              <pre>{ printTerraAmount(uusdBal) } UST</pre>
            </div>
          ) : null
        }
      </Box>
      <TerraContext.Provider value={{
        /* TODO: Use Memo */
        extension,
        address: wallet,
        balance,
        refreshBalance,
      }}>
        {children}
      </TerraContext.Provider>
    </>
  );

  type ConnectResponse = {
    address: string,
  };

  function connect() {
    const extension = new Extension();
    extension.connect();
    extension.on('onConnect', (w: ConnectResponse) => {
      setWallet(w.address);
    });
    setExtension(extension);
    sessionStorage.setItem(CONNECTED_KEY, CONNECTED_KEY);
  }

  async function refreshBalance(): Promise<RefreshBalanceRet | void> {
    if (!wallet) {
      return;
    }
    const newBalance = await getLCDClient().bank.balance(wallet);
    const balanceHasChanged = balance?.toJSON() !== newBalance.toJSON();
    if (balanceHasChanged) {
      setBalance(newBalance);
    }
    return {
      balanceHasChanged,
    };
  }
}
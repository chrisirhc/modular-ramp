import React, { createContext, useEffect, useRef, useState } from "react";
import {
  Button,
} from "@chakra-ui/react";

import { Extension, Coin, Coins, Dec, MsgSend, StdFee, CreateTxOptions, Int } from "@terra-money/terra.js";
import { getLCDClient, TERRA_DECIMAL, printTerraAmount } from "./utils";

export type TerraContextProps = {
  extension: Extension | null,
  address: string | null,
  balance: Coins | null,
  refreshBalance: Function,
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

export function WalletConnector({children}: Props) {
  const [extension, setExtension] = useState<Extension | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [balance, setBalance] = useState<Coins | null>(null);
  useEffect(() => {
    refreshBalance()
  }, [wallet]);

  const uusdBal = balance && balance.get("uusd");

  return (
    <div>
      <div style={{
        border: '1px solid #ccc',
        padding: '5px',
      }}>
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
      </div>
      <TerraContext.Provider value={{
        /* TODO: Use Memo */
        extension,
        address: wallet,
        balance,
        refreshBalance,
      }}>
        {children}
      </TerraContext.Provider>
    </div>
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
  }

  async function refreshBalance() {
    if (!wallet) {
      return;
    }
    const balance = await getLCDClient().bank.balance(wallet);
    setBalance(balance);
  }
}
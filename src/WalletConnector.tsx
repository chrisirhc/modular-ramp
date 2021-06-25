import React, { createContext, useEffect, useRef, useState } from "react";
import { LCDClient, Extension, Coin, Coins, Dec, MsgSend, StdFee, CreateTxOptions, Int } from "@terra-money/terra.js";
import { TERRA_DECIMAL, printTerraAmount } from "./utils";

export type TerraContextProps = {
  extension?: Extension | null,
  address?: string | null,
};

export const TerraContext = createContext<TerraContextProps>({});

type Props = {
  children: React.ReactNode,
};

export function WalletConnector({children}: Props) {
  const [extension, setExtension] = useState<Extension | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);

  const uusdBal = null; // balance && balance.get("uusd");

  return (
    <div>
      <div style={{
        border: '1px solid #ccc',
        padding: '5px',
      }}>
        <h3>Terra</h3>
        <button onClick={connect} disabled={Boolean(wallet)}>
          {
            wallet ?
            `Connected to ${wallet}` :
            'Connect to Terra Station'
          }
        </button>
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
        extension,
        address: wallet
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

  // async function getBalance() {
  //   if (!wallet) {
  //     return;
  //   }
  //   const balance = await terra.bank.balance(wallet.address);
  //   setBalance(balance);
  // }
}
import React, { useEffect, useState } from "react";
import { LCDClient, Extension, Coins, Dec } from "@terra-money/terra.js";

type ConnectResponse = {
  address: string
};

const TERRA_DECIMAL = 1e6;

// connect to soju testnet
const terra = new LCDClient({
  URL: 'https://tequila-lcd.terra.dev',
  chainID: 'tequila-0004',
});

export function TerraToShuttle() {
  const [wallet, setWallet] = useState<ConnectResponse | null>(null);
  const [balance, setBalance] = useState<Coins | null>(null);

  useEffect(() => {
    getBalance();
  }, [wallet])

  const uusdBal = balance && balance.get("uusd");

  return (
    <div>
      <h3>Terra To Shuttle</h3>
      <button onClick={connect} disabled={Boolean(wallet)}>
        {
          wallet ?
          `Connected to ${wallet.address}` :
          'Connect to Terra Station'
        }
      </button>
      {
        balance && balance.get("uusd") ? (
          <div>
            UUSD balance
            <pre>{ uusdBal && new Dec(uusdBal.amount).div(TERRA_DECIMAL).toString() }</pre>
          </div>
        ) : null
      }
    </div>
  );

  function connect() {
    const extension = new Extension();
    extension.connect();
    extension.on('onConnect', (w: ConnectResponse) => {
      setWallet(w);
    });
  }

  async function getBalance() {
    if (!wallet) {
      return;
    }
    const balance = await terra.bank.balance(wallet.address);
    setBalance(balance);
  }
}

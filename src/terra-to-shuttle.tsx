import React, { useState } from "react";
import { Extension } from "@terra-money/terra.js";

type ConnectResponse = {
  address: string
};

export function TerraToShuttle() {
  const [wallet, setWallet] = useState<ConnectResponse | null>(null);

  return (
    <div>
      <h3>Terra To Shuttle</h3>
      <button onClick={connect}>
        {
          wallet ?
          `Connected to ${wallet.address}` :
          'Connect to Terra Station'
        }
      </button>
    </div>
  );

  function connect() {
    const extension = new Extension();
    extension.connect();
    extension.on('onConnect', (w: ConnectResponse) => {
      setWallet(w);
    });
  }
}

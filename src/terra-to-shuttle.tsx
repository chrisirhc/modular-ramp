import React, { useState } from "react";
import { Extension, Wallet } from "@terra-money/terra.js";

export function TerraToShuttle() {
  const [wallet, setWallet] = useState<Wallet | null>(null);

  return (
    <div>
      <h3>Terra To Shuttle</h3>
      <button onClick={connect}>Connect to Terra Station</button>
    </div>
  );

  function connect() {
    const extension = new Extension();
    extension.connect();
    extension.on("connect", (w: Wallet) => {
      setWallet(w);
    });
  }
}

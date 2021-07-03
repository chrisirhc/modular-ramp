import React, { useEffect, useRef, useState, useContext } from "react";
import {
  LCDClient,
  Extension,
  Coin,
  Coins,
  Dec,
  MsgSend,
  StdFee,
  CreateTxOptions,
  Int,
} from "@terra-money/terra.js";
import { TerraContext } from "./WalletConnector";
import { TerraToEth, EstTx, Run } from "./operations/terra";
import { getLCDClient, printTerraAmount, TERRA_DECIMAL } from "./utils";

export function TerraToShuttle() {
  const [estTx, setEstTx] = useState<EstTx | null>(null);
  const amountToConvertInputEl = useRef<HTMLInputElement>(null);
  const terraContext = useContext(TerraContext);
  const { address, balance, extension } = terraContext;
  const uusdBal = balance && balance.get("uusd");

  return (
    <div>
      <h3>Terra To Shuttle</h3>
      <div>
        <label>
          Amount to convert from UST{" "}
          <input
            type="number"
            min={1}
            max={
              (uusdBal && uusdBal.amount.div(TERRA_DECIMAL).toString()) || ""
            }
            ref={amountToConvertInputEl}
          />
        </label>
        <button
          onClick={() => {
            const value = amountToConvertInputEl.current?.value;
            if (!value) {
              console.error("No balance", value);
              return;
            }
            toShuttle(value);
          }}
        >
          Estimate
        </button>
        <EstTxToShuttle estTx={estTx} extension={extension} balance={balance} />
      </div>
    </div>
  );

  async function toShuttle(uusdDec: string) {
    setEstTx(await TerraToEth(uusdDec, { terraContext }));
  }
}

type EstTxToShuttleProps = {
  balance: Coins | null;
  estTx: EstTx | null;
  extension: Extension | null;
};

function EstTxToShuttle({ balance, estTx, extension }: EstTxToShuttleProps) {
  const [convertStatus, setConvertStatus] = useState<string | null>(null);
  const terraContext = useContext(TerraContext);

  if (!estTx) {
    return null;
  }

  const uusdFees = estTx.estFees?.amount.get("uusd");
  if (!uusdFees) {
    return null;
  }

  const fees = estTx.estFees?.amount.get("uusd");
  const expectedNewBalance =
    fees && balance?.get("uusd")?.sub(estTx.amount)?.sub(fees);

  return (
    <div>
      <pre>
        {`Amount: ${printTerraAmount(estTx.amount)}
Fees: ${printTerraAmount(fees)}
Expected new balance: ${printTerraAmount(expectedNewBalance)}
Estimated amount to expect in Ethereum: ${printTerraAmount(
          estTx.amount.sub(estTx.relayingFee.amount)
        )}`}
      </pre>
      <button
        onClick={() =>
          Run(estTx, { onProgress: setConvertStatus, terraContext })
        }
        disabled={Boolean(convertStatus)}
      >
        {convertStatus ? convertStatus : "Convert!"}
      </button>
    </div>
  );
}

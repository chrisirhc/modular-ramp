import React, { useContext, useEffect, useState, useRef } from "react";
import {
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
} from "@chakra-ui/react";

import { StepProps } from "../types";
import {
  EthereumContext,
  EthereumContextProps,
} from "../wallet/MetamaskWalletConnector";
import { TerraContext, TerraContextProps } from "../TerraWalletConnector";
import { WaitForBalanceChange } from "../operations/terra";
import { Run as EthereumRun, EthToTerra, PrepTx } from "../operations/ethereum";

EthToTerraStep.stepTitle = "Ethereum to Terra Bridge";

export function EthToTerraStep({
  isToExecute,
  onExecuted = () => {},
}: StepProps) {
  const terraContext = useContext(TerraContext);
  const ethereumContext = useContext(EthereumContext);
  const [amount, setAmount] = useState<string>("0");
  const [estTx, setEstTx] = useState<PrepTx>();
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const txRef = useRef<PrepTx>();

  // Run estimates on the amount
  useEffect(() => {
    // To Shuttle
    if (!amount) {
      return;
    }
    // Don't run this if amount didn't change from the past estimate
    // TODO: Is this really necessary? Seems like an effect of not using the right abstractions.
    if (
      estTx &&
      estTx.type === "shuttleBurn" &&
      amount === estTx.shuttleBurnArgs.ustAmount
    ) {
      return;
    }
    let canceled = false;

    // To Shuttle
    EthToTerra(amount, {
      terraContext,
      ethereumContext,
    }).then(
      (tx) => {
        if (canceled) {
          console.debug("Canceled estimation", amount);
          return;
        }
        setEstTx(tx);
        console.debug("New estimated tx", tx);
      },
      (e) => {
        if (canceled) {
          console.debug("Canceled estimation failed", amount, e);
          return;
        }
        console.error("Error", e);
      }
    );

    return () => {
      canceled = true;
    };
  }, [amount, estTx, ethereumContext, terraContext]);

  useEffect(() => {
    if (!isToExecute) {
      return;
    }
    // No transaction estimate yet
    if (!estTx) {
      return;
    }
    // Has a status so status hasn't been reset.
    if (status) {
      return;
    }
    // Transaction in progress
    if (txRef.current === estTx) {
      return;
    }
    txRef.current = estTx;
    console.debug("Executing tx", estTx);
    setProgress("Sending Transaction");
    run({
      estTx,
      terraContext,
      ethereumContext,
      onProgress: setProgress,
    }).then(
      () => {
        setStatus("Success");
        setProgress("");
      },
      (e) => {
        console.error("Error in transaction", e);
        setStatus("Failed");
        setProgress("");
      }
    );
  }, [isToExecute, status, estTx, terraContext, ethereumContext]);

  useEffect(() => {
    if (!status) {
      return;
    }
    onExecuted(status);
  }, [status, onExecuted]);

  // No constraints, pick whatever you want and handle the estimates
  return (
    <>
      <FormControl>
        Eth to Terra Bridge
        <FormLabel>Amount</FormLabel>
        <InputGroup>
          <Input
            placeholder="Enter amount"
            type="number"
            pr="4.5rem"
            min="0"
            value={amount || ""}
            disabled={isToExecute}
            onChange={(event) => setAmount(event.target.value)}
          />
          <InputRightElement
            pointerEvents="none"
            color="gray.300"
            fontSize="1.2em"
            width="4.5rem"
            children="UST"
          />
        </InputGroup>
      </FormControl>
      {progress ? <Spinner /> : null}
      {progress || status}
    </>
  );
}

async function run({
  estTx,
  terraContext,
  ethereumContext,
  onProgress,
}: {
  estTx: PrepTx;
  terraContext: TerraContextProps;
  ethereumContext: EthereumContextProps;
  onProgress: (status: string) => void;
}) {
  onProgress("Preparing for transaction...");
  // Get a snapshot of the current balance. So that we can watch for balance changes
  // if coins were bridged.
  await terraContext.refreshBalance();
  await EthereumRun(estTx, { ethereumContext, onProgress });
  // TODO: This doesn't get the new balance immediately :|
  // Try another method to poll, possibly another UX pattern.
  ethereumContext.refreshBalance();
  // This is naive and just watches for any changes in the balance.
  // This doesn't watch for changes in CW20 coins, only native coins.
  onProgress("Waiting for transaction on Terra side");
  await WaitForBalanceChange({ terraContext, ethereumContext });
}

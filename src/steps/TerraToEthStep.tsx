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
import { EthereumContext, EthereumContextProps } from "../EthWalletConnector";
import { TerraContext, TerraContextProps } from "../TerraWalletConnector";
import { TerraToEth, Run as TerraRun, EstTx } from "../operations/terra";
import { waitForShuttle as EthWaitForShuttle } from "../operations/ethereum";

TerraToEthStep.stepTitle = "Terra to Ethereum Bridge";

export function TerraToEthStep({
  isToExecute,
  onExecuted = () => {},
}: StepProps) {
  const terraContext = useContext(TerraContext);
  const ethereumContext = useContext(EthereumContext);
  const [amount, setAmount] = useState<string>("0");
  const [estTx, setEstTx] = useState<EstTx>();
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const txRef = useRef<EstTx>();

  // Run estimates on the amount
  useEffect(() => {
    // To Shuttle
    if (!amount) {
      return;
    }
    // Don't run this if amount didn't change from the past estimate
    // TODO: Is this really necessary? Seems like an effect of not using the right abstractions.
    if (amount === estTx?.amountStr) {
      return;
    }
    let canceled = false;
    TerraToEth(amount, {
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
        Terra To Eth Step
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
  estTx: EstTx;
  terraContext: TerraContextProps;
  ethereumContext: EthereumContextProps;
  onProgress: (status: string) => void;
}) {
  await TerraRun(estTx, { terraContext, onProgress });
  terraContext.refreshBalance();
  onProgress("Waiting for transaction on Eth side");
  await EthWaitForShuttle({ ethereumContext, terraContext });
  ethereumContext.refreshBalance();
  onProgress("Waiting for transaction on Eth side");
}

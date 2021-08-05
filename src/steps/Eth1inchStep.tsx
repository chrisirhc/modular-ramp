import React, { useContext, useEffect, useState, useRef } from "react";
import {
  Button,
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
import {
  estimate as OneInchEstimate,
  Arg as EstimateArg,
  convertTxForTxArg,
} from "../operations/1inch";
import {
  Run as EthereumRun,
  PrepTx,
  UST_CONTRACT,
} from "../operations/ethereum";
import { utils } from "ethers";

Eth1inchStep.stepTitle = "Ethereum 1inch Transaction";

export function Eth1inchStep({
  isToExecute,
  onExecuted = () => {},
}: StepProps) {
  const terraContext = useContext(TerraContext);
  const ethereumContext = useContext(EthereumContext);
  const [amount, setAmount] = useState<string>("0");
  const [estTx, setEstTx] = useState<EstimateArg>();
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const txRef = useRef<EstimateArg>();

  // Run estimates on the amount
  useEffect(() => {
    // To Shuttle
    if (!amount) {
      return;
    }
    // Don't run this if amount didn't change from the past estimate
    // TODO: Is this really necessary? Seems like an effect of not using the right abstractions.
    if (estTx && amount === estTx.info.amountString) {
      return;
    }
    let canceled = false;

    OneInchEstimate(
      {
        amountString: amount,
        inputCurrency: "UST",
        outputCurrency: "USDC",
      },
      { ethereumContext }
    ).then(
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
      estTx: estTx.args,
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
        Eth 1inch
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
        <Button
          onClick={() =>
            approve(amount, { ethereumContext, onProgress: setProgress })
          }
        >
          Approve
        </Button>
      </FormControl>
      {progress ? <Spinner /> : null}
      {progress || status}
    </>
  );
}

async function approve(
  amountString: string,
  {
    ethereumContext,
    onProgress,
  }: {
    ethereumContext: EthereumContextProps;
    onProgress: (status: string) => void;
  }
) {
  const amount = utils.parseEther(amountString);
  const fromTokenAddress = UST_CONTRACT.mainnet;
  const approveUrl = `https://api.1inch.exchange/v3.0/1/approve/calldata?amount=${amount}&tokenAddress=${fromTokenAddress}`;
  const approveRequest = await fetch(approveUrl).then((r) => r.json());
  const approveRequestTx = convertTxForTxArg(approveRequest);
  await EthereumRun(
    { type: "tx", txArg: approveRequestTx },
    { ethereumContext, onProgress }
  );
}

async function run({
  estTx,
  ethereumContext,
  onProgress,
}: {
  estTx: PrepTx;
  terraContext: TerraContextProps;
  ethereumContext: EthereumContextProps;
  onProgress: (status: string) => void;
}) {
  onProgress("Preparing for transaction...");
  await EthereumRun(estTx, { ethereumContext, onProgress });
  // TODO: This doesn't get the new balance immediately :|
  // Try another method to poll, possibly another UX pattern.
  ethereumContext.refreshBalance();
}

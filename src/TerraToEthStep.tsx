import React, { useContext, useEffect, useState, useRef } from "react";
import {
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
} from "@chakra-ui/react";

import { EthereumContext, EthereumContextProps } from "./EthWalletConnector";
import { TerraContext, TerraContextProps } from "./TerraWalletConnector";
import {
  TerraToEth,
  Run as TerraRun,
  RunArg as TerraRunArg,
  WaitForBalanceChange,
  EstTx,
} from "./operations/terra";
import {
  EthToTerra,
  Run as EthereumRun,
  RunArg as EthereumRunArg,
  waitForShuttle as EthWaitForShuttle,
} from "./operations/ethereum";
import { estimate as OneInchEstimate } from "./operations/1inch";
import { BlockChain, BlockChainType, BLOCKCHAIN_OPTIONS } from "./constants";
import { WalletContexts } from "./types";

// TODO: Does the ConversionStep's state need to be centrally managed? Guess not.
// That can be a new future feature if needed.
export interface StepProps {
  isToExecute: boolean;
}

export function TerraToEthStep({ isToExecute }: StepProps) {
  const terraContext = useContext(TerraContext);
  const ethereumContext = useContext(EthereumContext);
  const [amount, setAmount] = useState<string>("0");
  const [estTx, setEstTx] = useState<EstTx>();
  const [status, setStatus] = useState<string>("");
  const lastEstTx = useRef(null);

  useEffect(() => {
    // To Shuttle
    if (!amount) {
      throw new Error("No input amount");
    }
    let canceled = false;
    setEstTx(undefined);
    TerraToEth(amount, {
      terraContext,
      ethereumContext,
    }).then(
      (tx) => {
        if (canceled) {
          return;
        }
        setEstTx(tx);
        console.debug("New estimated tx", tx);
      },
      (e) => {
        console.error("Error", e);
      }
    );

    return () => {
      canceled = true;
    };
  }, [amount, ethereumContext, terraContext]);

  useEffect(() => {
    if (isToExecute && estTx) {
      // Kick off execution
      console.log("executing the step");
      run({ estTx, terraContext, ethereumContext, onProgress: setStatus });
    }
  }, [isToExecute, estTx, terraContext, ethereumContext]);

  /*
  isToExecute starts the execution and updates the progress here.
  */

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
      {status ? (
        <>
          <Spinner />
          {status}
        </>
      ) : null}
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

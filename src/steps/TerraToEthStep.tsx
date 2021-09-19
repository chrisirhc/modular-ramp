import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  ChangeEventHandler,
} from "react";
import {
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  VStack,
  HStack,
  Text,
} from "@chakra-ui/react";

import { StepProps } from "../types";
import { EthereumContext, EthereumContextProps } from "../EthWalletConnector";
import { TerraContext, TerraContextProps } from "../TerraWalletConnector";
import { TerraToEth, Run as TerraRun, EstTx } from "../operations/terra";
import { waitForShuttle as EthWaitForShuttle } from "../operations/ethereum";

TerraToEthStep.stepTitle = "Terra to Ethereum Bridge";

function useEstimateTx(amount: string) {
  const terraContext = useContext(TerraContext);
  const ethereumContext = useContext(EthereumContext);
  const [estTx, setEstTx] = useState<EstTx>();

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

  return estTx;
}

function useExecuteTx(isToExecute: boolean, estTx: EstTx | undefined) {
  const terraContext = useContext(TerraContext);
  const ethereumContext = useContext(EthereumContext);
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const txRef = useRef<EstTx>();

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
    // Transaction already in progress
    if (txRef.current) {
      console.warn(
        `${
          txRef.current === estTx ? "Same" : "Different"
        } transaction already in progress.`
      );
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

  return [status, progress];
}

export function TerraToEthStep({
  isToExecute,
  onExecuted = () => {},
}: StepProps) {
  const [amount, setAmount] = useState<string>("0");
  const estTx = useEstimateTx(amount);
  const [status, progress] = useExecuteTx(isToExecute, estTx);

  // Call onExecuted callback if status is available
  useEffect(() => {
    if (!status) {
      return;
    }
    onExecuted(status);
  }, [status, onExecuted]);

  // No constraints, pick whatever you want and handle the estimates
  return (
    <TerraToEthStepRender
      amount={amount}
      isToExecute={isToExecute}
      onAmountChanged={(event) => setAmount(event.target.value)}
      progress={progress}
      status={status}
    />
  );
}

export interface TerraToEthStepRenderProps {
  amount: string;
  isToExecute: boolean;
  onAmountChanged: ChangeEventHandler<HTMLInputElement>;
  progress: string;
  status: string;
}

export function TerraToEthStepRender({
  amount,
  isToExecute,
  onAmountChanged,
  progress,
  status,
}: TerraToEthStepRenderProps) {
  return (
    <VStack>
      <FormControl>
        <FormLabel>Amount to bridge to Ethereum</FormLabel>
        <InputGroup>
          <Input
            placeholder="Enter amount"
            type="number"
            pr="4.5rem"
            min="0"
            value={amount || ""}
            disabled={isToExecute}
            onChange={onAmountChanged}
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
      <HStack>
        {progress ? <Spinner /> : null}
        {status === "Success" ? <Text>🟢</Text> : null}
        <Text color={status && status !== "Success" ? "red" : "current"}>
          {progress || status}
        </Text>
      </HStack>
    </VStack>
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

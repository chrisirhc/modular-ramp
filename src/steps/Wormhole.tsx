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
import { utils } from "ethers";
import { BigNumberish } from "@ethersproject/bignumber";

import { StepProps } from "../types";
import { EthereumContext, EthereumContextProps } from "../EthWalletConnector";
import { TerraContext, TerraContextProps } from "../TerraWalletConnector";

import {
  transferFromEth,
  CHAIN_ID_SOLANA,
  hexToUint8Array,
  nativeToHexString,
} from "@certusone/wormhole-sdk";
import { POLYGON_TOKEN_BRIDGE_ADDRESS } from "../operations/polygon";

WormholeBridge.stepTitle = "Terra to Ethereum Bridge";

interface EstTx {
  tokenAddress: string;
  recipientAddress: Uint8Array;
  amount: BigNumberish;
  amountStr: string;
}

function useEstimateTx(amount: string) {
  const terraContext = useContext(TerraContext);
  const ethereumContext = useContext(EthereumContext);
  const [estTx, setEstTx] = useState<EstTx>();

  // https://polygonscan.com/token/0x2791bca1f2de4661ed88a30c99a7a9449aa84174
  const TOKEN_ADDRESS = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
  const RECIPIENT_ADDRESS = "FSAUrk51D1yfxkgeNhMUo3t9bedMuWt2MJLCAsVHMKHz";

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

    const recipientHexString = nativeToHexString(
      RECIPIENT_ADDRESS,
      CHAIN_ID_SOLANA
    );
    if (!recipientHexString) {
      return;
    }
    const recipientAddress = hexToUint8Array(recipientHexString);

    setEstTx({
      amount: utils.parseEther(amount),
      amountStr: amount,
      tokenAddress: TOKEN_ADDRESS,
      recipientAddress,
    });

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
    const { networkType, signer } = ethereumContext;
    if (!networkType || !signer) {
      return;
    }

    txRef.current = estTx;
    console.debug("Executing tx", estTx);
    setProgress("Sending Transaction");

    const tx = transferFromEth(
      POLYGON_TOKEN_BRIDGE_ADDRESS[networkType],
      signer,
      estTx.tokenAddress,
      // TODO: Should use the token's decimals
      estTx.amount,
      CHAIN_ID_SOLANA,
      estTx.recipientAddress
    );

    tx.then(
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

export function WormholeBridge({
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

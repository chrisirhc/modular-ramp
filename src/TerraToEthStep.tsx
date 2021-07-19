import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Select,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  StackDivider,
  Box,
  HStack,
  Heading,
  Code,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";

import { EthereumContext, EthereumContextProps } from "./EthWalletConnector";
import { TerraContext, TerraContextProps } from "./TerraWalletConnector";
import {
  TerraToEth,
  Run as TerraRun,
  RunArg as TerraRunArg,
  WaitForBalanceChange,
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
  const [amount, setAmount] = useState<string>("0");

  useEffect(() => {
    if (isToExecute) {
      // Kick off execution
      console.log("executing the step");
    }
  }, [isToExecute]);

  /*
  isToExecute starts the execution and updates the progress here.
  */

  // useEffect(() => {
  //   if (!input || !output) {
  //     return;
  //   }
  //   const estStep = estimateStep(input, output, {
  //     terraContext,
  //     ethereumContext,
  //   });
  //   estStep
  //     .then((e) => {
  //       if (!output.amount && e.info.outputAmount) {
  //         setAmount(e.info.outputAmount);
  //       }
  //     })
  //     .catch((e) => {
  //       console.debug(e);
  //     });
  // }, [input, output, terraContext, ethereumContext]);

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
    </>
  );
}

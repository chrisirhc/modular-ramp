import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
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
  AccordionIcon,
} from "@chakra-ui/react";

import {EthereumContext, EthereumContextProps} from "./EthWalletConnector";
import {TerraContext, TerraContextProps} from "./WalletConnector";
import {TerraToEth} from "./operations/terra";

type Currency = {
  network: 'eth' | 'terra' | 'bsc',
  currency: 'UST' | 'USDC' | string | null,
  amount?: string, // Might need to check on a standard amount
  // there's some fees involved
};

type FirstStepProps = {
  onChange: (output: Currency) => void,
  // output, fees
};

type ConversionStepProps = {
  stepNumber: number,
  input: Currency,
  onChange: (output: Currency) => void,
  // output, fees
};

export function AllSteps() {
  const [steps, setSteps] = useState<Currency[]>([]);
  return (
    <Box p={4} shadow="md" borderWidth="1px" borderRadius="md" m={5}>
      <VStack 
        divider={<StackDivider borderColor="gray.200" />}
        spacing={4}>
        <FirstStep onChange={(output) => setSteps([output, ...steps.slice(1)])}/>
        { steps.map((step, i) => (
          <Step
            stepNumber={i}
            key={i}
            input={step}
            onChange={(output) => setSteps([
              ...steps.slice(0, i + 1),
              output,
              ...steps.slice(i + 2)
            ])} />
        )) }
        <TransactionSummary steps={steps} />
      </VStack>
    </Box>
  );
}

export function FirstStep({onChange}: FirstStepProps) {
  const [network, setNetwork] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // No constraints, pick whatever you want and handle the estimates
  return (
    <>
      <HStack>
        <FormControl>
          <FormLabel>Network</FormLabel>
          <Select placeholder="Select network"
            onChange={(event) => setNetwork(event.target.value)}>
            <option>eth</option>
            <option>terra</option>
            <option>bsc</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Currency</FormLabel>
          <Select placeholder="Select currency"
            onChange={(event) => setCurrency(event.target.value)}>
            <option>UST</option>
            <option>USDC</option>
          </Select>
        </FormControl>
      </HStack>
      <FormControl>
        <FormLabel>Amount</FormLabel>
        <InputGroup>
          <Input
            placeholder="Enter amount"
            type="number"
            pr="4.5rem"
            ref={amountInputRef}
            />
          <InputRightElement
            pointerEvents="none"
            color="gray.300"
            fontSize="1.2em"
            width="4.5rem"
            children={currency}
          />
        </InputGroup>
      </FormControl>
      <Button mt={5} onClick={() => {
        if (!(network === 'eth' || network === 'bsc' || network === 'terra')) {
          return;
        }
        // TODO: Leave validations for later.
        // if (!(currency === 'UST' || currency === 'USDC')) {
        //   return;
        // }
        if (!amountInputRef.current) {
          return;
        }
        onChange({
          network,
          currency,
          amount: amountInputRef.current.value,
        })
      }}>Next</Button>
    </>
  );
}

export function Step({stepNumber, input, onChange}: ConversionStepProps) {
  // Input is first step, it restricts output currency
  return (
    <Box>
      <Heading size="md">Step {stepNumber + 1}</Heading>
      <FirstStep onChange={onChange} />
    </Box>
  );
}

type TransactionSummaryProps = {
  steps: Currency[],
};

function TransactionSummary({steps}: TransactionSummaryProps) {
  const terraContext = useContext(TerraContext);
  const ethereumContext = useContext(EthereumContext);
  const [executionSteps, setExecutionSteps] = useState<Step[] | null>(null);

  return (
    <VStack bg="tomato" m={5} p={2} borderRadius="md" align="start">
      <Heading size="lg">Summary</Heading>
      <Code as="pre">{JSON.stringify(steps, null, 2)}</Code>
      <Button onClick={() =>
        estimate({steps, terraContext, ethereumContext}, setExecutionSteps)}>
        Estimate Transaction
      </Button>
      {
        executionSteps && (
          <Box>
            <Accordion allowToggle>
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    Show Debug Info
                  </Box>
                </AccordionButton>
                <AccordionPanel>
                  <Code w="500px" as="pre" fontSize="8">{JSON.stringify(executionSteps, null, 2)}</Code>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
            <Button onClick={() =>
              execute({executionSteps, terraContext, ethereumContext})}>
              Execute
            </Button>
          </Box>
        )
      }
    </VStack>
  );
}

type estimateArg = {
  steps: Currency[],
  terraContext: TerraContextProps,
  ethereumContext: EthereumContextProps,
};

type Step = {
  network: 'eth' | 'terra' | 'bsc',
  args: {},
  info: {},
};

async function estimate(
  {steps, terraContext, ethereumContext}: estimateArg,
  setExecutionSteps: (steps: Step[]) => void) {
  // Do a bunch of things and then update the estimates and create intermediate transactions.
  const executionSteps: Step[] = [];
  for (let i = 1; i < steps.length; i++) {
    executionSteps.push(await estimateStep(steps[i-1], steps[i], {terraContext, ethereumContext}));
  }
  setExecutionSteps(executionSteps);
}

async function estimateStep(
  input: Currency, output: Currency,
  {terraContext, ethereumContext}: {terraContext: TerraContextProps, ethereumContext: EthereumContextProps}): Promise<Step> {
  if (input.network === 'terra' && output.network === 'eth') {
    // To Shuttle
    if (!input.amount) {
      throw new Error('No input amount');
    }
    const estTx = await TerraToEth(input.amount, {terraContext});
    return {
      network: 'terra',
      args: estTx,
      info: estTx,
    };
  } else if (input.network === 'eth' && output.network === 'terra') {
    // To Shuttle
  } else if (input.network === 'eth' && output.network === 'eth') {
    // 1inch route
  }

  throw new Error(
    `Unimplemented operation ${JSON.stringify(input)} to ${JSON.stringify(output)}`
  )
}

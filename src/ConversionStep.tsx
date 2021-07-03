import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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

type Currency = {
  network: "eth" | "terra" | "bsc";
  currency: "UST" | "USDC" | string | null;
  amount?: string; // Might need to check on a standard amount
  // there's some fees involved
};

type FirstStepProps = {
  input?: Currency;
  onChange: (output: Currency) => void;
  // output, fees
};

type Status = string | null;

type ConversionStepProps = {
  stepNumber: number;
  input: Currency;
  onChange: (output: Currency) => void;
  status: Status;
  // output, fees
};

export function AllSteps() {
  const [steps, setSteps] = useState<Currency[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  return (
    <Box p={4} shadow="md" borderWidth="1px" borderRadius="md" m={5}>
      <VStack divider={<StackDivider borderColor="gray.200" />} spacing={4}>
        <FirstStep
          onChange={(output) => setSteps([output, ...steps.slice(1)])}
        />
        {steps.map((step, i) => (
          <Step
            stepNumber={i}
            key={i}
            input={step}
            onChange={(output) =>
              setSteps([
                ...steps.slice(0, i + 1),
                output,
                ...steps.slice(i + 2),
              ])
            }
            status={statuses[i]}
          />
        ))}
        <TransactionSummary steps={steps} onStatusesChange={setStatuses} />
      </VStack>
    </Box>
  );
}

export function FirstStep({ input, onChange }: FirstStepProps) {
  const [network, setNetwork] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // No constraints, pick whatever you want and handle the estimates
  return (
    <>
      <HStack>
        <FormControl>
          <FormLabel>Network</FormLabel>
          <Select
            placeholder="Select network"
            onChange={(event) => setNetwork(event.target.value)}
          >
            <option>eth</option>
            <option>terra</option>
            {/* <option>bsc</option> */}
          </Select>
        </FormControl>
        {input?.network !== "terra" ? (
          <FormControl>
            <FormLabel>Currency</FormLabel>
            <Select
              placeholder="Select currency"
              onChange={(event) => setCurrency(event.target.value)}
            >
              <option>UST</option>
              <option>USDC</option>
            </Select>
          </FormControl>
        ) : null}
      </HStack>
      <FormControl>
        <FormLabel>Amount</FormLabel>
        <InputGroup>
          <Input
            placeholder="Enter amount"
            type="number"
            pr="4.5rem"
            ref={amountInputRef}
            min="0"
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
      <Button
        mt={5}
        onClick={() => {
          if (
            !(network === "eth" || network === "bsc" || network === "terra")
          ) {
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
          });
        }}
      >
        Next
      </Button>
    </>
  );
}

export function Step({
  stepNumber,
  input,
  onChange,
  status,
}: ConversionStepProps) {
  // Input is first step, it restricts output currency
  return (
    <Box>
      <Heading size="md">Step {stepNumber + 1}</Heading>
      <FirstStep input={input} onChange={onChange} />
      {status ? (
        <>
          <Spinner />
          {status}
        </>
      ) : null}
    </Box>
  );
}

type TransactionSummaryProps = {
  steps: Currency[];
  onStatusesChange: (statuses: Status[]) => void;
};

export function TransactionSummary({
  steps,
  onStatusesChange,
}: TransactionSummaryProps) {
  const terraContext = useContext(TerraContext);
  const ethereumContext = useContext(EthereumContext);
  const [executionSteps, setExecutionSteps] = useState<Step[] | null>(null);

  const bg = useColorModeValue("teal.100", "teal.800");
  return (
    <VStack bg={bg} m={5} p={2} borderRadius="md" align="start">
      <Heading size="lg">Summary</Heading>
      <Code as="pre">{JSON.stringify(steps, null, 2)}</Code>
      <Button
        onClick={() =>
          estimate({ steps, terraContext, ethereumContext }, setExecutionSteps)
        }
      >
        Estimate Transaction
      </Button>
      {executionSteps && (
        <Box>
          <Accordion allowToggle>
            <AccordionItem>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  Show Debug Info
                </Box>
              </AccordionButton>
              <AccordionPanel>
                <Code w="500px" as="pre" fontSize="8">
                  {JSON.stringify(executionSteps, null, 2)}
                </Code>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
          <Button
            onClick={() =>
              execute({
                executionSteps,
                steps,
                terraContext,
                ethereumContext,
                onStatusesChange,
              })
            }
          >
            Execute
          </Button>
        </Box>
      )}
    </VStack>
  );
}

type estimateArg = {
  steps: Currency[];
  terraContext: TerraContextProps;
  ethereumContext: EthereumContextProps;
};

type Step =
  | {
      network: "eth";
      args: EthereumRunArg;
      info: {};
    }
  | {
      network: "terra";
      args: TerraRunArg;
      info: {};
    };

async function estimate(
  { steps, terraContext, ethereumContext }: estimateArg,
  setExecutionSteps: (steps: Step[]) => void
) {
  // Do a bunch of things and then update the estimates and create intermediate transactions.
  const executionSteps: Step[] = [];
  for (let i = 1; i < steps.length; i++) {
    executionSteps.push(
      await estimateStep(steps[i - 1], steps[i], {
        terraContext,
        ethereumContext,
      })
    );
  }
  setExecutionSteps(executionSteps);
}

async function estimateStep(
  input: Currency,
  output: Currency,
  {
    terraContext,
    ethereumContext,
  }: { terraContext: TerraContextProps; ethereumContext: EthereumContextProps }
): Promise<Step> {
  if (input.network === "terra" && output.network === "eth") {
    // To Shuttle
    if (!input.amount) {
      throw new Error("No input amount");
    }
    const estTx = await TerraToEth(input.amount, {
      terraContext,
      ethereumContext,
    });
    return {
      network: "terra",
      args: estTx,
      info: estTx,
    };
  } else if (input.network === "eth" && output.network === "terra") {
    if (!input.amount) {
      throw new Error("No input amount");
    }
    // To Shuttle
    const estTx = await EthToTerra(input.amount, {
      terraContext,
      ethereumContext,
    });
    return {
      network: "eth",
      args: estTx,
      info: estTx,
    };
  } else if (input.network === "eth" && output.network === "eth") {
    if (!input.amount) {
      throw new Error("No input amount");
    }
    const { currency: inputCurrency } = input;
    const { currency: outputCurrency } = output;
    if (!inputCurrency || !outputCurrency) {
      throw new Error("No specified input/output currencies");
    }

    // 1inch route
    const ret = await OneInchEstimate(
      {
        amountString: input.amount,
        inputCurrency,
        outputCurrency,
      },
      { ethereumContext }
    );
    return {
      network: "eth",
      args: ret.args,
      info: ret.info,
    };
  }

  throw new Error(
    `Unimplemented operation ${JSON.stringify(input)} to ${JSON.stringify(
      output
    )}`
  );
}

type executeArg = {
  executionSteps: Step[];
  steps: Currency[];
  terraContext: TerraContextProps;
  ethereumContext: EthereumContextProps;
  onStatusesChange: (statuses: Status[]) => void;
};

async function execute({
  executionSteps,
  steps,
  terraContext,
  ethereumContext,
  onStatusesChange,
}: executeArg) {
  const statuses: Status[] = [];
  for (let i = 0; i < executionSteps.length; i++) {
    const step = executionSteps[i];
    const onProgress = (status: Status) => {
      statuses[i] = status;
      onStatusesChange(statuses);
    };
    onProgress("Initiating step...");
    switch (step.network) {
      case "terra":
        await TerraRun(step.args, { terraContext, onProgress });
        terraContext.refreshBalance();
        onProgress("Waiting for transaction on Eth side");
        await EthWaitForShuttle({ ethereumContext, terraContext });
        ethereumContext.refreshBalance();
        break;
      case "eth":
        if (steps[i + 1].network === "terra") {
          onProgress("Preparing for transaction...");
          // Get a snapshot of the current balance. So that we can watch for balance changes
          // if coins were bridged.
          await terraContext.refreshBalance();
        }
        await EthereumRun(step.args, { ethereumContext, onProgress });
        // TODO: This doesn't get the new balance immediately :|
        // Try another method to poll, possibly another UX pattern.
        ethereumContext.refreshBalance();
        if (steps[i + 1].network === "terra") {
          // This is naive and just watches for any changes in the balance.
          // This doesn't watch for changes in CW20 coins, only native coins.
          onProgress("Waiting for transaction on Terra side");
          await WaitForBalanceChange({ terraContext, ethereumContext });
        }
        break;
    }
    onProgress(null);
  }
}

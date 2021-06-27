import React, { createContext, useEffect, useRef, useState } from "react";
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
} from "@chakra-ui/react";

type Currency = {
  network: 'eth' | 'terra' | 'bsc',
  currency: 'UST' | 'USDC',
  amount: string, // Might need to check on a standard amount
  // there's some fees involved
};

type FirstStepProps = {
  onChange: (output: Currency) => void,
  // output, fees
};

type ConversionStepProps = {
  input: Currency,
  onChange: (output: Currency) => void,
  // output, fees
};

export function AllSteps() {
  const [steps, setSteps] = useState<Currency[]>([]);
  return (
    <>
      <FirstStep onChange={(output) => setSteps([output, ...steps.slice(1)])}/>
      { steps.map((step, i) => (
        <Step 
          key={i}
          input={step}
          onChange={(output) => setSteps([...steps.slice(0, i), output, ...steps.slice(i + 1)])} />
      )) }
    </>
  );
}

export function FirstStep({onChange}: FirstStepProps) {
  const [network, setNetwork] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // No constraints, pick whatever you want and handle the estimates
  return (
    <>
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
          {/* <InputRightElement children={<CheckIcon color="green.500" />} /> */}
        </InputGroup>
      </FormControl>
      <Button onClick={() => {
        if (!(network === 'eth' || network === 'bsc' || network === 'terra')) {
          return;
        }
        if (!(currency === 'UST' || currency === 'USDC')) {
          return;
        }
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

export function Step({input, onChange}: ConversionStepProps) {
  // Input is first step, it restricts output currency
  return (null);
}
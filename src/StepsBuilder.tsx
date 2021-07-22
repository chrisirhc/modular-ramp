import React, { useContext, useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Spinner,
  VStack,
} from "@chakra-ui/react";

import { STEPS } from "./steps";
import { StepComponent, StepProps } from "./types";

// This wrapper is necessary. Otherwise, setState think it's a setState function
// and call it instead of setting the value of the state to it.
interface StepComponentWrapper {
  Component: StepComponent;
}

function StepSelector(stepProps: StepProps) {
  const [Step, setStep] = useState<StepComponentWrapper>();
  return (
    <Box>
      <Select
        onChange={(e) => setStep({ Component: STEPS[Number(e.target.value)] })}
        placeholder="Select Step"
      >
        {STEPS.map((Step, i) => (
          <option key={i} value={i}>
            {Step.stepTitle}
          </option>
        ))}
      </Select>
      {Step?.Component ? <Step.Component {...stepProps} /> : null}
    </Box>
  );
}

export function StepsBuilder() {
  const [steps, setSteps] = useState<StepProps[]>([{ isToExecute: false }]);
  console.log(steps);
  return (
    <VStack>
      {steps.map((s) => (
        <StepSelector {...s} />
      ))}
      <Button onClick={() => setSteps([...steps, { isToExecute: false }])}>
        Add Step
      </Button>
    </VStack>
  );
}

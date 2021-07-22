import React, { useContext, useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  HStack,
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
    <Box
      bg="gray.50"
      p={4}
      shadow="md"
      borderWidth="1px"
      borderRadius="md"
      m={2}
    >
      <Flex>
        <Select
          onChange={(e) =>
            setStep({ Component: STEPS[Number(e.target.value)] })
          }
          placeholder="Select Step"
          mr="1"
        >
          {STEPS.map((Step, i) => (
            <option key={i} value={i}>
              {Step.stepTitle}
            </option>
          ))}
        </Select>
        <Button>X</Button>
      </Flex>
      {Step?.Component ? <Step.Component {...stepProps} /> : null}
    </Box>
  );
}

export function StepsBuilder() {
  const [steps, setSteps] = useState<StepProps[]>([{ isToExecute: false }]);
  const [isToExecute, setIsToExecute] = useState<boolean>(false);

  useEffect(() => {
    if (isToExecute && !steps[0].isToExecute) {
      setSteps([{ isToExecute: true }, ...steps.slice(1)]);
    }
  }, [isToExecute, steps]);

  return (
    <VStack
      bg="gray.100"
      p={4}
      shadow="md"
      borderWidth="1px"
      borderRadius="md"
      m={5}
    >
      {steps.map((s, stepNumber) => (
        <StepSelector
          {...s}
          onExecuted={() => {
            if (isToExecute && steps[stepNumber + 1]) {
              // Execute the next step
              setSteps([
                ...steps.slice(0, stepNumber + 1),
                { isToExecute: true },
                ...steps.slice(stepNumber + 2),
              ]);
            }
          }}
        />
      ))}
      <HStack>
        <Button
          colorScheme="blue"
          onClick={() => setSteps([...steps, { isToExecute: false }])}
        >
          Add Step
        </Button>
        <Button colorScheme="green" onClick={() => setIsToExecute(true)}>
          Execute
        </Button>
      </HStack>
    </VStack>
  );
}

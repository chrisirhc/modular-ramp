import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Select,
  slideFadeConfig,
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
        <Button onClick={stepProps.onRemoveStep}>X</Button>
      </Flex>
      {Step?.Component ? <Step.Component {...stepProps} /> : null}
    </Box>
  );
}

let STEP_ID_COUNT = 0;
function generateId() {
  return STEP_ID_COUNT++;
}

function generateStep() {
  return { key: generateId(), isToExecute: false };
}

export function StepsBuilder() {
  const [steps, setSteps] = useState<StepProps[]>(() => [generateStep()]);
  const [lastStepExecuted, setLastStepExecuted] = useState<number>(-1);
  const [isToExecute, setIsToExecute] = useState<boolean>(false);

  useEffect(() => {
    // If it's to start executing
    if (!isToExecute) {
      return;
    }
    if (!steps[0].isToExecute) {
      setSteps([{ ...steps[0], isToExecute: true }, ...steps.slice(1)]);
      return;
    }
    if (
      lastStepExecuted >= 0 &&
      steps[lastStepExecuted + 1] &&
      !steps[lastStepExecuted + 1].isToExecute
    ) {
      setSteps([
        ...steps.slice(0, lastStepExecuted + 1),
        generateStep(),
        ...steps.slice(lastStepExecuted + 1),
      ]);
    }
  }, [isToExecute, steps, lastStepExecuted]);

  const allSteps = useMemo(
    () =>
      steps.map((s, stepNumber) => (
        <StepSelector
          // Note that s contains s.key which sets this up.
          {...s}
          onRemoveStep={() => {
            setSteps([
              ...steps.slice(0, stepNumber),
              ...steps.slice(stepNumber + 1),
            ]);
          }}
          onExecuted={() => {
            setLastStepExecuted(stepNumber);
          }}
        />
      )),
    [steps]
  );

  return (
    <VStack
      bg="gray.100"
      p={4}
      shadow="md"
      borderWidth="1px"
      borderRadius="md"
      m={5}
    >
      {allSteps}
      <HStack>
        <Button
          colorScheme="blue"
          onClick={() => setSteps([...steps, { isToExecute: false }])}
        >
          Add Step
        </Button>
        <Button
          colorScheme="green"
          onClick={() => setIsToExecute(true)}
          disabled={isToExecute}
        >
          {isToExecute ? "Executing" : "Execute"}
        </Button>
      </HStack>
    </VStack>
  );
}

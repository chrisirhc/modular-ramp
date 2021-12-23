import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Grid,
  Flex,
  HStack,
  Select,
  slideFadeConfig,
  VStack,
  useColorModeValue,
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
  const bg = useColorModeValue("gray.50", "gray.950");

  return (
    <Box bg={bg} p={4} shadow="md" borderWidth="1px" borderRadius="md" m={2}>
      <Flex>
        <Select
          onChange={(e) =>
            setStep({ Component: STEPS[Number(e.target.value)] })
          }
          placeholder="Select Operation"
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

export function ComponentGrid() {
  const [steps, setSteps] = useState<StepProps[]>(() => [generateStep()]);

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
        />
      )),
    [steps]
  );

  const bg = useColorModeValue("gray.100", "gray.800");

  return (
    <VStack bg={bg} p={4} shadow="md" borderWidth="1px" borderRadius="md" m={5}>
      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
        {allSteps}
      </Grid>
      <HStack>
        <Button
          colorScheme="blue"
          onClick={() => setSteps([...steps, generateStep()])}
        >
          Add Operation
        </Button>
      </HStack>
    </VStack>
  );
}

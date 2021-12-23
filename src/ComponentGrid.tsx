import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Grid,
  Flex,
  HStack,
  Select,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

import { STEPS, STEP_MAP } from "./steps";
import { StepProps } from "./types";

function StepSelector(stepProps: StepProps) {
  const { stepType, onSetStepType = () => {} } = stepProps;
  const Step = useMemo(
    () => (stepType ? STEP_MAP[stepType] : null),
    [stepType]
  );
  const bg = useColorModeValue("gray.50", "gray.950");

  return (
    <Box bg={bg} p={4} shadow="md" borderWidth="1px" borderRadius="md" m={2}>
      <Flex>
        <Select
          value={stepType}
          onChange={(e) => onSetStepType(e.target.value)}
          placeholder="Select Operation"
          mr="1"
        >
          {STEPS.map((Step, i) => (
            <option key={i} value={Step.stepTitle}>
              {Step.stepTitle}
            </option>
          ))}
        </Select>
        <Button onClick={stepProps.onRemoveStep}>X</Button>
      </Flex>
      {Step ? <Step {...stepProps} /> : null}
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

export function ComponentGrid({ initialState = () => [generateStep()] }) {
  const [steps, setSteps] = useState<StepProps[]>(initialState);

  const allSteps = useMemo(
    () =>
      steps.map((s, stepNumber) => (
        <StepSelector
          // Note that s contains s.key which sets this up.
          {...s}
          onSetStepType={(stepType: string) => {
            setSteps([
              ...steps.slice(0, stepNumber),
              { ...s, stepType },
              ...steps.slice(stepNumber + 1),
            ]);
          }}
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

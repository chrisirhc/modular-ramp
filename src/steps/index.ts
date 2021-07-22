import React from "react";
import { StepComponent } from "../types";
import { EthToTerraStep } from "./EthToTerraStep";
import { TerraToEthStep } from "./TerraToEthStep";

export const STEPS: ReadonlyArray<StepComponent> = [
  EthToTerraStep,
  TerraToEthStep,
];

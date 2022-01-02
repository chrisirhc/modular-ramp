import { StepComponent } from "../types";
import { WormholeBridge } from "./Wormhole";
import { Anchor } from "./Anchor";
import { SaberSwap } from "./SaberSwap";

export const STEPS: ReadonlyArray<StepComponent> = [
  WormholeBridge,
  Anchor,
  SaberSwap,
];

export const STEP_MAP: Record<string, StepComponent> = {
  [WormholeBridge.stepTitle]: WormholeBridge,
  [Anchor.stepTitle]: Anchor,
  [SaberSwap.stepTitle]: SaberSwap,
};

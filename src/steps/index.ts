import { StepComponent } from "../types";
import { WormholeBridge } from "./Wormhole";
import { Anchor } from "./Anchor";

export const STEPS: ReadonlyArray<StepComponent> = [WormholeBridge, Anchor];

export const STEP_MAP: Record<string, StepComponent> = {
  [WormholeBridge.stepTitle]: WormholeBridge,
  [Anchor.stepTitle]: Anchor,
};

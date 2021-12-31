import { EthereumContextProps } from "./wallet/MetamaskWalletConnector";
import { TerraContextProps } from "./TerraWalletConnector";

export type WalletContexts = {
  ethereumContext: EthereumContextProps;
  terraContext: TerraContextProps;
};

export interface StepComponent extends React.FunctionComponent<StepProps> {
  stepTitle: string;
}

// TODO: Does the ConversionStep's state need to be centrally managed? Guess not.
// That can be a new future feature if needed.
export interface StepProps {
  stepType?: string;
  isToExecute: boolean;
  onExecuted?: (status: string) => void;
  onRemoveStep?: () => void;
  onSetStepType?: (stepType: string) => void;
}

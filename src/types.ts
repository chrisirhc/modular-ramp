import { EthereumContextProps } from "./EthWalletConnector";
import { TerraContextProps } from "./TerraWalletConnector";

export type WalletContexts = {
  ethereumContext: EthereumContextProps;
  terraContext: TerraContextProps;
};

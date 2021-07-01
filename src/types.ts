import { EthereumContextProps } from "./EthWalletConnector";
import { TerraContextProps } from "./WalletConnector";

export type WalletContexts = {
  ethereumContext: EthereumContextProps,
  terraContext: TerraContextProps
};

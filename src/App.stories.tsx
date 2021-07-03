import React from "react";
import { WalletConnector } from "./WalletConnector";
import { TerraToShuttle } from "./terra-to-shuttle";
import { EthSideComponent } from "./eth-side";
import { EthToTerra } from "./eth-to-terra";
import { EthWalletConnector } from "./EthWalletConnector";
import { AllSteps } from "./ConversionStep";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  title: "App",
};

export function NewApp() {
  return (
    <ChakraProvider>
      <div className="App">
        <WalletConnector>
          <EthWalletConnector>
            <AllSteps />
          </EthWalletConnector>
        </WalletConnector>
      </div>
    </ChakraProvider>
  );
}

export function OldApp() {
  return (
    <div className="App">
      <WalletConnector>
        <EthWalletConnector>
          <TerraToShuttle />
          <EthSideComponent />
          <EthToTerra />
        </EthWalletConnector>
      </WalletConnector>
    </div>
  );
}

import React from "react";
import { WalletConnector } from "./WalletConnector";
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
          <AllSteps />
        </WalletConnector>
      </div>
    </ChakraProvider>
  );
}
import React from "react";
import { Box, Button, HStack, Heading, useColorMode } from "@chakra-ui/react";
import { WalletConnector } from "./WalletConnector";
import { AllSteps } from "./ConversionStep";

function App() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <div className="App">
      <HStack pt={2} px={5} justify="space-between">
        <Heading>Modular Ramp</Heading>
        <Box textAlign="right">
          <Button onClick={toggleColorMode}>
            Toggle {colorMode === "light" ? "Dark" : "Light"}
          </Button>
        </Box>
      </HStack>
      <WalletConnector>
        <AllSteps />
      </WalletConnector>
    </div>
  );
}

export default App;

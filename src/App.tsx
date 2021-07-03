import React from "react";
import { Box, Button, useColorMode } from "@chakra-ui/react";
import { WalletConnector } from "./WalletConnector";
import { AllSteps } from "./ConversionStep";

function App() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <div className="App">
      <Box textAlign="right">
        <Button onClick={toggleColorMode}>
          Toggle {colorMode === "light" ? "Dark" : "Light"}
        </Button>
      </Box>
      <WalletConnector>
        <AllSteps />
      </WalletConnector>
    </div>
  );
}

export default App;

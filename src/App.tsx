import React from "react";
import { WalletConnector } from "./WalletConnector";
import { AllSteps } from "./ConversionStep";

function App() {
  return (
    <div className="App">
      <WalletConnector>
        <AllSteps />
      </WalletConnector>
    </div>
  );
}

export default App;

import React from "react";
import { WalletConnector } from "./WalletConnector";
import Header from "./Header";
import { StepsBuilder } from "./StepsBuilder";

function App() {
  return (
    <div className="App">
      <Header />
      <WalletConnector>
        <StepsBuilder />
      </WalletConnector>
    </div>
  );
}

export default App;

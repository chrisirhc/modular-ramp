import React from "react";
import { WalletConnector } from "./WalletConnector";
import Header from "./Header";
import { ComponentGrid } from "./ComponentGrid";

function App() {
  return (
    <div className="App">
      <Header />
      <WalletConnector>
        <ComponentGrid />
      </WalletConnector>
    </div>
  );
}

export default App;

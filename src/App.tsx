import React from 'react';
import logo from './logo.svg';
import './App.css';
import { WalletConnector } from "./WalletConnector";
import { TerraToShuttle } from "./terra-to-shuttle";
import { EthSideComponent } from "./eth-side";
import { EthToTerra } from "./eth-to-terra";
import { EthWalletConnector } from './EthWalletConnector';
import MockDesign from "./MockDesign";
import { AllSteps } from './ConversionStep';

function App() {
  return (
    <div className="App">
      <WalletConnector>
        <EthWalletConnector>
          <AllSteps />
          {/* <TerraToShuttle />
          <EthSideComponent />
          <EthToTerra /> */}
        </EthWalletConnector>
      </WalletConnector>
    </div>
  );
}

export default App;

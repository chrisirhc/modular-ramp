import React from 'react';
import { WalletConnector } from "./WalletConnector";
import { EthWalletConnector } from './EthWalletConnector';
import { AllSteps } from './ConversionStep';

function App() {
  return (
    <div className="App">
      <WalletConnector>
        <EthWalletConnector>
          <AllSteps />
        </EthWalletConnector>
      </WalletConnector>
    </div>
  );
}

export default App;

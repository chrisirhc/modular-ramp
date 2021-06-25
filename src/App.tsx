import React from 'react';
import logo from './logo.svg';
import './App.css';
import { WalletConnector } from "./WalletConnector";
import { TerraToShuttle } from "./terra-to-shuttle";
import { EthSideComponent } from "./eth-side";
import { EthToTerra } from "./eth-to-terra";


function App() {
  return (
    <div className="App">
      <WalletConnector>
        <TerraToShuttle />
        <EthSideComponent />
        <EthToTerra />
      </WalletConnector>
    </div>
  );
}

export default App;

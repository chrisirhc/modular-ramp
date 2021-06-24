import React from 'react';
import logo from './logo.svg';
import './App.css';
import { TerraToShuttle } from "./terra-to-shuttle";
import { EthSideComponent } from "./eth-side";
import { EthToTerra } from "./eth-to-terra";

function App() {
  return (
    <div className="App">
      <TerraToShuttle />
      <EthSideComponent />
      <EthToTerra />
    </div>
  );
}

export default App;

import React from 'react';
import logo from './logo.svg';
import './App.css';
import { TerraToShuttle } from "./terra-to-shuttle";
import { EthSideComponent } from "./eth-side";

function App() {
  return (
    <div className="App">
      <TerraToShuttle />
      <EthSideComponent />
    </div>
  );
}

export default App;

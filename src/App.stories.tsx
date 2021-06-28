import React from 'react';
import { WalletConnector } from "./WalletConnector";
import { TerraToShuttle } from "./terra-to-shuttle";
import { EthSideComponent } from "./eth-side";
import { EthToTerra } from "./eth-to-terra";
import { EthWalletConnector } from './EthWalletConnector';

export default {
  title: 'OldApp',
};

export function App() {
  return (
    <div className="App">
      <WalletConnector>
        <EthWalletConnector>
          <TerraToShuttle />
          <EthSideComponent />
          <EthToTerra />
        </EthWalletConnector>
      </WalletConnector>
    </div>
  );
}

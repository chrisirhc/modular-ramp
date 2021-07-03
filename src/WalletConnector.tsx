import React, { createContext, useEffect, useRef, useState } from "react";
import { Box, Button, HStack } from "@chakra-ui/react";
import {EthWalletConnector, EthereumContext, EthereumContextProps} from "./EthWalletConnector";
import {TerraWalletConnector, TerraContext, TerraContextProps} from "./TerraWalletConnector";

type Props = {
  children: React.ReactNode;
};

export function WalletConnector({children}: Props) {
  const [terraContext, setTerraContext] = useState<TerraContextProps>({
    extension: null,
    address: null,
    balance: null,
    refreshBalance: () => {},
  });
  const [ethereumContext, setEthereumContext] = useState<EthereumContextProps>({
    USTBalance: null,
    publicAddress: null,
    provider: null,
    signer: null,
    refreshBalance: () => {},
  });

  return (
    <Box>
      <Box p={4} shadow="md" borderWidth="1px" borderRadius="md" m={5}>
        <HStack>
          <EthWalletConnector onChange={setEthereumContext} />
          <TerraWalletConnector onChange={setTerraContext} />
        </HStack>
      </Box>
      <Box>
        <TerraContext.Provider value={terraContext}>
          <EthereumContext.Provider value={ethereumContext}>
            {children}
          </EthereumContext.Provider>
        </TerraContext.Provider>
      </Box>
    </Box>
  );
}
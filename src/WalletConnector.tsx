import React, { createContext, useEffect, useRef, useState } from "react";
import { Box, Button, HStack, Select } from "@chakra-ui/react";
import {
  EthWalletConnector,
  EthereumContext,
  EthereumContextProps,
} from "./EthWalletConnector";
import {
  TerraWalletConnector,
  TerraContext,
  TerraContextProps,
} from "./TerraWalletConnector";

type Props = {
  children: React.ReactNode;
};

export function WalletConnector({ children }: Props) {
  const [whichNet, setWhichNet] = useState("ropstentequila");
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
        <Box>
          <Select
            mb={2}
            value={whichNet}
            onChange={(e) => setWhichNet(e.target.value)}
            borderColor={whichNet === "mainnet" ? "red.500" : undefined}
            bg={whichNet === "mainnet" ? "red.500" : "transparent"}
          >
            <option value="ropstentequila">Ropsten / Tequila</option>
            <option value="mainnet">Mainnet</option>
          </Select>
        </Box>
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

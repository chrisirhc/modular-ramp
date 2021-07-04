import React, { createContext, useEffect, useRef, useState } from "react";
import { Box, Button, HStack, Select, Wrap, WrapItem } from "@chakra-ui/react";
import {
  DEFAULT_NETWORK_TYPE,
  NetworkType,
  NETWORK_TYPES,
  NETWORK_TYPE_OPTIONS,
} from "./constants";
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
  const [networkType, setNetworkType] =
    useState<NetworkType>(DEFAULT_NETWORK_TYPE);
  const [terraContext, setTerraContext] = useState<TerraContextProps>({
    extension: null,
    address: null,
    balance: null,
    refreshBalance: () => {},
    networkType: DEFAULT_NETWORK_TYPE,
  });
  const [ethereumContext, setEthereumContext] = useState<EthereumContextProps>({
    USTBalance: null,
    publicAddress: null,
    provider: null,
    signer: null,
    refreshBalance: () => {},
    networkType: DEFAULT_NETWORK_TYPE,
  });

  return (
    <Box>
      <Box p={4} shadow="md" borderWidth="1px" borderRadius="md" m={5}>
        <Box>
          <Select
            mb={2}
            value={networkType}
            onChange={(e) => setNetworkType(e.target.value as NetworkType)}
            borderColor={networkType === "mainnet" ? "red.500" : undefined}
            bg={networkType === "mainnet" ? "red.500" : "transparent"}
          >
            {NETWORK_TYPE_OPTIONS.map((networkType) => (
              <option key={networkType} value={networkType}>
                {NETWORK_TYPES[networkType]}
              </option>
            ))}
          </Select>
        </Box>
        <Wrap justify="space-evenly">
          <WrapItem>
            <EthWalletConnector
              networkType={networkType}
              onChange={setEthereumContext}
            />
          </WrapItem>
          <WrapItem>
            <TerraWalletConnector
              networkType={networkType}
              onChange={setTerraContext}
            />
          </WrapItem>
        </Wrap>
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

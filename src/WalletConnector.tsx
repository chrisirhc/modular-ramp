import React, { useState } from "react";
import { Box, Select, Wrap, WrapItem } from "@chakra-ui/react";
import {
  DEFAULT_NETWORK_TYPE,
  NetworkType,
  NETWORK_TYPES,
  NETWORK_TYPE_OPTIONS,
} from "./constants";
import { NetworkTypeContext } from "./wallet/NetworkTypeContext";
import {
  MetamaskWalletConnector,
  EthereumContext,
  EthereumContextProps,
} from "./wallet/MetamaskWalletConnector";
import { WalletConnectWalletProvider } from "./wallet/WalletConnectWalletProvider";
import {
  SolanaWalletProvider,
  SolanaWalletKey,
} from "./wallet/SolanaWalletProvider";
import {
  TerraWalletConnector,
  TerraContext,
  TerraContextProps,
} from "./TerraWalletConnector";
import { EthProviderProps } from "./wallet/EtherumWalletBase";

type Props = {
  children: React.ReactNode;
};

const ETH_WALLET_PROVIDERS = {
  metamask: {
    key: "metamask",
    name: "Metamask",
    element: MetamaskWalletConnector,
  },
  walletconnect: {
    key: "walletconnect",
    name: "WalletConnect",
    element: WalletConnectWalletProvider,
  },
};
const ETH_WALLET_PROVIDER_OPTIONS = [
  ETH_WALLET_PROVIDERS.metamask,
  ETH_WALLET_PROVIDERS.walletconnect,
];
function useEthWalletProvider(): [
  string,
  React.FC<EthProviderProps>,
  React.Dispatch<React.SetStateAction<keyof typeof ETH_WALLET_PROVIDERS>>
] {
  const [walletOptionKey, setWalletOptionKey] =
    useState<keyof typeof ETH_WALLET_PROVIDERS>("metamask");
  return [
    walletOptionKey,
    ETH_WALLET_PROVIDERS[walletOptionKey].element,
    setWalletOptionKey,
  ];
}

export function WalletConnector({ children }: Props) {
  const [networkType, setNetworkType] =
    useState<NetworkType>(DEFAULT_NETWORK_TYPE);
  const [terraContext, setTerraContext] = useState<TerraContextProps>({
    post: null,
    address: null,
    balance: null,
    refreshBalance: () => {},
    networkType: DEFAULT_NETWORK_TYPE,
    network: null,
  });
  const [ethereumContext, setEthereumContext] = useState<EthereumContextProps>({
    USTBalance: null,
    publicAddress: null,
    provider: null,
    signer: null,
    refreshBalance: () => {},
    networkType: DEFAULT_NETWORK_TYPE,
  });
  const [walletOptionKey, EthWalletProvider, setWalletOptionKey] =
    useEthWalletProvider();

  return (
    <NetworkTypeContext.Provider value={networkType}>
      <SolanaWalletProvider>
        <Box>
          <Box
            p={4}
            shadow="md"
            borderWidth="1px"
            borderRadius="md"
            m={5}
            position="relative"
          >
            <Box
              position="relative"
              width="100px"
              marginLeft="auto"
              marginRight="0"
            >
              <Select
                size="xs"
                variant="flushed"
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
                <Select
                  mb={2}
                  value={walletOptionKey}
                  onChange={(e) =>
                    setWalletOptionKey(
                      e.target.value as keyof typeof ETH_WALLET_PROVIDERS
                    )
                  }
                  borderColor={
                    networkType === "mainnet" ? "red.500" : undefined
                  }
                  bg={networkType === "mainnet" ? "red.500" : "transparent"}
                >
                  {ETH_WALLET_PROVIDER_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.name}
                    </option>
                  ))}
                </Select>
                <EthWalletProvider
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
              <WrapItem>
                <SolanaWalletKey />
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
      </SolanaWalletProvider>
    </NetworkTypeContext.Provider>
  );
}

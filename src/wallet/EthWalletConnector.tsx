import React, { useState } from "react";
import { Box, Select, Wrap, WrapItem } from "@chakra-ui/react";
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
} from "./MetamaskWalletConnector";
import { WalletConnectWalletProvider } from "./WalletConnectWalletProvider";

export function EthWalletConnector() {
  return (

    <Modal isOpen={isOpen} onClose={onClose}>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Modal Title</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Lorem count={2} />
      </ModalBody>

      <ModalFooter>
        <Button colorScheme='blue' mr={3} onClick={onClose}>
          Close
        </Button>
        <Button variant='ghost'>Secondary Action</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>

    <Select
    mb={2}
    value={walletOptionKey}
    onChange={(e) =>
      setWalletOptionKey(
        e.target.value as keyof typeof ETH_WALLET_PROVIDERS
      )
    }
    borderColor={networkType === "mainnet" ? "red.500" : undefined}
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
  )
}
import React, { createContext, useEffect, useRef, useState } from "react";
import { Box, Button, Flex, Heading, Grid, GridItem, Spacer } from "@chakra-ui/react"

export default function MockDesign() {
  return (
    <Box>
      <Flex>
        <Box bg="tomato">
          Terra
          <Button>Connect</Button>
        </Box>
        <Box>
          Ethereum
          <Button>Connect</Button>
        </Box>
      </Flex>
      <Box m={2} p={2} borderRadius="md" border="1px" borderColor="gray.200">
        Eth Wallet
      </Box>
      <Box m={2} p={2} borderRadius="md" border="1px" borderColor="gray.200">
        Terra Wallet
      </Box>
    </Box>
  );
}
import React from "react";
import { Box, Button, HStack, Heading, useColorMode } from "@chakra-ui/react";

function Header() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <HStack pt={2} px={5} justify="space-between">
      <Heading>Modular Ramp</Heading>
      <Box textAlign="right">
        <Button onClick={toggleColorMode}>
          Toggle {colorMode === "light" ? "Dark" : "Light"}
        </Button>
      </Box>
    </HStack>
  );
}

export default Header;

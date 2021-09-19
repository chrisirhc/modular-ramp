import React from "react";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import Header from "./Header";

export default {
  title: "Header",
};

export function DefaultHeader() {
  return (
    <>
      <ColorModeScript initialColorMode={"system"} />
      <ChakraProvider>
        <Header />
      </ChakraProvider>
    </>
  );
}

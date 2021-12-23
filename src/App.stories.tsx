import React from "react";
import App from "./App";
import { ChakraProvider } from "@chakra-ui/react";

export default {
  title: "App",
};

export function NewApp() {
  return (
    <ChakraProvider>
      <App />
    </ChakraProvider>
  );
}

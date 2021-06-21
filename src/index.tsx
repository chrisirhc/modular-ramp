import React from "react";
import { createRoot } from "react-dom";
import { EthSideComponent } from "./eth-side";

const root = createRoot(document.getElementById("root"));
root.render(<EthSideComponent />);
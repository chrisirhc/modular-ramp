import { useContext, createContext } from "react";
import { DEFAULT_NETWORK_TYPE, NetworkType } from "../constants";
export const NetworkTypeContext =
  createContext<NetworkType>(DEFAULT_NETWORK_TYPE);

export function useNetworkType() {
  const networkType = useContext(NetworkTypeContext);
  return networkType;
}

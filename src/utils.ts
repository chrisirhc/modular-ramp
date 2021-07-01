import { Coin, Dec, LCDClient } from "@terra-money/terra.js";

export const TERRA_DECIMAL = 1e6;

export function printTerraAmount(coin: Coin | null | undefined) {
  if (!coin) {
    return '';
  }
  return new Dec(coin.amount).div(TERRA_DECIMAL).toString()
    // Remove trailing space
    .replace(/\.?0+$/, '');
}

export function getLCDClient() {
  // connect to soju testnet
  return new LCDClient({
    URL: 'https://tequila-lcd.terra.dev',
    chainID: 'tequila-0004',
  }); 
}

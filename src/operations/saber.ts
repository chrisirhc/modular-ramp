import { TokenInfo } from "@saberhq/token-utils";
import { NetworkType } from "../constants";

export const TOKEN_LIST: Record<NetworkType, TokenInfo[]> = {
  testnet: [
    {
      address: "AAASPHk9YENqJy2fnd8hbc2FgcAeavvFUCz7pvWY5UHx",
      chainId: 103,
      decimals: 6,
      extensions: {
        source: "saber",
        underlyingTokens: [
          "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8",
          "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS",
        ],
        website:
          "https://app.saber.so/#/pools/8Uq15j3bmhMAhLjRYh8RsobfcAMhMsgPgJgPCdjxCZv5",
      },
      logoURI: "https://registry.saber.so/token-icons/slp.png",
      name: "Saber USDC-USDT LP",
      symbol: "USDC-USDT",
      tags: ["saber-stableswap-lp"],
    },
    {
      address: "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8",
      chainId: 103,
      decimals: 6,
      extensions: {
        currency: "USD",
      },
      logoURI: "https://registry.saber.so/token-icons/usdc.svg",
      name: "USD Coin",
      symbol: "USDC",
      tags: ["saber-mkt-usd"],
    },
    {
      address: "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS",
      chainId: 103,
      decimals: 6,
      extensions: {
        currency: "USD",
      },
      logoURI: "https://registry.saber.so/token-icons/usdt.svg",
      name: "Tether USD",
      symbol: "USDT",
      tags: ["saber-mkt-usd"],
    },
  ],
  mainnet: [
    {
      address: "9vMJfxuKxXBoEa7rM12mYLMwTacLMLDJqHozw96WQL8i",
      chainId: 101,
      decimals: 6,
      extensions: {
        address: "uusd",
        bridgeContract:
          "https://finder.terra.money/columbus-5/address/terra10nmmwe8r3g99a9newtqa7a75xfgs2e8z87r2sf",
        coingeckoId: "terra-usd",
        currency: "USD",
        source: "wormhole-v2",
        sourceUrl: "https://wormholebridge.com/#/transfer",
      },
      logoURI:
        "https://spl-token-icons.static-assets.ship.capital/icons/101/9vMJfxuKxXBoEa7rM12mYLMwTacLMLDJqHozw96WQL8i.png",
      name: "UST (Wormhole)",
      symbol: "UST",
      tags: ["wrapped", "wormhole", "saber-mkt-usd", "wormhole-v2"],
    },
    {
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      chainId: 101,
      decimals: 6,
      extensions: {
        coingeckoId: "usd-coin",
        currency: "USD",
        serumV3Usdt: "77quYg4MGneUdjgXCunt9GgM1usmrxKY31twEy3WHwcS",
        website: "https://www.centre.io/",
      },
      logoURI:
        "https://spl-token-icons.static-assets.ship.capital/icons/101/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png",
      name: "USD Coin",
      symbol: "USDC",
      tags: ["stablecoin", "saber-mkt-usd"],
    },
    {
      address: "E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M",
      chainId: 101,
      decimals: 6,
      extensions: {
        address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
        assetContract:
          "https://polygonscan.com/token/0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
        bridgeContract:
          "https://polygonscan.com/address/0x5a58505a96d1dbf8df91cb21b54419fc36e93fde",
        coingeckoId: "usd-coin",
        currency: "USD",
        source: "wormhole-v2",
        sourceUrl: "https://wormholebridge.com/#/transfer",
      },
      logoURI:
        "https://spl-token-icons.static-assets.ship.capital/icons/101/E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M.png",
      name: "USD Coin (Wormhole from Polygon)",
      symbol: "USDCpo",
      tags: ["wrapped", "saber-mkt-usd", "wormhole-v2"],
    },
    {
      address: "A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM",
      chainId: 101,
      decimals: 6,
      extensions: {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        assetContract:
          "https://etherscan.io/address/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        bridgeContract:
          "https://etherscan.io/address/0x3ee18B2214AFF97000D974cf647E7C347E8fa585",
        coingeckoId: "usd-coin",
        currency: "USD",
        source: "wormhole-v2",
        sourceUrl: "https://wormholebridge.com/#/transfer",
      },
      logoURI:
        "https://spl-token-icons.static-assets.ship.capital/icons/101/A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM.png",
      name: "USD Coin (Wormhole from Ethereum)",
      symbol: "USDCet",
      tags: ["wrapped", "saber-mkt-usd", "wormhole-v2"],
    },
  ],
};

interface Swap {
  addresses: {
    admin: string;
    lpTokenMint: string;
    mergePool: string;
    quarry: string;
    reserves: string[];
    swapAccount: string;
    swapAuthority: string;
  };
  currency: string;
  decimals: number;
  displayTokens: string[];
  id: string;
  isVerified: boolean;
  name: string;
  sources: string[];
  tags?: string[];
  underlyingTokens: string[];
}

export const SWAP_LIST: Record<NetworkType, Swap[]> = {
  testnet: [
    {
      addresses: {
        admin: "H9XuKqszWYirDmXDQ12TZXGtxqUYYn4oi7FKzAm7RHGc",
        lpTokenMint: "aaaVjWhPtRD12TRDeNyYS23Tu9EPukoL7qSjg1JhQpV",
        mergePool: "4AEy115NgRX96gKzuLVWDsLVkRbisSzfdJCUdRis7yvw",
        quarry: "B8cSxGzaT5GKLzTPg3jV9v7TaEn57dQAJsWymP9PqPSG",
        reserves: [
          "8uf2n7PP47xDgcqX6atLZzUMaLzJFNwQx5qFkRh8pEmR",
          "F7i3Fifztfy5E1opaeF2hHvevEa2Znu9ydePptLJZyPj",
        ],
        swapAccount: "GqFXS4HY5BB8E3VoKAiJqEaZ3yVgdjcSTpvJe6bMSZeP",
        swapAuthority: "7YUk9TEW8McBxRgib7HuBspoeap834anHyoEpGN1PcMr",
      },
      currency: "USD",
      decimals: 6,
      displayTokens: [
        "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8",
        "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS",
      ],
      id: "GqFXS4HY5BB8E3VoKAiJqEaZ3yVgdjcSTpvJe6bMSZeP",
      isVerified: false,
      name: "USDC-USDT",
      sources: [],
      underlyingTokens: [
        "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8",
        "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS",
      ],
    },
  ],
  mainnet: [
    {
      addresses: {
        admin: "H9XuKqszWYirDmXDQ12TZXGtxqUYYn4oi7FKzAm7RHGc",
        lpTokenMint: "USTCmQpbUGj5iTsXdnTYHZupY1QpftDZhLokSVk6UWi",
        mergePool: "4vCp4pgD6X4Hq1NEQfSXGmkcVxd7oxWhxUkkxnquX8WM",
        quarry: "BYEUtsLjYAVHRiRR3Avjqnd2RQLRL8n933N52p9kSX2y",
        reserves: [
          "J63v6qEZmQpDqCD8bd4PXu2Pq5ZbyXrFcSa3Xt1HdAPQ",
          "BnKQtTdLw9qPCDgZkWX3sURkBAoKCUYL1yahh6Mw7mRK",
        ],
        swapAccount: "KwnjUuZhTMTSGAaavkLEmSyfobY16JNH4poL9oeeEvE",
        swapAuthority: "9osV5a7FXEjuMujxZJGBRXVAyQ5fJfBFNkyAf6fSz9kw",
      },
      currency: "USD",
      decimals: 6,
      displayTokens: [
        "9vMJfxuKxXBoEa7rM12mYLMwTacLMLDJqHozw96WQL8i",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      ],
      id: "wust",
      isVerified: true,
      name: "UST-USDC",
      sources: ["wormhole-v2"],
      tags: ["wormhole-v2"],
      underlyingTokens: [
        "9vMJfxuKxXBoEa7rM12mYLMwTacLMLDJqHozw96WQL8i",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      ],
    },
    {
      addresses: {
        admin: "H9XuKqszWYirDmXDQ12TZXGtxqUYYn4oi7FKzAm7RHGc",
        lpTokenMint: "WLPyXq7WRfdWLiP4fvRfSisrfDzLiPmCeVTE6okKQWE",
        mergePool: "W1iD2Prhom5QaHpmLNbXAj2FbHwXwGuQJXtQyjAQ8rF",
        quarry: "Hutnp9RAkAaam3SGorHCjzYghrATZ9gkQTWdJ51QgXv",
        reserves: [
          "y8dALFo1bJrSzPYjMX14HJX448pXqYmrfXHD1K8MXih",
          "GN7Yuet3UyiWS5YVkEHv6oQKi4HGBJc3XDPt9zQhAqZz",
        ],
        swapAccount: "MATgk4zXLXtYkwBH678J1xZbRDZ45LicNzkRBHkxTuY",
        swapAuthority: "F6JFfyWaKTZY94rRzR5ftrtEKBS7aNLu1vYQiKuYhTZ6",
      },
      currency: "USD",
      decimals: 6,
      displayTokens: [
        "E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      ],
      id: "wpusdc",
      isVerified: true,
      name: "USDCpo-USDC",
      sources: ["wormhole-v2"],
      tags: ["wormhole-v2"],
      underlyingTokens: [
        "E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      ],
    },
    {
      addresses: {
        admin: "H9XuKqszWYirDmXDQ12TZXGtxqUYYn4oi7FKzAm7RHGc",
        lpTokenMint: "USDCgfM1psLGhAbx99iPA72mTySvUcVq33qhCJpm65c",
        mergePool: "Ac2cjEnCaoXSCPW6kFhzh9oL52CacrRcq851uALyB7m7",
        quarry: "7q5jvR4C6hFrC6tScyVKV4wE8km9koX537bud5iyw8ma",
        reserves: [
          "3YB7hfpBdbQEuZqLGWVDpRPmeZWCUsrrWyqGXegnQ6Cg",
          "4DPCj6Z1DsG6HUtwSogBGqXEUxdEV5a8YVrrFtcnz7UW",
        ],
        swapAccount: "GokA1R67GqSavkd15zR62QD68Tuc5AEfvjssntVDEbM8",
        swapAuthority: "7XFMgfxhDURuaPwhUkXAy6uQJCoC3HPpjiZBqcot57Ge",
      },
      currency: "USD",
      decimals: 6,
      displayTokens: [
        "A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      ],
      id: "weusdc",
      isVerified: true,
      name: "USDCet-USDC",
      sources: ["wormhole-v2"],
      tags: ["wormhole-v2"],
      underlyingTokens: [
        "A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      ],
    },
  ],
};

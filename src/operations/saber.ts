// Dev
export const tokenList = [
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
];

// Dev
export const swapList = [
  {
    addresses: {
      admin: "H9XuKqszWYirDmXDQ12TZXGtxqUYYn4oi7FKzAm7RHGc",
      lpTokenMint: "AAASPHk9YENqJy2fnd8hbc2FgcAeavvFUCz7pvWY5UHx",
      mergePool: "H3CUx9mn8xJ8g3t4uEpFFyxLvCkRCyaS2uYZ35WA2E3K",
      quarry: "9W8JucVbLmhuwTdshaVm6yK9zHaQndUmpGbqsqwxsyJV",
      reserves: [
        "9tcUgn5Fcbkh1Q1GLKQceAgKt576c8w5MuskH1cSi9x5",
        "4VtqtD2M5Jb1Du6RQ8YZepFuhFpSZhEjR7Ch3nJAdyLS",
      ],
      swapAccount: "8Uq15j3bmhMAhLjRYh8RsobfcAMhMsgPgJgPCdjxCZv5",
      swapAuthority: "AGfbvVd1EvivgFtYB5ZStjEuDdsewhBYuzb2LB9mG8LY",
    },
    currency: "USD",
    decimals: 6,
    displayTokens: [
      "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8",
      "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS",
    ],
    id: "8Uq15j3bmhMAhLjRYh8RsobfcAMhMsgPgJgPCdjxCZv5",
    isVerified: false,
    name: "USDC-USDT",
    sources: [],
    underlyingTokens: [
      "2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8",
      "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS",
    ],
  },
];

// Mainnet
export const mainnetTokenList = [
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
];

export const mainnetSwapList = [
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
];

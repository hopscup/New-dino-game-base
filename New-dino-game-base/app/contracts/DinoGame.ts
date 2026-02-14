export const DINO_CONTRACT_ADDRESS = "0xa44D213AaE99b028A062D97D17c496EC64Da479e";

export const DINO_CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "gamePrice",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "payToPlay",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "score", type: "uint256" }],
    name: "submitScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "player", type: "address" }],
    name: "getPersonalBest",
    outputs: [{ type: "uint256[3]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getGlobalTop10",
    outputs: [{
      type: "tuple[10]",
      components: [
        { name: "player", type: "address" },
        { name: "score", type: "uint256" }
      ]
    }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "player", type: "address" }],
    name: "gamesPlayed",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalGamesPlayed",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;
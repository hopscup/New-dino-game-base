const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000";

/**
 * MiniApp configuration object. Must follow the mini app manifest specification.
 *
 * @see {@link https://docs.base.org/mini-apps/features/manifest}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOi0xLCJ0eXBlIjoiYXV0aCIsImtleSI6IjB4OTcwZTBlMzFDMjkxOUEwZjQ1RTJDQjlGRWNjOTg0RjE0RkQ2MDM4MSJ9",
    payload: "eyJkb21haW4iOiJuZXctZGluby1nYW1lLWJhc2UudmVyY2VsLmFwcCJ9",
    signature: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEEoD52F6-zlydzw-rUycEYAJGBRgQGyLVTBAXckHig5RGBcTJOT0QjLuQStgb_ndGm0OEYNRw-5kMIlmBDIhu6eGwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  },
  baseBuilder: {
    ownerAddress: "",
  },
  miniapp: {
    version: "1",
    name: "Dino Run",
    subtitle: "Onchain Arcade on Base",
    description: "Pay 1 cent to play, compete for the global leaderboard. Scores stored fully onchain on Base.",
    screenshotUrls: [`${ROOT_URL}/screenshot.png`],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#0052FF",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "games",
    tags: ["game", "arcade", "onchain", "base"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Jump, survive, compete onchain",
    ogTitle: "Dino Run - Onchain Arcade on Base",
    ogDescription: "Pay 1 cent to play, compete for the global leaderboard. Scores stored fully onchain.",
    ogImageUrl: `${ROOT_URL}/hero.png`,
  },
} as const;

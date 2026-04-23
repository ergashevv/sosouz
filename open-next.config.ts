import { defineCloudflareConfig, type OpenNextConfig } from "@opennextjs/cloudflare";

const cloudflareConfig: OpenNextConfig = {
  ...defineCloudflareConfig({}),
  // OpenNext runs `npm run build` by default; our `build` script is OpenNext itself — avoid recursion.
  buildCommand: "npm run build:next",
};

export default cloudflareConfig;

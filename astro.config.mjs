import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://insight.hnlab.kr",
  output: "static",
  trailingSlash: "never",
  build: {
    format: "directory"
  }
});

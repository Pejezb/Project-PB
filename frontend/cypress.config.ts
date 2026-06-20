import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "hugdzu",
  allowCypressEnv: false,

  e2e: {
    baseUrl: "https://restaurantos.qoritum.com",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});

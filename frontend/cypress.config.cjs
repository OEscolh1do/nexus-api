const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173/nexus",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    supportFile: false,
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});

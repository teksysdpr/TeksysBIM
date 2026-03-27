import { createApp } from "./app.js";
import { appConfig } from "./config/env.js";

const app = createApp();

app.listen(appConfig.port, () => {
  console.log(`TeksysBIM backend listening on http://127.0.0.1:${appConfig.port}`);
  console.log(`Mode: ${appConfig.nodeEnv} | In-memory: ${appConfig.useInMemory}`);
});

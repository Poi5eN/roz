import { createServer } from "node:http";
import { resolve } from "node:path";
import { openDb } from "./db.js";
import { createApp } from "./app.js";

const port = Number(process.env.PORT || 3000);
const app = createApp(openDb(), { publicDir: resolve("public") });
createServer(app).listen(port, () => console.log(`Roz running on http://localhost:${port}`));

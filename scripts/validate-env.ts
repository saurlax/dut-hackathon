import "./load-env";

import { getServerEnv } from "../src/lib/env";

getServerEnv();
console.log("Environment configuration is valid.");

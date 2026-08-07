import "./load-env";

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../src/db/client";
import { getServerEnv } from "../src/lib/env";

async function main() {
  getServerEnv();
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Database migrations applied.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

#!/usr/bin/env -S deno run --allow-net --allow-env

import { search, searchAll, searchNpm, searchJsr, searchDeno } from "./src/search.ts";
import { detectRegistry, getRegistryInfo } from "./src/detector.ts";

const command = Deno.args[0];
const query = Deno.args[1];

if (!command || !query) {
  console.error("Usage: npx jsr @registry/mcp <command> <query>");
  console.error("\nCommands:");
  console.error("  search <query>           - Auto-detect and search registry");
  console.error("  search-all <query>       - Search all registries");
  console.error("  search-npm <query>      - Search npm only");
  console.error("  search-jsr <query>      - Search JSR only");
  console.error("  search-deno <query>      - Search Deno only");
  console.error("  detect <package>        - Detect registry for package");
  Deno.exit(1);
}

const limit = parseInt(Deno.args[2] || "20", 10);

try {
  switch (command) {
    case "search": {
      const result = await search(query, limit);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "search-all": {
      const results = await searchAll(query, limit);
      console.log(JSON.stringify(results, null, 2));
      break;
    }

    case "search-npm": {
      const result = await searchNpm(query, limit);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "search-jsr": {
      const result = await searchJsr(query, limit);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "search-deno": {
      const result = await searchDeno(query, limit);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "detect": {
      const registry = detectRegistry(query);
      const info = getRegistryInfo(registry);
      console.log(JSON.stringify({ package: query, registry, info }, null, 2));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      Deno.exit(1);
  }
} catch (error) {
  console.error("Error:", error instanceof Error ? error.message : String(error));
  Deno.exit(1);
}


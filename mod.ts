/**
 * @registry/mcp - Multi-Registry Package Search
 * 
 * A unified tool to search across multiple JavaScript/TypeScript package registries
 * including npm, JSR, Deno, and more. Auto-detects the appropriate registry
 * and provides comprehensive library information.
 * 
 * @example
 * ```ts
 * import { search, searchAll } from "@registry/mcp";
 * 
 * // Auto-detect and search
 * const result = await search("lodash");
 * 
 * // Search all registries
 * const results = await searchAll("express");
 * ```
 * 
 * @module
 */

export { search, searchAll, searchNpm, searchJsr, searchDeno } from "./src/search.ts";
export type { PackageInfo, SearchResult, RegistryType } from "./src/types.ts";
export { detectRegistry, getRegistryInfo } from "./src/detector.ts";
export type { RegistryInfo } from "./src/detector.ts";


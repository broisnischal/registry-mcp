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
export {
  getInstallCommand,
  getRemoveCommand,
  getUpdateCommand,
  getCiCommand,
} from "./src/package-manager.ts";
export type {
  PackageManagerResult,
  InstallOptions,
  RemoveOptions,
  UpdateOptions,
} from "./src/package-manager.ts";
export { checkVulnerabilities } from "./src/vulnerabilities.ts";
export type {
  Vulnerability,
  VulnerabilityResult,
} from "./src/vulnerabilities.ts";
export { getBundleSize } from "./src/bundle-size.ts";
export type { BundleSizeInfo } from "./src/bundle-size.ts";
export {
  getDependencyTree,
  getPeerDependencies,
  getOutdatedCommand,
  analyzeDependencies,
} from "./src/dependencies.ts";
export type {
  DependencyTree,
  DependencyNode,
  PeerDependencyInfo,
  OutdatedPackage,
  OutdatedResult,
  DependencyAnalysis,
} from "./src/dependencies.ts";
export {
  generateCDNImports,
  getCDNImports,
  searchCDNJS,
  searchUnpkg,
  searchJsDelivr,
  searchSkypack,
  searchEsmSh,
  searchAllCDNs,
} from "./src/cdn.ts";
export type {
  CDNProvider,
  CDNImport,
  CDNInfo,
  CDNSearchResult,
} from "./src/cdn.ts";
export {
  formatSearchResult,
  formatCDNImports,
  formatBundleSize,
  formatVulnerabilities,
  formatSize,
} from "./src/formatter.ts";


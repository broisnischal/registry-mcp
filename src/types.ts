export type RegistryType = "npm" | "jsr" | "deno" | "unknown";

export interface PackageInfo {
  name: string;
  version?: string;
  description?: string;
  author?: string;
  license?: string;
  repository?: string;
  homepage?: string;
  keywords?: string[];
  registry: RegistryType;
  registryUrl?: string;
  publishedAt?: string;
  downloads?: number;
  dependencies?: Record<string, string>;
  readme?: string;
}

export interface SearchResult {
  query: string;
  registry: RegistryType;
  packages: PackageInfo[];
  total?: number;
  error?: string;
}


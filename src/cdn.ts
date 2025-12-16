import type { RegistryType } from "./types.ts";
import { detectRegistry } from "./detector.ts";

export type CDNProvider = "unpkg" | "jsdelivr" | "cdnjs" | "skypack" | "esm.sh" | "deno.land" | "jsr.io";

export interface CDNImport {
  provider: CDNProvider;
  url: string;
  type: "esm" | "umd" | "cjs" | "iife";
  minified: boolean;
  description: string;
}

export interface CDNInfo {
  packageName: string;
  version?: string;
  registry: RegistryType;
  imports: CDNImport[];
  recommended?: CDNImport;
}

export interface CDNSearchResult {
  provider: CDNProvider;
  query: string;
  packages: Array<{
    name: string;
    version: string;
    description?: string;
    url: string;
  }>;
  total?: number;
  error?: string;
}

/**
 * Generate CDN import URLs for a package
 */
export function generateCDNImports(
  packageName: string,
  version?: string,
  registry?: RegistryType
): CDNInfo {
  const reg = registry || detectRegistry(packageName);
  const ver = version || "latest";
  const pkg = version ? `${packageName}@${version}` : packageName;

  const imports: CDNImport[] = [];

  // Unpkg - Works with npm packages
  if (reg === "npm" || reg === "unknown") {
    imports.push({
      provider: "unpkg",
      url: `https://unpkg.com/${pkg}`,
      type: "esm",
      minified: false,
      description: "Fast, global CDN for npm packages",
    });

    imports.push({
      provider: "unpkg",
      url: `https://unpkg.com/${pkg}?module`,
      type: "esm",
      minified: false,
      description: "ESM module from unpkg",
    });

    imports.push({
      provider: "unpkg",
      url: `https://unpkg.com/${pkg}/dist/index.min.js`,
      type: "umd",
      minified: true,
      description: "Minified UMD bundle from unpkg",
    });

    // jsDelivr
    imports.push({
      provider: "jsdelivr",
      url: `https://cdn.jsdelivr.net/npm/${pkg}`,
      type: "esm",
      minified: false,
      description: "Fast, reliable CDN with npm support",
    });

    imports.push({
      provider: "jsdelivr",
      url: `https://cdn.jsdelivr.net/npm/${pkg}/+esm`,
      type: "esm",
      minified: false,
      description: "ESM module from jsDelivr",
    });

    imports.push({
      provider: "jsdelivr",
      url: `https://cdn.jsdelivr.net/npm/${pkg}/dist/index.min.js`,
      type: "umd",
      minified: true,
      description: "Minified bundle from jsDelivr",
    });

    // Skypack
    imports.push({
      provider: "skypack",
      url: `https://cdn.skypack.dev/${pkg}`,
      type: "esm",
      minified: true,
      description: "Optimized ESM packages with automatic bundling",
    });

    imports.push({
      provider: "skypack",
      url: `https://cdn.skypack.dev/pin/${pkg}`,
      type: "esm",
      minified: true,
      description: "Pinned version from Skypack (stable)",
    });

    // esm.sh
    imports.push({
      provider: "esm.sh",
      url: `https://esm.sh/${pkg}`,
      type: "esm",
      minified: true,
      description: "Fast ESM CDN with TypeScript support",
    });

    imports.push({
      provider: "esm.sh",
      url: `https://esm.sh/${pkg}?bundle`,
      type: "esm",
      minified: true,
      description: "Bundled ESM from esm.sh",
    });
  }

  // JSR packages
  if (reg === "jsr") {
    // JSR packages are in format @scope/name
    const jsrPath = packageName.startsWith("@") 
      ? packageName.substring(1) 
      : packageName;
    imports.push({
      provider: "jsr.io",
      url: `https://jsr.io/${jsrPath}@${ver}`,
      type: "esm",
      minified: false,
      description: "Direct JSR CDN import",
    });

    // esm.sh also supports JSR
    imports.push({
      provider: "esm.sh",
      url: `https://esm.sh/jsr/${jsrPath}@${ver}`,
      type: "esm",
      minified: true,
      description: "JSR package via esm.sh",
    });
  }

  // Deno packages
  if (reg === "deno") {
    if (packageName.startsWith("https://deno.land")) {
      imports.push({
        provider: "deno.land",
        url: packageName,
        type: "esm",
        minified: false,
        description: "Direct Deno.land import",
      });
    }

    // esm.sh supports Deno packages
    imports.push({
      provider: "esm.sh",
      url: `https://esm.sh/${packageName}`,
      type: "esm",
      minified: true,
      description: "Deno package via esm.sh",
    });
  }

  // Recommend best CDN based on registry
  const recommended = imports.find((imp) => {
    if (reg === "npm" || reg === "unknown") {
      return imp.provider === "skypack" || imp.provider === "esm.sh";
    }
    if (reg === "jsr") {
      return imp.provider === "jsr.io";
    }
    return imp.provider === "deno.land";
  }) || imports[0];

  return {
    packageName,
    version: ver,
    registry: reg,
    imports,
    recommended,
  };
}

/**
 * Search for packages on CDNJS
 */
export async function searchCDNJS(
  query: string,
  limit = 20
): Promise<CDNSearchResult> {
  try {
    const response = await fetch(
      `https://api.cdnjs.com/libraries?search=${encodeURIComponent(query)}&fields=version,description&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`CDNJS search failed: ${response.statusText}`);
    }

    const data = await response.json();

    const packages = (data.results || []).map((pkg: any) => ({
      name: pkg.name,
      version: pkg.latest || pkg.version || "unknown",
      description: pkg.description,
      url: `https://cdnjs.cloudflare.com/ajax/libs/${pkg.name}/${pkg.latest || pkg.version}/`,
    }));

    return {
      provider: "cdnjs",
      query,
      packages,
      total: data.total,
    };
  } catch (error) {
    return {
      provider: "cdnjs",
      query,
      packages: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Search for packages on unpkg (via npm registry)
 */
export async function searchUnpkg(
  query: string,
  limit = 20
): Promise<CDNSearchResult> {
  try {
    // Unpkg uses npm registry, so we search npm
    const response = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Unpkg search failed: ${response.statusText}`);
    }

    const data = await response.json();

    const packages = (data.objects || []).map((obj: any) => {
      const pkg = obj.package;
      return {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        url: `https://unpkg.com/${pkg.name}@${pkg.version}`,
      };
    });

    return {
      provider: "unpkg",
      query,
      packages,
      total: data.total,
    };
  } catch (error) {
    return {
      provider: "unpkg",
      query,
      packages: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Search for packages on jsDelivr (via npm registry)
 */
export async function searchJsDelivr(
  query: string,
  limit = 20
): Promise<CDNSearchResult> {
  try {
    // jsDelivr uses npm registry
    const response = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${limit}`
    );

    if (!response.ok) {
      throw new Error(`jsDelivr search failed: ${response.statusText}`);
    }

    const data = await response.json();

    const packages = (data.objects || []).map((obj: any) => {
      const pkg = obj.package;
      return {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        url: `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}`,
      };
    });

    return {
      provider: "jsdelivr",
      query,
      packages,
      total: data.total,
    };
  } catch (error) {
    return {
      provider: "jsdelivr",
      query,
      packages: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Search for packages on Skypack
 */
export async function searchSkypack(
  query: string,
  limit = 20
): Promise<CDNSearchResult> {
  try {
    // Skypack uses npm registry
    const response = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Skypack search failed: ${response.statusText}`);
    }

    const data = await response.json();

    const packages = (data.objects || []).map((obj: any) => {
      const pkg = obj.package;
      return {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        url: `https://cdn.skypack.dev/${pkg.name}@${pkg.version}`,
      };
    });

    return {
      provider: "skypack",
      query,
      packages,
      total: data.total,
    };
  } catch (error) {
    return {
      provider: "skypack",
      query,
      packages: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Search for packages on esm.sh
 */
export async function searchEsmSh(
  query: string,
  limit = 20
): Promise<CDNSearchResult> {
  try {
    // esm.sh uses npm registry
    const response = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${limit}`
    );

    if (!response.ok) {
      throw new Error(`esm.sh search failed: ${response.statusText}`);
    }

    const data = await response.json();

    const packages = (data.objects || []).map((obj: any) => {
      const pkg = obj.package;
      return {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        url: `https://esm.sh/${pkg.name}@${pkg.version}`,
      };
    });

    return {
      provider: "esm.sh",
      query,
      packages,
      total: data.total,
    };
  } catch (error) {
    return {
      provider: "esm.sh",
      query,
      packages: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Search all CDNs
 */
export async function searchAllCDNs(
  query: string,
  limit = 20
): Promise<CDNSearchResult[]> {
  const [cdnjs, unpkg, jsdelivr, skypack, esmsh] = await Promise.all([
    searchCDNJS(query, limit),
    searchUnpkg(query, limit),
    searchJsDelivr(query, limit),
    searchSkypack(query, limit),
    searchEsmSh(query, limit),
  ]);

  return [cdnjs, unpkg, jsdelivr, skypack, esmsh];
}

/**
 * Get CDN import URLs with enhanced formatting
 */
export function getCDNImports(
  packageName: string,
  version?: string,
  registry?: RegistryType
): CDNInfo {
  return generateCDNImports(packageName, version, registry);
}


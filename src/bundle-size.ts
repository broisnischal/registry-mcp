import type { RegistryType } from "./types.ts";
import { detectRegistry } from "./detector.ts";

export interface BundleSizeInfo {
  package: string;
  version: string;
  size: {
    minified: number;
    minifiedGzipped: number;
    minifiedBrotli?: number;
  };
  registry: RegistryType;
  error?: string;
}

/**
 * Get bundle size information for npm packages using bundlephobia API
 */
export async function getNpmBundleSize(
  packageName: string,
  version?: string
): Promise<BundleSizeInfo> {
  try {
    const pkg = version ? `${packageName}@${version}` : packageName;
    const response = await fetch(
      `https://bundlephobia.com/api/size?package=${encodeURIComponent(pkg)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get bundle size: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      package: packageName,
      version: data.version || version || "latest",
      size: {
        minified: data.size || 0,
        minifiedGzipped: data.gzip || 0,
        minifiedBrotli: data.brotli || undefined,
      },
      registry: "npm",
    };
  } catch (error) {
    return {
      package: packageName,
      version: version || "unknown",
      size: {
        minified: 0,
        minifiedGzipped: 0,
      },
      registry: "npm",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get bundle size for a package (auto-detects registry)
 */
export async function getBundleSize(
  packageName: string,
  version?: string,
  registry?: RegistryType
): Promise<BundleSizeInfo> {
  const reg = registry || detectRegistry(packageName);

  switch (reg) {
    case "npm":
    case "unknown":
      return getNpmBundleSize(packageName, version);
    case "jsr":
    case "deno":
      // JSR/Deno bundle size checking not available via public API
      return {
        package: packageName,
        version: version || "unknown",
        size: {
          minified: 0,
          minifiedGzipped: 0,
        },
        registry: reg,
        error: "Bundle size checking not available for JSR/Deno packages",
      };
    default:
      return {
        package: packageName,
        version: version || "unknown",
        size: {
          minified: 0,
          minifiedGzipped: 0,
        },
        registry: reg,
        error: `Bundle size checking not supported for ${reg}`,
      };
  }
}


import type { RegistryType } from "./types.ts";
import { detectRegistry } from "./detector.ts";

export interface DependencyNode {
  name: string;
  version: string;
  dependencies?: DependencyNode[];
  devDependencies?: DependencyNode[];
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface DependencyTree {
  root: string;
  registry: RegistryType;
  tree: DependencyNode;
  error?: string;
}

export interface PeerDependencyInfo {
  package: string;
  peerDependencies: Record<string, string>;
  registry: RegistryType;
  error?: string;
}

export interface OutdatedPackage {
  package: string;
  current: string;
  wanted: string;
  latest: string;
  location: string;
  registry: RegistryType;
}

export interface OutdatedResult {
  packages: OutdatedPackage[];
  registry: RegistryType;
  error?: string;
}

/**
 * Get dependency tree for npm packages
 */
export async function getNpmDependencyTree(
  packageName: string,
  version?: string
): Promise<DependencyTree> {
  try {
    const pkg = version ? `${packageName}@${version}` : packageName;
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch package: ${response.statusText}`);
    }

    const data = await response.json();
    const latestVersion = version || data["dist-tags"]?.latest || Object.keys(data.versions).pop();
    const versionData = data.versions[latestVersion];

    const buildTree = (pkgData: any): DependencyNode => {
      return {
        name: pkgData.name || packageName,
        version: pkgData.version || latestVersion,
        dependencies: pkgData.dependencies
          ? Object.entries(pkgData.dependencies).map(([name, ver]) => ({
            name,
            version: ver as string,
          }))
          : undefined,
        devDependencies: pkgData.devDependencies
          ? Object.entries(pkgData.devDependencies).map(([name, ver]) => ({
            name,
            version: ver as string,
          }))
          : undefined,
        peerDependencies: pkgData.peerDependencies,
        optionalDependencies: pkgData.optionalDependencies,
      };
    };

    return {
      root: packageName,
      registry: "npm",
      tree: buildTree(versionData),
    };
  } catch (error) {
    return {
      root: packageName,
      registry: "npm",
      tree: {
        name: packageName,
        version: version || "unknown",
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get peer dependencies for a package
 */
export async function getPeerDependencies(
  packageName: string,
  registry?: RegistryType
): Promise<PeerDependencyInfo> {
  const reg = registry || detectRegistry(packageName);

  try {
    if (reg === "npm" || reg === "unknown") {
      const response = await fetch(
        `https://registry.npmjs.org/${encodeURIComponent(packageName)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch package: ${response.statusText}`);
      }

      const data = await response.json();
      const latestVersion = data["dist-tags"]?.latest || Object.keys(data.versions).pop();
      const versionData = data.versions[latestVersion];

      return {
        package: packageName,
        peerDependencies: versionData.peerDependencies || {},
        registry: "npm",
      };
    } else if (reg === "jsr") {
      // Parse JSR package name
      const parts = packageName.replace("@", "").split("/");
      const scope = parts[0];
      const name = parts[1] || parts[0];

      const response = await fetch(
        `https://jsr.io/api/packages/${scope}/${name}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch JSR package: ${response.statusText}`);
      }

      const data = await response.json();
      const latestVersion = data.latestVersion;
      const versionResponse = await fetch(
        `https://jsr.io/api/packages/${scope}/${name}/${latestVersion}`
      );

      if (versionResponse.ok) {
        const versionData = await versionResponse.json();
        return {
          package: packageName,
          peerDependencies: versionData.peerDependencies || {},
          registry: "jsr",
        };
      }
    }

    return {
      package: packageName,
      peerDependencies: {},
      registry: reg,
    };
  } catch (error) {
    return {
      package: packageName,
      peerDependencies: {},
      registry: reg,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get outdated packages (requires local package.json)
 * This returns a command to check outdated packages
 */
export function getOutdatedCommand(
  registry?: RegistryType,
  workspace?: string
): { command: string; registry: RegistryType } {
  const reg = registry || "npm";

  let command: string;
  switch (reg) {
    case "npm":
    case "unknown":
      command = "npm outdated --json";
      break;
    case "jsr":
    case "deno":
      command = "deno outdated --json";
      break;
    default:
      command = "npm outdated --json";
  }

  if (workspace) {
    command = `cd ${workspace} && ${command}`;
  }

  return { command, registry: reg };
}

/**
 * Analyze dependencies for a package
 */
export interface DependencyAnalysis {
  package: string;
  registry: RegistryType;
  totalDependencies: number;
  directDependencies: number;
  devDependencies: number;
  peerDependencies: number;
  optionalDependencies: number;
  hasVulnerabilities: boolean;
  largestDependencies: Array<{ name: string; size: number }>;
  error?: string;
}

export async function analyzeDependencies(
  packageName: string,
  registry?: RegistryType
): Promise<DependencyAnalysis> {
  const reg = registry || detectRegistry(packageName);

  try {
    if (reg === "npm" || reg === "unknown") {
      const response = await fetch(
        `https://registry.npmjs.org/${encodeURIComponent(packageName)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch package: ${response.statusText}`);
      }

      const data = await response.json();
      const latestVersion = data["dist-tags"]?.latest || Object.keys(data.versions).pop();
      const versionData = data.versions[latestVersion];

      const deps = versionData.dependencies || {};
      const devDeps = versionData.devDependencies || {};
      const peerDeps = versionData.peerDependencies || {};
      const optDeps = versionData.optionalDependencies || {};

      // Count total dependencies (simplified - would need recursive fetching for accurate count)
      const totalDeps = Object.keys(deps).length +
        Object.keys(devDeps).length +
        Object.keys(peerDeps).length +
        Object.keys(optDeps).length;

      return {
        package: packageName,
        registry: "npm",
        totalDependencies: totalDeps,
        directDependencies: Object.keys(deps).length,
        devDependencies: Object.keys(devDeps).length,
        peerDependencies: Object.keys(peerDeps).length,
        optionalDependencies: Object.keys(optDeps).length,
        hasVulnerabilities: false, // Would need vulnerability check
        largestDependencies: [],
      };
    }

    return {
      package: packageName,
      registry: reg,
      totalDependencies: 0,
      directDependencies: 0,
      devDependencies: 0,
      peerDependencies: 0,
      optionalDependencies: 0,
      hasVulnerabilities: false,
      largestDependencies: [],
      error: `Dependency analysis not fully supported for ${reg}`,
    };
  } catch (error) {
    return {
      package: packageName,
      registry: reg,
      totalDependencies: 0,
      directDependencies: 0,
      devDependencies: 0,
      peerDependencies: 0,
      optionalDependencies: 0,
      hasVulnerabilities: false,
      largestDependencies: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get dependency tree (auto-detects registry)
 */
export async function getDependencyTree(
  packageName: string,
  version?: string,
  registry?: RegistryType
): Promise<DependencyTree> {
  const reg = registry || detectRegistry(packageName);

  switch (reg) {
    case "npm":
    case "unknown":
      return getNpmDependencyTree(packageName, version);
    default:
      return {
        root: packageName,
        registry: reg,
        tree: {
          name: packageName,
          version: version || "unknown",
        },
        error: `Dependency tree not fully supported for ${reg}`,
      };
  }
}


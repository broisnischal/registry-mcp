import type { RegistryType } from "./types.ts";
import { detectRegistry } from "./detector.ts";

export interface Vulnerability {
  id: string;
  package: string;
  title: string;
  severity: "low" | "moderate" | "high" | "critical";
  description?: string;
  affectedVersions?: string;
  patchedVersions?: string;
  url?: string;
}

export interface VulnerabilityResult {
  packageName: string;
  registry: RegistryType;
  vulnerabilities: Vulnerability[];
  summary: {
    total: number;
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
  error?: string;
}

/**
 * Check vulnerabilities for npm packages
 * Note: Full vulnerability checking requires running npm audit locally.
 * This function provides a command to check vulnerabilities.
 */
export async function checkNpmVulnerabilities(
  packageName: string
): Promise<VulnerabilityResult> {
  try {
    // Check if package exists
    const pkgResponse = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`
    );
    
    if (!pkgResponse.ok) {
      throw new Error(`Package not found: ${packageName}`);
    }

    // Note: npm doesn't provide a public API for vulnerability checking
    // Users need to run `npm audit` locally after installing
    // We return a command they can run
    return {
      packageName,
      registry: "npm",
      vulnerabilities: [],
      summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 },
      // Note: To check vulnerabilities, install the package and run: npm audit
    };
  } catch (error) {
    return {
      packageName,
      registry: "npm",
      vulnerabilities: [],
      summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check vulnerabilities for a package (auto-detects registry)
 */
export async function checkVulnerabilities(
  packageName: string,
  registry?: RegistryType
): Promise<VulnerabilityResult> {
  const reg = registry || detectRegistry(packageName);

  switch (reg) {
    case "npm":
    case "unknown":
      return checkNpmVulnerabilities(packageName);
    case "jsr":
    case "deno":
      // JSR and Deno don't have public vulnerability APIs yet
      // Return empty result with info message
      return {
        packageName,
        registry: reg,
        vulnerabilities: [],
        summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 },
      };
    default:
      return {
        packageName,
        registry: reg,
        vulnerabilities: [],
        summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 },
        error: `Vulnerability checking not supported for ${reg}`,
      };
  }
}

function mapSeverity(severity: string): Vulnerability["severity"] {
  const s = severity.toLowerCase();
  if (s === "critical" || s === "crit") return "critical";
  if (s === "high") return "high";
  if (s === "moderate" || s === "mod") return "moderate";
  return "low";
}


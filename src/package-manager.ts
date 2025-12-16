import type { RegistryType } from "./types.ts";
import { detectRegistry } from "./detector.ts";

export interface PackageManagerResult {
  success: boolean;
  message: string;
  registry: RegistryType;
  command?: string;
  error?: string;
}

export interface InstallOptions {
  packageName: string;
  version?: string;
  dev?: boolean;
  registry?: RegistryType;
  workspace?: string;
}

export interface RemoveOptions {
  packageName: string;
  registry?: RegistryType;
  workspace?: string;
}

export interface UpdateOptions {
  packageName?: string;
  registry?: RegistryType;
  workspace?: string;
  latest?: boolean;
}

/**
 * Get the appropriate install command for a registry
 */
export function getInstallCommand(
  options: InstallOptions,
  autoDetect = true
): PackageManagerResult {
  const registry = options.registry ||
    (autoDetect ? detectRegistry(options.packageName) : "npm");

  try {
    let command: string;

    switch (registry) {
      case "npm":
      case "unknown": {
        const version = options.version ? `@${options.version}` : "";
        const flag = options.dev ? " --save-dev" : " --save";
        command = `npm install ${options.packageName}${version}${flag}`;
        break;
      }
      case "jsr": {
        const version = options.version ? `@${options.version}` : "";
        command = `deno add ${options.packageName}${version}`;
        if (options.dev) {
          command += " --dev";
        }
        break;
      }
      case "deno": {
        const version = options.version ? `@${options.version}` : "";
        command = `deno add ${options.packageName}${version}`;
        break;
      }
      default:
        throw new Error(`Unsupported registry: ${registry}`);
    }

    if (options.workspace) {
      if (registry === "npm" || registry === "unknown") {
        command = `cd ${options.workspace} && ${command}`;
      } else {
        command = `cd ${options.workspace} && ${command}`;
      }
    }

    return {
      success: true,
      message: `Install command generated for ${registry}`,
      registry,
      command,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to generate install command",
      registry,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get the appropriate remove command for a registry
 */
export function getRemoveCommand(
  options: RemoveOptions,
  autoDetect = true
): PackageManagerResult {
  const registry = options.registry ||
    (autoDetect ? detectRegistry(options.packageName) : "npm");

  try {
    let command: string;

    switch (registry) {
      case "npm":
      case "unknown":
        command = `npm uninstall ${options.packageName}`;
        break;
      case "jsr":
      case "deno":
        command = `deno remove ${options.packageName}`;
        break;
      default:
        throw new Error(`Unsupported registry: ${registry}`);
    }

    if (options.workspace) {
      command = `cd ${options.workspace} && ${command}`;
    }

    return {
      success: true,
      message: `Remove command generated for ${registry}`,
      registry,
      command,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to generate remove command",
      registry,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get the appropriate update command for a registry
 */
export function getUpdateCommand(
  options: UpdateOptions = {},
  autoDetect = true
): PackageManagerResult {
  const registry = options.registry ||
    (options.packageName && autoDetect
      ? detectRegistry(options.packageName)
      : "npm") || "npm";

  try {
    let command: string;

    switch (registry) {
      case "npm":
      case "unknown": {
        if (options.packageName) {
          const latest = options.latest ? " --latest" : "";
          command = `npm update ${options.packageName}${latest}`;
        } else {
          command = options.latest
            ? "npm update --latest"
            : "npm update";
        }
        break;
      }
      case "jsr":
      case "deno": {
        if (options.packageName) {
          command = `deno update ${options.packageName}`;
        } else {
          command = "deno update";
        }
        break;
      }
      default:
        throw new Error(`Unsupported registry: ${registry}`);
    }

    if (options.workspace) {
      command = `cd ${options.workspace} && ${command}`;
    }

    return {
      success: true,
      message: `Update command generated for ${registry}`,
      registry,
      command,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to generate update command",
      registry,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get CI command for checking dependencies
 */
export function getCiCommand(
  registry?: RegistryType,
  workspace?: string
): PackageManagerResult {
  const reg = registry || "npm";

  try {
    let command: string;

    switch (reg) {
      case "npm":
      case "unknown":
        command = "npm ci";
        break;
      case "jsr":
      case "deno":
        command = "deno cache --reload deps.ts || deno cache --reload import_map.json";
        break;
      default:
        throw new Error(`Unsupported registry: ${reg}`);
    }

    if (workspace) {
      command = `cd ${workspace} && ${command}`;
    }

    return {
      success: true,
      message: `CI command generated for ${reg}`,
      registry: reg,
      command,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to generate CI command",
      registry: reg,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}


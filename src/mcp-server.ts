import { Server } from "npm:@modelcontextprotocol/sdk@0.5.0/server/index.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@0.5.0/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "npm:@modelcontextprotocol/sdk@0.5.0/types.js";
import { search, searchAll, searchNpm, searchJsr, searchDeno } from "./search.ts";
import { detectRegistry, getRegistryInfo } from "./detector.ts";
import type { RegistryType } from "./types.ts";
import {
  getInstallCommand,
  getRemoveCommand,
  getUpdateCommand,
  getCiCommand,
} from "./package-manager.ts";
import { checkVulnerabilities } from "./vulnerabilities.ts";
import { getBundleSize } from "./bundle-size.ts";
import {
  getDependencyTree,
  getPeerDependencies,
  getOutdatedCommand,
  analyzeDependencies,
} from "./dependencies.ts";
import {
  generateCDNImports,
  searchCDNJS,
  searchUnpkg,
  searchJsDelivr,
  searchSkypack,
  searchEsmSh,
  searchAllCDNs,
  getCDNImports,
} from "./cdn.ts";
import type { CDNProvider } from "./cdn.ts";
import {
  formatSearchResult,
  formatCDNImports,
  formatBundleSize,
  formatVulnerabilities,
} from "./formatter.ts";

// Get registry from environment variable or args, default to auto-detect
const getDefaultRegistry = (): RegistryType | null => {
  const envRegistry = Deno.env.get("REGISTRY_MCP_PROVIDER");
  if (envRegistry && ["npm", "jsr", "deno"].includes(envRegistry.toLowerCase())) {
    return envRegistry.toLowerCase() as RegistryType;
  }
  return null;
};

const defaultRegistry = getDefaultRegistry();

// Helper function to get emoji for CDN providers
function getCDNEmoji(provider: CDNProvider): string {
  const emojis: Record<CDNProvider, string> = {
    unpkg: "📦",
    jsdelivr: "⚡",
    cdnjs: "☁️",
    skypack: "🚀",
    "esm.sh": "✨",
    "deno.land": "🦕",
    "jsr.io": "📚",
  };
  return emojis[provider] || "🌐";
}

const server = new Server(
  {
    name: "@registry/mcp",
    version: "0.1.2",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_packages",
        description: "Search for packages across npm, JSR, and Deno registries. Auto-detects the appropriate registry based on the query.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Package name or search query",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 20)",
              default: 20,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "search_all_registries",
        description: "Search across all registries (npm, JSR, Deno) simultaneously and return combined results.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            limit: {
              type: "number",
              description: "Maximum number of results per registry (default: 20)",
              default: 20,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "search_npm",
        description: "Search the npm registry specifically.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 20)",
              default: 20,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "search_jsr",
        description: "Search the JSR (JavaScript Registry) specifically.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 20)",
              default: 20,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "search_deno",
        description: "Search the Deno registry specifically.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 20)",
              default: 20,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "detect_registry",
        description: "Detect which registry a package name belongs to (npm, jsr, deno, or unknown).",
        inputSchema: {
          type: "object",
          properties: {
            packageName: {
              type: "string",
              description: "Package name to detect registry for",
            },
          },
          required: ["packageName"],
        },
      },
      {
        name: "get_registry_info",
        description: "Get metadata about a registry including URLs and search endpoints.",
        inputSchema: {
          type: "object",
          properties: {
            registry: {
              type: "string",
              enum: ["npm", "jsr", "deno", "unknown"],
              description: "Registry type",
            },
          },
          required: ["registry"],
        },
      },
      {
        name: "check_bundle_size",
        description: "Check the bundle size of a package (minified, gzipped, brotli).",
        inputSchema: {
          type: "object",
          properties: {
            packageName: {
              type: "string",
              description: "Package name to check bundle size for",
            },
            version: {
              type: "string",
              description: "Optional version (defaults to latest)",
            },
            registry: {
              type: "string",
              enum: ["npm", "jsr", "deno"],
              description: "Optional registry override (auto-detects if not provided)",
            },
          },
          required: ["packageName"],
        },
      },
      {
        name: "check_vuln",
        description: "Check for vulnerabilities in a package.",
        inputSchema: {
          type: "object",
          properties: {
            packageName: {
              type: "string",
              description: "Package name to check vulnerabilities for",
            },
            registry: {
              type: "string",
              enum: ["npm", "jsr", "deno"],
              description: "Optional registry override (auto-detects if not provided)",
            },
          },
          required: ["packageName"],
        },
      },
      {
        name: "install",
        description: "Generate install command for a package.",
        inputSchema: {
          type: "object",
          properties: {
            packageName: {
              type: "string",
              description: "Package name to install",
            },
            version: {
              type: "string",
              description: "Optional version",
            },
            dev: {
              type: "boolean",
              description: "Install as dev dependency",
            },
            registry: {
              type: "string",
              enum: ["npm", "jsr", "deno"],
              description: "Optional registry override (auto-detects if not provided)",
            },
            workspace: {
              type: "string",
              description: "Optional workspace directory",
            },
          },
          required: ["packageName"],
        },
      },
      {
        name: "remove",
        description: "Generate remove/uninstall command for a package.",
        inputSchema: {
          type: "object",
          properties: {
            packageName: {
              type: "string",
              description: "Package name to remove",
            },
            registry: {
              type: "string",
              enum: ["npm", "jsr", "deno"],
              description: "Optional registry override (auto-detects if not provided)",
            },
            workspace: {
              type: "string",
              description: "Optional workspace directory",
            },
          },
          required: ["packageName"],
        },
      },
      {
        name: "update",
        description: "Generate update command for packages.",
        inputSchema: {
          type: "object",
          properties: {
            packageName: {
              type: "string",
              description: "Optional specific package to update (updates all if not provided)",
            },
            registry: {
              type: "string",
              enum: ["npm", "jsr", "deno"],
              description: "Optional registry override (auto-detects if not provided)",
            },
            latest: {
              type: "boolean",
              description: "Update to latest versions",
            },
            workspace: {
              type: "string",
              description: "Optional workspace directory",
            },
          },
        },
      },
      {
        name: "check_outdated",
        description: "Generate command to check for outdated packages.",
        inputSchema: {
          type: "object",
          properties: {
            registry: {
              type: "string",
              enum: ["npm", "jsr", "deno"],
              description: "Optional registry override (defaults to npm)",
            },
            workspace: {
              type: "string",
              description: "Optional workspace directory",
            },
          },
        },
      },
      {
        name: "peer_deps",
        description: "Get peer dependencies for a package.",
        inputSchema: {
          type: "object",
          properties: {
            packageName: {
              type: "string",
              description: "Package name to get peer dependencies for",
            },
            registry: {
              type: "string",
              enum: ["npm", "jsr", "deno"],
              description: "Optional registry override (auto-detects if not provided)",
            },
          },
          required: ["packageName"],
        },
      },
      {
        name: "dependency_tree",
        description: "Get dependency tree for a package.",
        inputSchema: {
          type: "object",
          properties: {
            packageName: {
              type: "string",
              description: "Package name to get dependency tree for",
            },
            version: {
              type: "string",
              description: "Optional version (defaults to latest)",
            },
            registry: {
              type: "string",
              enum: ["npm", "jsr", "deno"],
              description: "Optional registry override (auto-detects if not provided)",
            },
          },
          required: ["packageName"],
        },
      },
      {
        name: "analyze_dependency",
        description: "Analyze dependencies for a package (counts, types, etc.).",
        inputSchema: {
          type: "object",
          properties: {
            packageName: {
              type: "string",
              description: "Package name to analyze",
            },
            registry: {
              type: "string",
              enum: ["npm", "jsr", "deno"],
              description: "Optional registry override (auto-detects if not provided)",
            },
          },
          required: ["packageName"],
        },
      },
      {
        name: "ci",
        description: "Generate CI command for installing dependencies.",
        inputSchema: {
          type: "object",
          properties: {
            registry: {
              type: "string",
              enum: ["npm", "jsr", "deno"],
              description: "Optional registry override (defaults to npm)",
            },
            workspace: {
              type: "string",
              description: "Optional workspace directory",
            },
          },
        },
      },
      {
        name: "get_cdn_imports",
        description: "🌐 Get CDN import URLs for a package (unpkg, jsdelivr, skypack, esm.sh, etc.).",
        inputSchema: {
          type: "object",
          properties: {
            packageName: {
              type: "string",
              description: "Package name to get CDN imports for",
            },
            version: {
              type: "string",
              description: "Optional version (defaults to latest)",
            },
            registry: {
              type: "string",
              enum: ["npm", "jsr", "deno"],
              description: "Optional registry override (auto-detects if not provided)",
            },
          },
          required: ["packageName"],
        },
      },
      {
        name: "search_cdn",
        description: "🔍 Search for packages on CDN providers (cdnjs, unpkg, jsdelivr, skypack, esm.sh).",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            provider: {
              type: "string",
              enum: ["cdnjs", "unpkg", "jsdelivr", "skypack", "esm.sh", "all"],
              description: "CDN provider to search (defaults to 'all')",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 20)",
              default: 20,
            },
          },
          required: ["query"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_packages": {
        const searchQuery = args?.query as string;
        const searchLimit = (args?.limit as number) || 20;
        const result = await search(searchQuery, searchLimit);
        const formatted = formatSearchResult(result);
        return {
          content: [
            {
              type: "text",
              text: formatted + "\n\n" + JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "search_all_registries": {
        const allQuery = args?.query as string;
        const allLimit = (args?.limit as number) || 20;
        const results = await searchAll(allQuery, allLimit);
        const formatted = results.map(formatSearchResult).join("\n\n");
        return {
          content: [
            {
              type: "text",
              text: formatted + "\n\n" + JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case "search_npm": {
        const npmQuery = args?.query as string;
        const npmLimit = (args?.limit as number) || 20;
        const result = await searchNpm(npmQuery, npmLimit);
        const formatted = formatSearchResult(result);
        return {
          content: [
            {
              type: "text",
              text: formatted + "\n\n" + JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "search_jsr": {
        const jsrQuery = args?.query as string;
        const jsrLimit = (args?.limit as number) || 20;
        const result = await searchJsr(jsrQuery, jsrLimit);
        const formatted = formatSearchResult(result);
        return {
          content: [
            {
              type: "text",
              text: formatted + "\n\n" + JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "search_deno": {
        const denoQuery = args?.query as string;
        const denoLimit = (args?.limit as number) || 20;
        const result = await searchDeno(denoQuery, denoLimit);
        const formatted = formatSearchResult(result);
        return {
          content: [
            {
              type: "text",
              text: formatted + "\n\n" + JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "detect_registry": {
        const packageName = args?.packageName as string;
        const registry = detectRegistry(packageName);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ packageName, registry }, null, 2),
            },
          ],
        };
      }

      case "get_registry_info": {
        const registryType = args?.registry as string;
        const info = getRegistryInfo(registryType as any);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      case "check_bundle_size": {
        const packageName = args?.packageName as string;
        const version = args?.version as string | undefined;
        const registry = (args?.registry as RegistryType | undefined) || defaultRegistry || undefined;
        const result = await getBundleSize(packageName, version, registry);
        const formatted = formatBundleSize(result);
        return {
          content: [
            {
              type: "text",
              text: formatted + "\n\n" + JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "check_vuln": {
        const packageName = args?.packageName as string;
        const registry = (args?.registry as RegistryType | undefined) || defaultRegistry || undefined;
        const result = await checkVulnerabilities(packageName, registry);
        const formatted = formatVulnerabilities(result);
        return {
          content: [
            {
              type: "text",
              text: formatted + "\n\n" + JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "install": {
        const packageName = args?.packageName as string;
        const version = args?.version as string | undefined;
        const dev = args?.dev as boolean | undefined;
        const registry = (args?.registry as RegistryType | undefined) || defaultRegistry || undefined;
        const workspace = args?.workspace as string | undefined;
        const result = getInstallCommand(
          { packageName, version, dev, registry, workspace },
          !registry
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "remove": {
        const packageName = args?.packageName as string;
        const registry = (args?.registry as RegistryType | undefined) || defaultRegistry || undefined;
        const workspace = args?.workspace as string | undefined;
        const result = getRemoveCommand(
          { packageName, registry, workspace },
          !registry
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "update": {
        const packageName = args?.packageName as string | undefined;
        const registry = (args?.registry as RegistryType | undefined) || defaultRegistry || undefined;
        const latest = args?.latest as boolean | undefined;
        const workspace = args?.workspace as string | undefined;
        const result = getUpdateCommand(
          { packageName, registry, latest, workspace },
          !registry
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "check_outdated": {
        const registry = (args?.registry as RegistryType | undefined) || defaultRegistry || undefined;
        const workspace = args?.workspace as string | undefined;
        const result = getOutdatedCommand(registry || "npm", workspace);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "peer_deps": {
        const packageName = args?.packageName as string;
        const registry = (args?.registry as RegistryType | undefined) || defaultRegistry || undefined;
        const result = await getPeerDependencies(packageName, registry);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "dependency_tree": {
        const packageName = args?.packageName as string;
        const version = args?.version as string | undefined;
        const registry = (args?.registry as RegistryType | undefined) || defaultRegistry || undefined;
        const result = await getDependencyTree(packageName, version, registry);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "analyze_dependency": {
        const packageName = args?.packageName as string;
        const registry = (args?.registry as RegistryType | undefined) || defaultRegistry || undefined;
        const result = await analyzeDependencies(packageName, registry);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "ci": {
        const registry = (args?.registry as RegistryType | undefined) || defaultRegistry || undefined;
        const workspace = args?.workspace as string | undefined;
        const result = getCiCommand(registry || "npm", workspace);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_cdn_imports": {
        const packageName = args?.packageName as string;
        const version = args?.version as string | undefined;
        const registry = (args?.registry as RegistryType | undefined) || defaultRegistry || undefined;
        const result = getCDNImports(packageName, version, registry);
        
        // Format with emojis for better readability
        const formatted = {
          ...result,
          imports: result.imports.map((imp) => ({
            ...imp,
            emoji: getCDNEmoji(imp.provider),
          })),
          recommended: result.recommended ? {
            ...result.recommended,
            emoji: getCDNEmoji(result.recommended.provider),
          } : undefined,
        };
        
        const formattedText = formatCDNImports(result);
        
        return {
          content: [
            {
              type: "text",
              text: formattedText + "\n\n" + JSON.stringify(formatted, null, 2),
            },
          ],
        };
      }

      case "search_cdn": {
        const query = args?.query as string;
        const provider = (args?.provider as string) || "all";
        const limit = (args?.limit as number) || 20;
        
        let results;
        if (provider === "all") {
          results = await searchAllCDNs(query, limit);
        } else {
          switch (provider) {
            case "cdnjs":
              results = [await searchCDNJS(query, limit)];
              break;
            case "unpkg":
              results = [await searchUnpkg(query, limit)];
              break;
            case "jsdelivr":
              results = [await searchJsDelivr(query, limit)];
              break;
            case "skypack":
              results = [await searchSkypack(query, limit)];
              break;
            case "esm.sh":
              results = [await searchEsmSh(query, limit)];
              break;
            default:
              results = await searchAllCDNs(query, limit);
          }
        }
        
        // Format with emojis
        const formatted = results.map((result) => ({
          ...result,
          emoji: getCDNEmoji(result.provider),
        }));
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

if (import.meta.main) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}


import { Server } from "npm:@modelcontextprotocol/sdk@0.5.0/server/index.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@0.5.0/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "npm:@modelcontextprotocol/sdk@0.5.0/types.js";
import { search, searchAll, searchNpm, searchJsr, searchDeno } from "./search.ts";
import { detectRegistry, getRegistryInfo } from "./detector.ts";

const server = new Server(
  {
    name: "@registry/mcp",
    version: "0.1.0",
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
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "search_all_registries": {
        const allQuery = args?.query as string;
        const allLimit = (args?.limit as number) || 20;
        const results = await searchAll(allQuery, allLimit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case "search_npm": {
        const npmQuery = args?.query as string;
        const npmLimit = (args?.limit as number) || 20;
        const result = await searchNpm(npmQuery, npmLimit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "search_jsr": {
        const jsrQuery = args?.query as string;
        const jsrLimit = (args?.limit as number) || 20;
        const result = await searchJsr(jsrQuery, jsrLimit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "search_deno": {
        const denoQuery = args?.query as string;
        const denoLimit = (args?.limit as number) || 20;
        const result = await searchDeno(denoQuery, denoLimit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
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


# @registry/mcp - Multi-Registry Package Search

A unified tool to search across multiple JavaScript/TypeScript package registries including npm, JSR, Deno, and more. Auto-detects the appropriate registry and provides comprehensive library information.

## Features

- 🔍 **Multi-Registry Search**: Search across npm, JSR, and Deno registries
- 🎯 **Auto-Detection**: Automatically detects which registry to search based on package name patterns
- 📦 **Unified API**: Consistent interface for all registries
- ⚡ **Fast**: Parallel search across all registries
- 🌐 **Cross-Platform**: Works in Deno, Node.js, and other JavaScript runtimes

## Installation

### Deno

```ts
import { search, searchAll } from "jsr:@registry/mcp@0.1.1";
```

### npm / Node.js

```bash
npm install @registry/mcp
```

```ts
import { search, searchAll } from "@registry/mcp";
```

## Usage

### Auto-Detect and Search

The `search` function automatically detects which registry to query based on the package name:

```ts
import { search } from "@registry/mcp";

// Searches JSR (detected from @scope/package format)
const jsrResult = await search("@std/path");
console.log(jsrResult.packages);

// Searches npm (default for most packages)
const npmResult = await search("lodash");
console.log(npmResult.packages);

// Searches Deno (detected from URL patterns)
const denoResult = await search("https://deno.land/x/oak");
console.log(denoResult.packages);
```

### Search All Registries

Search across all registries simultaneously:

```ts
import { searchAll } from "@registry/mcp";

const results = await searchAll("express");

results.forEach((result) => {
  console.log(`\n${result.registry.toUpperCase()} Results:`);
  result.packages.forEach((pkg) => {
    console.log(`- ${pkg.name}: ${pkg.description}`);
  });
});
```

### Search Specific Registry

You can also search a specific registry directly:

```ts
import { searchNpm, searchJsr, searchDeno } from "@registry/mcp";

// Search npm only
const npmResults = await searchNpm("react", 10);

// Search JSR only
const jsrResults = await searchJsr("@std/encoding", 10);

// Search Deno only
const denoResults = await searchDeno("oak", 10);
```

### Registry Detection

Detect which registry a package name belongs to:

```ts
import { detectRegistry, getRegistryInfo } from "@registry/mcp";

const registry = detectRegistry("@std/path"); // "jsr"
const info = getRegistryInfo(registry);
console.log(info.name); // "JSR"
console.log(info.url); // "https://jsr.io"
```

## API Reference

### `search(query: string, limit?: number): Promise<SearchResult>`

Auto-detects and searches the appropriate registry for the given query.

**Parameters:**

- `query` - Package name or search query
- `limit` - Maximum number of results (default: 20)

**Returns:** `Promise<SearchResult>`

### `searchAll(query: string, limit?: number): Promise<SearchResult[]>`

Searches all registries simultaneously.

**Parameters:**

- `query` - Search query
- `limit` - Maximum number of results per registry (default: 20)

**Returns:** `Promise<SearchResult[]>` - Array of results from npm, JSR, and Deno

### `searchNpm(query: string, limit?: number): Promise<SearchResult>`

Searches the npm registry.

### `searchJsr(query: string, limit?: number): Promise<SearchResult>`

Searches the JSR registry.

### `searchDeno(query: string, limit?: number): Promise<SearchResult>`

Searches the Deno registry.

### `detectRegistry(packageName: string): RegistryType`

Detects the most likely registry for a given package name.

**Returns:** `"npm" | "jsr" | "deno" | "unknown"`

### `getRegistryInfo(registry: RegistryType)`

Gets metadata about a registry including URLs and search endpoints.

## Types

### `PackageInfo`

```ts
interface PackageInfo {
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
```

### `SearchResult`

```ts
interface SearchResult {
  query: string;
  registry: RegistryType;
  packages: PackageInfo[];
  total?: number;
  error?: string;
}
```

## Registry Detection Rules

- **JSR**: Packages starting with `@` and containing `/` (e.g., `@std/path`)
- **Deno**: URLs containing `deno.land` or `nest.land`, or starting with `https://`
- **npm**: Default for most other cases
- **Explicit**: `jsr:` and `npm:` specifiers are respected

## Examples

### CLI Tool Example

```ts
import { searchAll } from "@registry/mcp";

const query = Deno.args[0] || "express";
const results = await searchAll(query);

for (const result of results) {
  if (result.error) {
    console.error(`Error searching ${result.registry}:`, result.error);
    continue;
  }

  console.log(
    `\n📦 ${result.registry.toUpperCase()} (${
      result.total || result.packages.length
    } results)`
  );
  console.log("─".repeat(50));

  for (const pkg of result.packages.slice(0, 5)) {
    console.log(`\n${pkg.name}${pkg.version ? `@${pkg.version}` : ""}`);
    if (pkg.description) {
      console.log(`  ${pkg.description}`);
    }
    if (pkg.registryUrl) {
      console.log(`  🔗 ${pkg.registryUrl}`);
    }
  }
}
```

### Find Package Across All Registries

```ts
import { searchAll } from "@registry/mcp";

async function findPackage(name: string) {
  const results = await searchAll(name);

  for (const result of results) {
    const exactMatch = result.packages.find(
      (pkg) => pkg.name.toLowerCase() === name.toLowerCase()
    );

    if (exactMatch) {
      console.log(`Found in ${result.registry}:`, exactMatch);
      return exactMatch;
    }
  }

  console.log("Package not found in any registry");
  return null;
}

await findPackage("lodash");
```

## MCP Server

This package includes an MCP (Model Context Protocol) server that exposes registry search tools for AI assistants.

### Using the MCP Server

The MCP server can be used with MCP-compatible clients:

```json
{
  "mcpServers": {
    "@registry/mcp": {
      "command": "deno",
      "args": ["run", "--allow-net", "--allow-env", "jsr:@registry/mcp/mcp"]
    }
  }
}
```

### Available MCP Tools

- `search_packages` - Auto-detect and search registry
- `search_all_registries` - Search all registries simultaneously
- `search_npm` - Search npm registry
- `search_jsr` - Search JSR registry
- `search_deno` - Search Deno registry
- `detect_registry` - Detect registry for a package name
- `get_registry_info` - Get registry metadata

## CLI Usage

You can also use this package as a CLI tool:

```bash
npx jsr @registry/mcp search lodash
npx jsr @registry/mcp search-all express
npx jsr @registry/mcp search-npm react
npx jsr @registry/mcp search-jsr @std/encoding
npx jsr @registry/mcp search-deno oak
npx jsr @registry/mcp detect @std/path
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [JSR Package](https://jsr.io/@registry/mcp)
- [GitHub Repository](https://github.com/nees/npm-mcp)

# @registry/mcp - Multi-Registry Package Search

A unified tool to search across multiple JavaScript/TypeScript package registries including npm, JSR, Deno, and more. Auto-detects the appropriate registry and provides comprehensive library information.

**@registry/mcp** is a powerful Model Context Protocol (MCP) server that provides AI assistants with comprehensive package registry tools. It enables searching, analyzing, and managing packages across npm, JSR, Deno, and multiple CDN providers.

## Features

- 🔍 Search packages across multiple registries
- 📦 Get CDN import URLs for packages
- 🔒 Check package vulnerabilities
- 📊 Analyze bundle sizes and dependencies
- ⚙️ Generate install/update/remove commands
- 🌐 Access CDN providers (unpkg, jsdelivr, skypack, esm.sh, etc.)

### Installation & Setup

Add this MCP server to your MCP-compatible client (like Cursor, Claude Desktop, etc.):

**For Cursor (`.cursor/mcp.json`):**

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

**Optional: Set default registry provider**

```json
{
  "mcpServers": {
    "@registry/mcp": {
      "command": "deno",
      "args": ["run", "--allow-net", "--allow-env", "jsr:@registry/mcp/mcp"],
      "env": {
        "REGISTRY_MCP_PROVIDER": "npm"
      }
    }
  }
}
```

Valid values: `npm`, `jsr`, `deno` (or omit for auto-detection)

### Available MCP Tools

#### 🔍 Search Tools

##### `search_packages`

**When to use:** Search for packages with automatic registry detection.

**Input:**

```json
{
  "query": "lodash",
  "limit": 20
}
```

**Returns:**

- Formatted text with emoji-enhanced results
- JSON with package details (name, version, description, downloads, etc.)

**Example:**

```
📦 NPM Results
Query: "lodash"
Total: 1 packages

1. lodash @4.17.21
   A modern JavaScript utility library delivering modularity, performance, & extras.
   🔗 https://www.npmjs.com/package/lodash
   📥 50,000,000 downloads
```

---

##### `search_all_registries`

**When to use:** Search across all registries (npm, JSR, Deno) simultaneously to find packages.

**Input:**

```json
{
  "query": "express",
  "limit": 10
}
```

**Returns:**

- Results from npm, JSR, and Deno in formatted text
- JSON array with results from each registry

---

##### `search_npm` / `search_jsr` / `search_deno`

**When to use:** Search a specific registry when you know which one to target.

**Input:**

```json
{
  "query": "react",
  "limit": 20
}
```

**Returns:** Formatted search results from the specified registry

---

#### 🌐 CDN Tools

##### `get_cdn_imports`

**When to use:** Get CDN import URLs for a package to use in browsers or Deno without bundlers.

**Input:**

```json
{
  "packageName": "lodash",
  "version": "4.17.21",
  "registry": "npm"
}
```

**Returns:**

```
🌐 CDN Imports for lodash
Version: 4.17.21
Registry: npm

⭐ Recommended:
🚀 skypack
   URL: `https://cdn.skypack.dev/lodash@4.17.21`
   Type: ESM (minified)
   Optimized ESM packages with automatic bundling

📋 All Available CDN Imports:
1. 📦 unpkg - https://unpkg.com/lodash@4.17.21
2. ⚡ jsdelivr - https://cdn.jsdelivr.net/npm/lodash@4.17.21
3. 🚀 skypack - https://cdn.skypack.dev/lodash@4.17.21
4. ✨ esm.sh - https://esm.sh/lodash@4.17.21
...
```

**Supported CDNs:**

- 📦 **unpkg** - Fast, global CDN
- ⚡ **jsdelivr** - Fast, reliable CDN
- ☁️ **cdnjs** - Cloudflare CDN
- 🚀 **skypack** - Optimized ESM with bundling
- ✨ **esm.sh** - Fast ESM with TypeScript support
- 📚 **jsr.io** - Direct JSR imports
- 🦕 **deno.land** - Direct Deno imports

---

##### `search_cdn`

**When to use:** Search for packages available on CDN providers.

**Input:**

```json
{
  "query": "react",
  "provider": "all",
  "limit": 20
}
```

**Provider options:** `cdnjs`, `unpkg`, `jsdelivr`, `skypack`, `esm.sh`, or `all`

**Returns:** Search results with CDN URLs for each package

---

#### 🔒 Security & Analysis Tools

##### `check_vuln`

**When to use:** Check if a package has known security vulnerabilities before installing.

**Input:**

```json
{
  "packageName": "express",
  "registry": "npm"
}
```

**Returns:**

```
🔒 Security Check for express
Registry: npm

⚠️ Found 2 vulnerability/vulnerabilities:
   🔴 Critical: 0
   🟠 High: 1
   🟡 Moderate: 1
   🟢 Low: 0

Details:
1. 🟠 CVE-2022-24999 - Express vulnerability
   Package: express
   Affected: <4.18.0
   Patched: >=4.18.0
   🔗 https://nvd.nist.gov/vuln/detail/CVE-2022-24999
```

**Note:** Full vulnerability checking requires running `npm audit` locally after installation.

---

##### `check_bundle_size`

**When to use:** Check the bundle size of a package to understand its impact on your application.

**Input:**

```json
{
  "packageName": "lodash",
  "version": "4.17.21"
}
```

**Returns:**

```
📦 Bundle Size for lodash
Version: 4.17.21

Minified: 71.23 KB
Gzipped: 24.56 KB
Brotli: 22.10 KB
```

---

#### 📊 Dependency Analysis Tools

##### `analyze_dependency`

**When to use:** Get a comprehensive analysis of a package's dependencies (counts, types, etc.).

**Input:**

```json
{
  "packageName": "express",
  "registry": "npm"
}
```

**Returns:**

```json
{
  "package": "express",
  "registry": "npm",
  "totalDependencies": 45,
  "directDependencies": 30,
  "devDependencies": 15,
  "peerDependencies": 0,
  "optionalDependencies": 0,
  "hasVulnerabilities": false
}
```

---

##### `dependency_tree`

**When to use:** Get the full dependency tree of a package to understand what it depends on.

**Input:**

```json
{
  "packageName": "express",
  "version": "4.18.2"
}
```

**Returns:** Complete dependency tree with all nested dependencies

---

##### `peer_deps`

**When to use:** Check peer dependencies that need to be installed separately.

**Input:**

```json
{
  "packageName": "react-dom",
  "registry": "npm"
}
```

**Returns:**

```json
{
  "package": "react-dom",
  "peerDependencies": {
    "react": "^18.0.0"
  },
  "registry": "npm"
}
```

---

##### `check_outdated`

**When to use:** Generate a command to check for outdated packages in your project.

**Input:**

```json
{
  "registry": "npm",
  "workspace": "./my-project"
}
```

**Returns:**

```json
{
  "command": "cd ./my-project && npm outdated --json",
  "registry": "npm"
}
```

---

#### ⚙️ Package Management Tools

##### `install`

**When to use:** Generate install commands for packages.

**Input:**

```json
{
  "packageName": "lodash",
  "version": "4.17.21",
  "dev": false,
  "registry": "npm",
  "workspace": "./my-project"
}
```

**Returns:**

```json
{
  "success": true,
  "message": "Install command generated for npm",
  "registry": "npm",
  "command": "cd ./my-project && npm install lodash@4.17.21 --save"
}
```

---

##### `remove`

**When to use:** Generate remove/uninstall commands.

**Input:**

```json
{
  "packageName": "lodash",
  "registry": "npm"
}
```

**Returns:** Command to remove the package

---

##### `update`

**When to use:** Generate update commands for packages.

**Input:**

```json
{
  "packageName": "lodash",
  "latest": true,
  "registry": "npm"
}
```

**Returns:** Command to update the package (or all packages if `packageName` is omitted)

---

##### `ci`

**When to use:** Generate CI commands for clean dependency installation.

**Input:**

```json
{
  "registry": "npm",
  "workspace": "./my-project"
}
```

**Returns:**

```json
{
  "command": "cd ./my-project && npm ci",
  "registry": "npm"
}
```

---

#### 🔧 Utility Tools

##### `detect_registry`

**When to use:** Detect which registry a package belongs to.

**Input:**

```json
{
  "packageName": "@std/path"
}
```

**Returns:**

```json
{
  "packageName": "@std/path",
  "registry": "jsr"
}
```

---

##### `get_registry_info`

**When to use:** Get metadata about a registry (URLs, endpoints, etc.).

**Input:**

```json
{
  "registry": "npm"
}
```

**Returns:**

```json
{
  "name": "npm",
  "url": "https://www.npmjs.com",
  "searchUrl": "https://registry.npmjs.org/-/v1/search",
  "packageUrl": "https://www.npmjs.com/package/{name}"
}
```

---

### Registry Auto-Detection

The MCP server automatically detects the registry based on package name patterns:

- **JSR**: Packages starting with `@` and containing `/` (e.g., `@std/path`)
- **Deno**: URLs containing `deno.land` or starting with `https://`
- **npm**: Default for most other cases
- **Explicit**: You can override by passing `registry` parameter

### Registry Provider Selection

You can set a default registry provider via environment variable:

```json
{
  "mcpServers": {
    "@registry/mcp": {
      "command": "deno",
      "args": ["run", "--allow-net", "--allow-env", "jsr:@registry/mcp/mcp"],
      "env": {
        "REGISTRY_MCP_PROVIDER": "npm"
      }
    }
  }
}
```

Or override per-tool call by passing the `registry` parameter.

### Response Format

All tools return responses in two formats:

1. **Formatted text** - Human-readable with emojis and structure (for AI assistants to read)
2. **JSON** - Structured data for programmatic use

Example:

```
📦 NPM Results
Query: "lodash"
...

{
  "query": "lodash",
  "registry": "npm",
  "packages": [...]
}
```

### When to Use Each Tool

| Tool                            | Use Case                                   |
| ------------------------------- | ------------------------------------------ |
| `search_packages`               | General package search with auto-detection |
| `search_all_registries`         | Find packages across all registries        |
| `get_cdn_imports`               | Get CDN URLs for browser/Deno usage        |
| `check_vuln`                    | Security audit before installation         |
| `check_bundle_size`             | Performance planning                       |
| `analyze_dependency`            | Understand package complexity              |
| `dependency_tree`               | See full dependency graph                  |
| `peer_deps`                     | Check required peer dependencies           |
| `install` / `remove` / `update` | Generate package management commands       |
| `ci`                            | Generate CI/CD commands                    |
| `detect_registry`               | Identify package source                    |
| `search_cdn`                    | Find packages on CDN providers             |

## CLI Usage (Optional)

This package is primarily designed as an **MCP server** for AI assistants. The CLI is provided for convenience but has limited functionality compared to the MCP server.

### Why `npx` doesn't work

`npx @registry/mcp` doesn't work because:

- This is a **Deno package** (TypeScript), not a Node.js/npm package
- `npx` requires packages to be published to npm with Node.js-compatible binaries
- The package uses Deno-specific features and APIs

### Using the CLI with Deno

**Option 1: Direct Deno execution (Recommended)**

```bash
deno run --allow-net --allow-env jsr:@registry/mcp/cli search lodash
deno run --allow-net --allow-env jsr:@registry/mcp/cli search-all express
deno run --allow-net --allow-env jsr:@registry/mcp/cli search-npm react
deno run --allow-net --allow-env jsr:@registry/mcp/cli search-jsr @std/encoding
deno run --allow-net --allow-env jsr:@registry/mcp/cli search-deno oak
deno run --allow-net --allow-env jsr:@registry/mcp/cli detect @std/path
```

**Option 2: Install globally with Deno (Recommended for frequent use)**

```bash
# Install once globally
deno install --allow-net --allow-env --name registry-mcp jsr:@registry/mcp/cli

# Then use directly from anywhere
registry-mcp search lodash
registry-mcp search-all express
registry-mcp search-npm react
registry-mcp search-jsr @std/encoding
registry-mcp search-deno oak
registry-mcp detect @std/path
```

**Available CLI Commands:**

- `search <query>` - Auto-detect and search registry
- `search-all <query>` - Search all registries
- `search-npm <query>` - Search npm only
- `search-jsr <query>` - Search JSR only
- `search-deno <query>` - Search Deno only
- `detect <package>` - Detect registry for package

**Note:** For full functionality (CDN imports, vulnerability checking, bundle size, dependency analysis, etc.), use the **MCP server** instead of the CLI.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [JSR Package](https://jsr.io/@registry/mcp)
- [GitHub Repository](https://github.com/nees/npm-mcp)

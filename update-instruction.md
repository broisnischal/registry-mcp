# Force Update MCP Server Instructions

## Problem

You're only seeing 7 tools instead of 19 because Deno is using a cached version from JSR.

## Solution 1: Use --reload flag (Immediate Fix)

Update your MCP configuration to include `--reload` flag:

**For Cursor (`.cursor/mcp.json`):**

```json
{
  "mcpServers": {
    "@registry/mcp": {
      "command": "deno",
      "args": [
        "run",
        "--reload",
        "--allow-net",
        "--allow-env",
        "jsr:@registry/mcp/mcp"
      ]
    }
  }
}
```

**For Claude Desktop (`claude_desktop_config.json`):**

```json
{
  "mcpServers": {
    "@registry/mcp": {
      "command": "deno",
      "args": [
        "run",
        "--reload",
        "--allow-net",
        "--allow-env",
        "jsr:@registry/mcp/mcp"
      ]
    }
  }
}
```

The `--reload` flag forces Deno to bypass its cache and fetch the latest version from JSR.

## Solution 2: Use Specific Version (After Publishing 0.1.2)

Once version 0.1.2 is published to JSR, you can pin to that version:

```json
{
  "mcpServers": {
    "@registry/mcp": {
      "command": "deno",
      "args": [
        "run",
        "--allow-net",
        "--allow-env",
        "jsr:@registry/mcp@0.1.2/mcp"
      ]
    }
  }
}
```

## Solution 3: Clear Deno Cache Manually

You can also clear Deno's cache manually:

```bash
# Clear all Deno cache
rm -rf ~/.cache/deno

# Or clear just JSR cache
rm -rf ~/.cache/deno/deps/jsr.io
```

## After Making Changes

1. **Restart your MCP client** (Cursor, Claude Desktop, etc.)
2. The server should now show all 19 tools:
   - search_packages
   - search_all_registries
   - search_npm
   - search_jsr
   - search_deno
   - detect_registry
   - get_registry_info
   - check_bundle_size
   - check_vuln
   - install
   - remove
   - update
   - check_outdated
   - peer_deps
   - dependency_tree
   - analyze_dependency
   - ci
   - get_cdn_imports
   - search_cdn

## To Publish New Version (if you have access)

```bash
# Commit your changes first
git add .
git commit -m "Bump version to 0.1.2"

# Publish to JSR
deno publish
```

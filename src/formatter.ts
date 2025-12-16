import type { PackageInfo, SearchResult } from "./types.ts";
import type { CDNInfo, CDNImport } from "./cdn.ts";
import type { VulnerabilityResult } from "./vulnerabilities.ts";
import type { BundleSizeInfo } from "./bundle-size.ts";

/**
 * Format package size in human-readable format
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format search results with emojis and better structure
 */
export function formatSearchResult(result: SearchResult): string {
  if (result.error) {
    return `❌ Error searching ${result.registry}: ${result.error}`;
  }

  const registryEmoji = getRegistryEmoji(result.registry);
  let output = `${registryEmoji} **${result.registry.toUpperCase()}** Results\n`;
  output += `Query: "${result.query}"\n`;
  if (result.total !== undefined) {
    output += `Total: ${result.total} packages\n`;
  }
  output += `\n`;

  result.packages.forEach((pkg, index) => {
    output += `**${index + 1}. ${pkg.name}**`;
    if (pkg.version) {
      output += ` @${pkg.version}`;
    }
    output += `\n`;
    
    if (pkg.description) {
      output += `   ${pkg.description}\n`;
    }
    
    if (pkg.registryUrl) {
      output += `   🔗 ${pkg.registryUrl}\n`;
    }
    
    if (pkg.downloads) {
      output += `   📥 ${pkg.downloads.toLocaleString()} downloads\n`;
    }
    
    output += `\n`;
  });

  return output;
}

/**
 * Format CDN imports with better structure
 */
export function formatCDNImports(info: CDNInfo): string {
  let output = `🌐 **CDN Imports for ${info.packageName}**\n`;
  if (info.version) {
    output += `Version: ${info.version}\n`;
  }
  output += `Registry: ${info.registry}\n\n`;
  
  if (info.recommended) {
    output += `⭐ **Recommended:**\n`;
    output += formatCDNImport(info.recommended);
    output += `\n\n`;
  }
  
  output += `📋 **All Available CDN Imports:**\n\n`;
  
  info.imports.forEach((imp, index) => {
    output += `${index + 1}. ${formatCDNImport(imp)}\n`;
  });

  return output;
}

function formatCDNImport(imp: CDNImport): string {
  const emoji = getCDNEmoji(imp.provider);
  let output = `${emoji} **${imp.provider}**\n`;
  output += `   URL: \`${imp.url}\`\n`;
  output += `   Type: ${imp.type.toUpperCase()}`;
  if (imp.minified) {
    output += ` (minified)`;
  }
  output += `\n`;
  if (imp.description) {
    output += `   ${imp.description}\n`;
  }
  return output;
}

/**
 * Format bundle size info
 */
export function formatBundleSize(info: BundleSizeInfo): string {
  if (info.error) {
    return `❌ Error: ${info.error}`;
  }

  let output = `📦 **Bundle Size for ${info.package}**\n`;
  if (info.version) {
    output += `Version: ${info.version}\n`;
  }
  output += `\n`;
  output += `Minified: ${formatSize(info.size.minified)}\n`;
  output += `Gzipped: ${formatSize(info.size.minifiedGzipped)}\n`;
  if (info.size.minifiedBrotli) {
    output += `Brotli: ${formatSize(info.size.minifiedBrotli)}\n`;
  }

  return output;
}

/**
 * Format vulnerability results
 */
export function formatVulnerabilities(result: VulnerabilityResult): string {
  let output = `🔒 **Security Check for ${result.packageName}**\n`;
  output += `Registry: ${result.registry}\n\n`;
  
  if (result.error) {
    output += `⚠️ ${result.error}\n`;
    return output;
  }

  const { total, critical, high, moderate, low } = result.summary;
  
  if (total === 0) {
    output += `✅ No known vulnerabilities found!\n`;
    return output;
  }

  output += `⚠️ **Found ${total} vulnerability/vulnerabilities:**\n`;
  output += `   🔴 Critical: ${critical}\n`;
  output += `   🟠 High: ${high}\n`;
  output += `   🟡 Moderate: ${moderate}\n`;
  output += `   🟢 Low: ${low}\n\n`;

  if (result.vulnerabilities.length > 0) {
    output += `**Details:**\n\n`;
    result.vulnerabilities.forEach((vuln, index) => {
      const severityEmoji = getSeverityEmoji(vuln.severity);
      output += `${index + 1}. ${severityEmoji} **${vuln.title}**\n`;
      output += `   Package: ${vuln.package}\n`;
      if (vuln.affectedVersions) {
        output += `   Affected: ${vuln.affectedVersions}\n`;
      }
      if (vuln.patchedVersions) {
        output += `   Patched: ${vuln.patchedVersions}\n`;
      }
      if (vuln.url) {
        output += `   🔗 ${vuln.url}\n`;
      }
      output += `\n`;
    });
  }

  return output;
}

function getRegistryEmoji(registry: string): string {
  const emojis: Record<string, string> = {
    npm: "📦",
    jsr: "📚",
    deno: "🦕",
    unknown: "❓",
  };
  return emojis[registry] || "📦";
}

function getCDNEmoji(provider: string): string {
  const emojis: Record<string, string> = {
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

function getSeverityEmoji(severity: string): string {
  const emojis: Record<string, string> = {
    critical: "🔴",
    high: "🟠",
    moderate: "🟡",
    low: "🟢",
  };
  return emojis[severity] || "⚪";
}


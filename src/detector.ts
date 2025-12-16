/**
 * Registry detection utilities
 */

import type { RegistryType } from "./types.ts";

export interface RegistryInfo {
    name: string;
    url: string;
    searchUrl: string;
    packageUrl: (name: string) => string;
}

/**
 * Detects the most likely registry for a given package name
 * 
 * @param packageName - The package name to detect registry for
 * @returns The detected registry type
 * 
 * @example
 * ```ts
 * detectRegistry("@std/path"); // "jsr"
 * detectRegistry("lodash"); // "npm"
 * detectRegistry("https://deno.land/x/"); // "deno"
 * ```
 */
export function detectRegistry(packageName: string): RegistryType {
    // JSR packages typically use @scope/package format
    if (packageName.startsWith("@") && packageName.includes("/")) {
        // Check if it's a JSR-style scope
        const parts = packageName.split("/");
        if (parts.length === 2 && parts[0].startsWith("@")) {
            return "jsr";
        }
    }

    // Deno packages often have deno.land or nest.land URLs
    if (
        packageName.includes("deno.land") ||
        packageName.includes("nest.land") ||
        packageName.startsWith("https://") ||
        packageName.startsWith("http://")
    ) {
        return "deno";
    }

    // JSR packages can also use jsr: specifier
    if (packageName.startsWith("jsr:")) {
        return "jsr";
    }

    // npm: specifier indicates npm
    if (packageName.startsWith("npm:")) {
        return "npm";
    }

    // Default to npm for most common cases
    return "npm";
}

/**
 * Gets registry information and search URLs
 * 
 * @param registry - The registry type
 * @returns Registry metadata
 */
export function getRegistryInfo(registry: RegistryType): RegistryInfo {
    const info = {
        npm: {
            name: "npm",
            url: "https://www.npmjs.com",
            searchUrl: "https://registry.npmjs.org/-/v1/search",
            packageUrl: (name: string) => `https://www.npmjs.com/package/${name}`,
        },
        jsr: {
            name: "JSR",
            url: "https://jsr.io",
            searchUrl: "https://jsr.io/api/packages",
            packageUrl: (name: string) => `https://jsr.io/${name}`,
        },
        deno: {
            name: "Deno",
            url: "https://deno.land",
            searchUrl: "https://api.deno.com/v2/modules",
            packageUrl: (name: string) => `https://deno.land/x/${name}`,
        },
        unknown: {
            name: "Unknown",
            url: "",
            searchUrl: "",
            packageUrl: () => "",
        },
    };

    return info[registry];
}


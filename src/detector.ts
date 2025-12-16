import type { RegistryType } from "./types.ts";

export interface RegistryInfo {
    name: string;
    url: string;
    searchUrl: string;
    packageUrl: (name: string) => string;
}

export function detectRegistry(packageName: string): RegistryType {
    if (packageName.startsWith("@") && packageName.includes("/")) {
        const parts = packageName.split("/");
        if (parts.length === 2 && parts[0].startsWith("@")) {
            return "jsr";
        }
    }

    if (
        packageName.includes("deno.land") ||
        packageName.includes("nest.land") ||
        packageName.startsWith("https://") ||
        packageName.startsWith("http://")
    ) {
        return "deno";
    }

    if (packageName.startsWith("jsr:")) {
        return "jsr";
    }

    if (packageName.startsWith("npm:")) {
        return "npm";
    }

    return "npm";
}

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


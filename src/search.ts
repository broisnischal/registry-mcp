import { detectRegistry, getRegistryInfo } from "./detector.ts";
import type { PackageInfo, RegistryType, SearchResult } from "./types.ts";

export async function searchNpm(
    query: string,
    limit = 20,
): Promise<SearchResult> {
    try {
        const registryInfo = getRegistryInfo("npm");
        const url = `${registryInfo.searchUrl}?text=${encodeURIComponent(query)}&size=${limit}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`npm search failed: ${response.statusText}`);
        }

        const data = await response.json();

        const packages: PackageInfo[] = (data.objects || []).map((obj: any) => {
            const pkg = obj.package;
            return {
                name: pkg.name,
                version: pkg.version,
                description: pkg.description,
                author: pkg.author?.name || pkg.publisher?.username,
                license: pkg.license,
                repository: pkg.links?.repository || pkg.repository?.url,
                homepage: pkg.links?.npm || pkg.homepage,
                keywords: pkg.keywords,
                registry: "npm" as RegistryType,
                registryUrl: registryInfo.packageUrl(pkg.name),
                publishedAt: pkg.date,
                downloads: pkg.downloads?.total || 0,
                dependencies: pkg.dependencies,
            };
        });

        return {
            query,
            registry: "npm",
            packages,
            total: data.total,
        };
    } catch (error) {
        return {
            query,
            registry: "npm",
            packages: [],
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

export async function searchJsr(
    query: string,
    limit = 20,
): Promise<SearchResult> {
    try {
        const registryInfo = getRegistryInfo("jsr");
        const url = `https://jsr.io/api/packages?q=${encodeURIComponent(query)}&limit=${limit}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`JSR search failed: ${response.statusText}`);
        }

        const data = await response.json();

        const packages: PackageInfo[] = (data.items || []).map((pkg: any) => {
            const scope = pkg.scope || "";
            const name = pkg.name || "";
            const fullName = scope ? `@${scope}/${name}` : name;

            return {
                name: fullName,
                version: pkg.latestVersion,
                description: pkg.description,
                registry: "jsr" as RegistryType,
                registryUrl: registryInfo.packageUrl(fullName),
                publishedAt: pkg.updatedAt,
                keywords: pkg.keywords,
            };
        });

        return {
            query,
            registry: "jsr",
            packages,
            total: data.total,
        };
    } catch (error) {
        return {
            query,
            registry: "jsr",
            packages: [],
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

export async function searchDeno(
    query: string,
    limit = 20,
): Promise<SearchResult> {
    try {
        const registryInfo = getRegistryInfo("deno");
        const url = `https://api.deno.com/v2/modules?query=${encodeURIComponent(query)}&limit=${limit}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Deno search failed: ${response.statusText}`);
        }

        const data = await response.json();

        const packages: PackageInfo[] = (data.data || []).map((pkg: any) => {
            return {
                name: pkg.name,
                version: pkg.latestVersion,
                description: pkg.description,
                author: pkg.owner,
                repository: pkg.repository,
                homepage: pkg.homepage,
                registry: "deno" as RegistryType,
                registryUrl: registryInfo.packageUrl(pkg.name),
                publishedAt: pkg.updatedAt,
                downloads: pkg.starCount,
            };
        });

        return {
            query,
            registry: "deno",
            packages,
            total: data.total,
        };
    } catch (error) {
        return {
            query,
            registry: "deno",
            packages: [],
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

export async function search(
    query: string,
    limit = 20,
    registry?: RegistryType,
): Promise<SearchResult> {
    const reg = registry || detectRegistry(query);

    switch (reg) {
        case "npm":
            return searchNpm(query, limit);
        case "jsr":
            return searchJsr(query, limit);
        case "deno":
            return searchDeno(query, limit);
        default:
            return searchNpm(query, limit);
    }
}

export async function searchAll(
    query: string,
    limit = 20,
): Promise<SearchResult[]> {
    const [npmResults, jsrResults, denoResults] = await Promise.all([
        searchNpm(query, limit),
        searchJsr(query, limit),
        searchDeno(query, limit),
    ]);

    return [npmResults, jsrResults, denoResults];
}


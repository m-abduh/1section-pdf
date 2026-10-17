export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "1Section";
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "1section.com";

export function isLocalRoot(): boolean {
  return ROOT_DOMAIN.includes("localhost") || ROOT_DOMAIN.includes("lvh.me");
}

export function useSubdomains(): boolean {
  return process.env.NEXT_PUBLIC_USE_SUBDOMAINS !== "false";
}

export function nicheUrl(slug: string): string {
  if (useSubdomains()) {
    const protocol = isLocalRoot() ? "http" : "https";
    return `${protocol}://${slug}.${ROOT_DOMAIN}`;
  }
  return `/niche/${slug}`;
}

export function apiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

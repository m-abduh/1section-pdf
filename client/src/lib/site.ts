export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "1Section";
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "1section.com";

export function useSubdomains(): boolean {
  const flag = process.env.NEXT_PUBLIC_USE_SUBDOMAINS;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return !ROOT_DOMAIN.includes("localhost") && ROOT_DOMAIN !== "lvh.me";
}

export function nicheUrl(slug: string): string {
  if (useSubdomains()) {
    return `https://${slug}.${ROOT_DOMAIN}`;
  }
  return `/niche/${slug}`;
}

export function apiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

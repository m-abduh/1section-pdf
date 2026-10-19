export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "1section";
export const SITE_TAGLINE =
  process.env.NEXT_PUBLIC_SITE_TAGLINE ??
  "Practical learning for the problems that actually matter";
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

export function resourceUrl(nicheSlug: string, productSlug: string): string {
  if (useSubdomains()) {
    const protocol = isLocalRoot() ? "http" : "https";
    return `${protocol}://${nicheSlug}.${ROOT_DOMAIN}/resources/${productSlug}`;
  }
  return `/resources/${productSlug}`;
}

export function rootUrl(): string {
  if (useSubdomains()) {
    const protocol = isLocalRoot() ? "http" : "https";
    return `${protocol}://${ROOT_DOMAIN}`;
  }
  return "/";
}

export const SOCIAL_HANDLE_PREFIX =
  process.env.NEXT_PUBLIC_SOCIAL_HANDLE_PREFIX ?? "1section.";

export interface SocialLink {
  platform: "YouTube" | "Instagram" | "TikTok";
  handle: string;
  url: string;
}

export function socialHandle(slug: string): string {
  return `${SOCIAL_HANDLE_PREFIX}${slug}`;
}

export function socialLinks(slug: string): SocialLink[] {
  const handle = socialHandle(slug);
  return [
    {
      platform: "YouTube",
      handle,
      url: `https://www.youtube.com/@${handle}`,
    },
    {
      platform: "Instagram",
      handle,
      url: `https://www.instagram.com/${handle}/`,
    },
    {
      platform: "TikTok",
      handle,
      url: `https://www.tiktok.com/@${handle}`,
    },
  ];
}

export function apiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

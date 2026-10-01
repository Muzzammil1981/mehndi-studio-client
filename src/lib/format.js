import { API_BASE } from "./api";

/**
 * Build a usable image URL.
 *  - imageUrl(path)           -> full-size image
 *  - imageUrl(path, "thumb")  -> small 640px version (grids, cart, search, thumbnails)
 * External http(s) URLs and legacy /uploads paths are returned untouched.
 */
export function imageUrl(src, size) {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://")) return src;

    const full = `${API_BASE}${src}`;
    if (size === "thumb" && src.startsWith("/api/designs/")) {
        return `${full}${full.includes("?") ? "&" : "?"}size=thumb`;
    }
    return full;
}

export function currency(value) {
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value || 0);
}
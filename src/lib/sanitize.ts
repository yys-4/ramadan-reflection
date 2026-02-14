/**
 * Input sanitization utilities — defense-in-depth layer.
 *
 * Although React's JSX auto-escapes rendered strings (preventing most XSS),
 * and Supabase parameterized queries prevent SQL injection, these utilities
 * provide an additional safety net for:
 *   1. Any future use of `dangerouslySetInnerHTML` or raw HTML rendering.
 *   2. User-generated content stored in the database (e.g., the `notes` field
 *      on `habit_logs`) that could be consumed by other clients or APIs.
 *   3. Third-party integrations that may not auto-escape.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
};

/**
 * Escapes HTML special characters to prevent XSS in contexts where content
 * might be rendered outside of React's JSX protection (e.g., share cards,
 * email digests, or raw DOM manipulation via html-to-image).
 */
export function escapeHtml(input: string): string {
    return input.replace(/[&<>"'/]/g, (char) => HTML_ENTITY_MAP[char] || char);
}

/**
 * Sanitizes user text input by trimming whitespace and stripping HTML tags.
 * Use this for plain-text fields (habit names, notes) where markup is never
 * expected. This is intentionally aggressive — it removes ALL tags, not just
 * dangerous ones, because these fields should never contain HTML.
 */
export function sanitizeTextInput(input: string): string {
    return input
        .trim()
        .replace(/<[^>]*>/g, "") // Strip all HTML tags
        .slice(0, 500); // Cap at 500 chars to prevent oversized payloads
}

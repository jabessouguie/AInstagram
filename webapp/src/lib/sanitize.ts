/**
 * Shared input-sanitization utilities used by API routes before injecting
 * user-controlled values into AI prompts or external requests.
 */

/**
 * Sanitizes user-supplied text before injection into an AI prompt.
 * Strips angle brackets that could be confused with XML delimiters,
 * and truncates to a safe maximum length.
 *
 * @param input - Raw user input string.
 * @param maxLength - Maximum number of characters to keep (default 500).
 * @returns Sanitized, truncated string.
 */
export function sanitizePromptInput(input: string, maxLength = 500): string {
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, "") // remove angle brackets to prevent XML/delimiter injection
    .trim();
}

/**
 * Wraps sanitized user input in XML-style delimiters so the model can
 * distinguish it clearly from system instructions.
 *
 * @param input - Raw user input (will be sanitized internally).
 * @param tag - Tag name to use (default "user_input").
 * @param maxLength - Passed to sanitizePromptInput.
 * @returns Delimited string, e.g. `<user_input>…</user_input>`.
 */
export function wrapUserInput(input: string, tag = "user_input", maxLength = 500): string {
  return `<${tag}>${sanitizePromptInput(input, maxLength)}</${tag}>`;
}

/**
 * Validates an email address with a strict regex (RFC 5322 subset).
 *
 * @param email - Email string to validate.
 * @returns True if the email looks valid.
 */
export function isValidEmail(email: string): boolean {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.trim());
}

/**
 * Validates an Instagram handle.
 * Allows alphanumeric characters, underscores, and dots (1–30 chars).
 * Strips a leading "@" if present.
 *
 * @param handle - Instagram handle string (with or without "@").
 * @returns True if the handle is safe to use in a URL.
 */
export function isValidInstagramHandle(handle: string): boolean {
  const clean = handle.replace(/^@/, "").trim();
  return /^[a-zA-Z0-9_.]{1,30}$/.test(clean);
}

/**
 * Escapes special Markdown characters in a user-supplied string to prevent
 * Markdown injection when embedding the string in GitHub issues or similar.
 *
 * @param text - Raw user text.
 * @returns Escaped Markdown-safe string.
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

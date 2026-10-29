/**
 * Copy text with a legacy fallback. Returns whether the text actually reached
 * the clipboard, so callers never report success optimistically.
 */
export async function writeTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission or focus failures fall through to execCommand.
    }
  }

  if (typeof document === "undefined") return false;

  const active = document.activeElement;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "-9999px";
  area.style.opacity = "0";
  document.body.appendChild(area);

  try {
    area.focus();
    area.select();
    area.setSelectionRange(0, area.value.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
    if (active instanceof HTMLElement) {
      try {
        active.focus({ preventScroll: true });
      } catch {
        // The original element may have been unmounted.
      }
    }
  }
}

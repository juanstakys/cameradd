export function sanitizeOCRTextForArg(input: string): string {
  let s = input.trim();
  // Remove common currency symbols and spaces within
  s = s.replace(/[\s\u00A0]/g, "");
  s = s.replace(/[\$€£¥₡₲₵₦₨₩₫₱₪₺₽RArs]/gi, "");
  // Normalize unicode similar chars
  const map: Record<string, string> = {
    O: "0",
    o: "0",
    D: "0",
    I: "1",
    l: "1",
    i: "1",
    '|': "1",
    S: "5",
    s: "5",
    B: "8",
    G: "6",
    Z: "2",
  };
  s = s
    .split("")
    .map((ch) => (map[ch] ? map[ch] : ch))
    .join("");
  // Remove any stray characters except digits, dot and comma
  s = s.replace(/[^0-9.,]/g, "");
  return s;
}

// Parses a single OCR word as an Argentine formatted positive number and returns cents.
export function parseArgCurrencyWordToCents(input: string): number | null {
  const s = sanitizeOCRTextForArg(input);
  if (!s) return null;

  // If both separators present, enforce AR format: dot as thousands, comma as decimal
  if (s.includes(",")) {
    const [intPart, decPartRaw] = s.split(",");
    // Validate thousands grouping if dots exist
    if (intPart.includes(".")) {
      const parts = intPart.split(".");
      if (!/^[0-9]{1,3}(\.[0-9]{3})*$/.test(intPart)) return null;
    }
    const intDigits = intPart.replace(/\./g, "");
    if (!/^[0-9]+$/.test(intDigits)) return null;
    if (decPartRaw.length === 0 || decPartRaw.length > 2) return null; // currency: max 2 decimals
    if (!/^[0-9]{1,2}$/.test(decPartRaw)) return null;
    const cents = parseInt(intDigits, 10) * 100 + parseInt(decPartRaw.padEnd(2, "0"), 10);
    return Number.isFinite(cents) ? cents : null;
  } else {
    // No comma present: accept integers; dots must be valid thousands grouping if present
    if (s.includes(".")) {
      if (!/^[0-9]{1,3}(\.[0-9]{3})*$/.test(s)) return null;
    }
    const intDigits = s.replace(/\./g, "");
    if (!/^[0-9]+$/.test(intDigits)) return null;
    const cents = parseInt(intDigits, 10) * 100;
    return Number.isFinite(cents) ? cents : null;
  }
}

export function formatCentsArg(cents: number): string {
  const abs = Math.abs(Math.round(cents));
  const intPart = Math.floor(abs / 100);
  const dec = abs % 100;
  // Format int with dot thousands
  const intStr = intPart
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decStr = dec.toString().padStart(2, "0");
  return `${intStr},${decStr}`;
}


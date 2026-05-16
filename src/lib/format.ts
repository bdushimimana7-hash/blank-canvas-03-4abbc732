export function formatRwandaPhone(raw: string): string | null {
  // Strip spaces, dashes, parens
  const digits = raw.replace(/[\s\-()]/g, "").replace(/\D/g, "");
  // Valid Rwanda mobile prefixes: 78, 79, 72, 73
  // Accept: 07[8/9/2/3]XXXXXXX (10 digits) or 2507[8/9/2/3]XXXXXXX (12 digits)
  if (/^07[2389]\d{7}$/.test(digits)) return "+250" + digits.slice(1);
  if (/^2507[2389]\d{7}$/.test(digits)) return "+" + digits;
  return null;
}

export function fillTemplate(
  tpl: string,
  vars: { name: string; position: number | string; wait: number | string; business?: string }
) {
  return tpl
    .replaceAll("{name}", String(vars.name))
    .replaceAll("{position}", String(vars.position))
    .replaceAll("{wait}", String(vars.wait))
    .replaceAll("{business}", String(vars.business ?? ""));
}

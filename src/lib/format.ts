export function formatRwandaPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  // Accept 07XXXXXXXX (10 digits starting 07) or 2507XXXXXXXX
  if (/^07\d{8}$/.test(digits)) return "+250" + digits.slice(1);
  if (/^2507\d{8}$/.test(digits)) return "+" + digits;
  if (/^\+?2507\d{8}$/.test(raw)) return raw.startsWith("+") ? raw : "+" + raw;
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

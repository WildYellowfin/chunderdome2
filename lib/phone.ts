// Phone numbers are stored in E.164 (+14155550123). US numbers can be typed
// without the country code. Shared by the server and the sign-in form.
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) {
    const d = digits.slice(1).replace(/\D/g, "");
    return d.length >= 8 && d.length <= 15 ? `+${d}` : null;
  }
  const d = digits.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}

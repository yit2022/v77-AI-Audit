import { cookies } from "next/headers";
import { isLocale, type Locale } from "./dictionaries";

export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  const raw = jar.get("v77_locale")?.value;
  return isLocale(raw) ? raw : "en";
}

import { cookies } from "next/headers";

export async function getTokenFromCookies(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get("token")?.value;
  return token || null;
}

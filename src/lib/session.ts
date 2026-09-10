import "server-only";
import { auth } from "./auth";
import { headers } from "next/headers";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  // role is an additionalField on the user/session payload — use it directly when present
  // to avoid a second DB round-trip on every request. Only fall back to a fresh DB read
  // if it's ever missing (e.g. an older cached cookie from before this field existed).
  const sessionUser = session.user as typeof session.user & { role?: string };
  if (sessionUser.role) {
    return sessionUser as typeof sessionUser & { id: string; role: string };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
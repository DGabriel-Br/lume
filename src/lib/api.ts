import { NextResponse } from "next/server";
import { auth } from "./auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function getApiSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session as typeof session & { user: { id: string } };
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const encodedKey = new TextEncoder().encode(process.env.SESSION_SECRET);

async function getRole(request: NextRequest): Promise<"BUYER" | "SELLER" | null> {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return (payload.role as "BUYER" | "SELLER") ?? null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = await getRole(request);

  if (pathname.startsWith("/seller")) {
    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role !== "SELLER") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/orders")) {
    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role !== "BUYER") {
      return NextResponse.redirect(new URL("/seller", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/seller/:path*", "/orders/:path*"],
};

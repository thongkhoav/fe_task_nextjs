import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import authenticated from "./app/(auth)/actions/authenticated";

const privatePaths = ["/"];
const authPaths = ["/login", "/signup"];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthen = await authenticated();
  // Un-authen will be redirect to login
  if (privatePaths.some((path) => pathname.startsWith(path)) && !isAuthen) {
    console.log("redirect to login");
    if (!authPaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  // Authenticated will be redirect to rooms
  if (authPaths.some((path) => pathname.startsWith(path)) && !!isAuthen) {
    return NextResponse.redirect(new URL("/rooms", request.url));
  }
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/products/:path*",
    "/rooms",
    "/rooms/:path*",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import authenticated from "./app/(auth)/actions/authenticated";

const privatePaths = ["/rooms"];
const authPaths = ["/login", "/signup"];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // const isAuthen = await authenticated();
  const cookieCredential = request.cookies.get("TaskApp_Tokens")?.value;
  console.log("cookie auth:", cookieCredential);
  const isAuthenticated = !!cookieCredential;
  // Un-authen will be redirect to login
  if (
    privatePaths.some((path) => pathname.startsWith(path)) &&
    !isAuthenticated
  ) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  // Authenticated will be redirect to rooms
  if (authPaths.some((path) => pathname.startsWith(path)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/rooms", request.url));
  }
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/", "/login", "/signup", "/rooms", "/rooms/:path*"],
};

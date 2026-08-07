export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    "/register/:path*",
    "/my-registration/:path*",
    "/create/:path*",
    "/my-team/:path*",
    "/final-confirmation/:path*",
    "/submission/:path*",
    "/admin/:path*",
  ],
};

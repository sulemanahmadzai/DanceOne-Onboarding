import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Role-based route access configuration
const ROLE_ROUTES: Record<string, string[]> = {
  nd: ["/nd"],
  hr: ["/hr", "/nd/new-request"], // HR can also create new hire requests
  admin: ["/nd", "/hr", "/admin"], // Admin can access all routes
};

const ROLE_DEFAULT_DASHBOARD: Record<string, string> = {
  nd: "/nd/dashboard",
  hr: "/hr/dashboard",
  admin: "/admin/dashboard",
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Allow public routes
  const publicRoutes = [
    "/auth/login",
    "/auth/accept-invite",
    "/candidate",
    "/api",
  ];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname.startsWith(route) || pathname === "/"
  );

  if (!user && !isPublicRoute) {
    // No user, redirect to login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If user is logged in, check role-based access
  if (user && !isPublicRoute) {
    // Check cached role from cookie (valid for 7 days)
    const cachedRole = request.cookies.get("user_role")?.value;
    const cachedUserId = request.cookies.get("user_role_id")?.value;

    let userRole = cachedRole;

    // If cache is valid (same user), use it - no DB/API call needed!
    // If cache is missing or user changed, we'll let the layout fetch it once
    // and set the needsRoleRefresh flag for the layout to handle
    if (cachedRole && cachedUserId === user.id) {
      // Cache hit - super fast path, no additional calls needed
      userRole = cachedRole;
    } else {
      // Cache miss - set a flag cookie so the layout knows to refresh
      // The layout (server component) will fetch the role and set the cache
      supabaseResponse.cookies.set("needs_role_refresh", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60, // Short-lived flag
        path: "/",
      });

      // Use default role for initial navigation, layout will correct if needed
      userRole = "nd";
    }

    // Check if user is trying to access login page
    if (pathname === "/auth/login") {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_DEFAULT_DASHBOARD[userRole] || "/nd/dashboard";
      return NextResponse.redirect(url);
    }

    // Check role-based route access
    const allowedRoutes = ROLE_ROUTES[userRole] || [];
    const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));

    if (!isAllowed && pathname !== "/") {
      // Redirect to appropriate dashboard if accessing unauthorized route
      const url = request.nextUrl.clone();
      url.pathname = ROLE_DEFAULT_DASHBOARD[userRole] || "/nd/dashboard";
      return NextResponse.redirect(url);
    }

    // Redirect root to appropriate dashboard
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_DEFAULT_DASHBOARD[userRole] || "/nd/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

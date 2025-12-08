import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Role-based route access configuration
const ROLE_ROUTES: Record<string, string[]> = {
  nd: ["/nd"],
  hr: ["/hr"],
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
  const publicRoutes = ["/auth/login", "/auth/accept-invite", "/candidate", "/api"];
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
    // Get user role from cookie, but verify it matches the current user
    const cachedRole = request.cookies.get("user_role")?.value;
    const cachedUserId = request.cookies.get("user_role_id")?.value;
    
    let userRole = cachedRole;

    // If no cached role or user ID changed, fetch fresh role
    if (!userRole || cachedUserId !== user.id) {
      try {
        const response = await fetch(
          `${request.nextUrl.origin}/api/auth/user-role`,
          {
            headers: {
              cookie: request.headers.get("cookie") || "",
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          userRole = data.role;
          // Set role and user ID in response cookie for future requests
          supabaseResponse.cookies.set("user_role", userRole || "nd", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60, // 1 hour
          });
          supabaseResponse.cookies.set("user_role_id", user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60, // 1 hour
          });
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    }

    userRole = userRole || "nd"; // Default to nd if role not found

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


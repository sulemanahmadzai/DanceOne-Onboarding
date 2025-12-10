import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import DashboardLayoutClient from "./DashboardLayoutClient";

// This is a SERVER component - data is fetched once on the server
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const cookieStore = await cookies();
  const cachedRole = cookieStore.get("user_role")?.value;
  const cachedName = cookieStore.get("user_name")?.value;
  const cachedUserId = cookieStore.get("user_role_id")?.value;

  let userData = {
    id: 0,
    name: cachedName || user.email?.split("@")[0] || "User",
    email: user.email || "",
    role: cachedRole || "nd",
  };

  // Only query DB if cache is missing or user changed
  const shouldFetchFromDB = !cachedRole || cachedUserId !== user.id;

  if (shouldFetchFromDB) {
    // Get user from database
    let dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseAuthId, user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Fallback to email lookup if supabaseAuthId not found
    if (!dbUser && user.email) {
      dbUser = await db.query.users.findFirst({
        where: eq(users.email, user.email),
        columns: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (dbUser) {
        // Update the supabaseAuthId for future lookups
        await db
          .update(users)
          .set({ supabaseAuthId: user.id })
          .where(eq(users.id, dbUser.id));
      }
    }

    if (dbUser) {
      userData = {
        id: dbUser.id,
        name: dbUser.name || user.email?.split("@")[0] || "User",
        email: dbUser.email,
        role: dbUser.role,
      };
    }
  }

  // Pass needsCacheRefresh flag to client component to trigger cookie update via API
  const needsCacheRefresh = shouldFetchFromDB;

  return (
    <DashboardLayoutClient
      userData={userData}
      needsCacheRefresh={needsCacheRefresh}
      supabaseUserId={user.id}
    >
      {children}
    </DashboardLayoutClient>
  );
}

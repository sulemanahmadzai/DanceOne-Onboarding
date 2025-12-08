import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createClient } from "@supabase/supabase-js";

// This endpoint seeds the database with test users
// WARNING: Only use in development!

export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Seeding is not allowed in production" },
      { status: 403 }
    );
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Need service role key for admin operations
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const testUsers = [
      {
        email: "admin@danceone.com",
        password: "Admin123!",
        name: "Admin User",
        role: "admin",
      },
      {
        email: "hr@danceone.com",
        password: "Hr123456!",
        name: "HR Manager",
        role: "hr",
      },
      {
        email: "nd@danceone.com",
        password: "Nd123456!",
        name: "National Director",
        role: "nd",
      },
    ];

    const results = [];

    for (const testUser of testUsers) {
      let authUserId: string | null = null;
      
      // First, check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === testUser.email);
      
      if (existingUser) {
        // Update the existing user's password
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          {
            password: testUser.password,
            email_confirm: true,
          }
        );
        
        if (updateError) {
          results.push({
            email: testUser.email,
            status: "update error",
            error: updateError.message,
          });
          continue;
        }
        
        authUserId = existingUser.id;
        results.push({
          email: testUser.email,
          status: "updated password",
          authId: authUserId,
        });
      } else {
        // Create new user
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: testUser.email,
            password: testUser.password,
            email_confirm: true,
          });
          
        if (authError) {
          results.push({
            email: testUser.email,
            status: "create error",
            error: authError.message,
          });
          continue;
        }
        
        authUserId = authData.user?.id || null;
        results.push({
          email: testUser.email,
          status: "created",
          authId: authUserId,
        });
      }

      // Insert or update user in database
      try {
        if (authUserId) {
          await db
            .insert(users)
            .values({
              supabaseAuthId: authUserId,
              email: testUser.email,
              name: testUser.name,
              role: testUser.role,
              isActive: true,
            })
            .onConflictDoUpdate({
              target: users.email,
              set: {
                supabaseAuthId: authUserId,
                name: testUser.name,
                role: testUser.role,
                isActive: true,
              },
            });
          results.push({
            email: testUser.email,
            dbStatus: "synced",
          });
        }
      } catch (dbError: any) {
        results.push({
          email: testUser.email,
          dbStatus: "error",
          dbError: dbError.message,
        });
      }
    }

    return NextResponse.json({
      message: "Seed completed",
      results,
      credentials: testUsers.map((u) => ({
        email: u.email,
        password: u.password,
        role: u.role,
      })),
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: error.message || "Seed failed" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// This endpoint applies pending migrations
// WARNING: Only use in development!

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Migrations are not allowed in production via API" },
      { status: 403 }
    );
  }

  try {
    const results: string[] = [];

    // Run all migrations with IF NOT EXISTS to be idempotent
    try {
      await db.execute(sql`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "supabase_auth_id" varchar(100)
      `);
      results.push("Ensured supabase_auth_id column exists");
    } catch (e: any) {
      results.push(`supabase_auth_id: ${e.message}`);
    }

    try {
      await db.execute(sql`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL
      `);
      results.push("Ensured is_active column exists");
    } catch (e: any) {
      results.push(`is_active: ${e.message}`);
    }

    try {
      await db.execute(sql`
        ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL
      `);
      results.push("Made password_hash nullable");
    } catch (e: any) {
      results.push(`password_hash: ${e.message}`);
    }

    // Try to add unique constraint (might already exist)
    try {
      await db.execute(sql`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'users_supabase_auth_id_unique'
          ) THEN 
            ALTER TABLE "users" ADD CONSTRAINT "users_supabase_auth_id_unique" UNIQUE("supabase_auth_id");
          END IF;
        END $$;
      `);
      results.push("Ensured unique constraint on supabase_auth_id");
    } catch (e: any) {
      results.push(`unique constraint: ${e.message}`);
    }

    return NextResponse.json({
      message: "Migration completed",
      results,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: error.message || "Migration failed" },
      { status: 500 }
    );
  }
}


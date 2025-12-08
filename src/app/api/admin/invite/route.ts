import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { users, UserRole } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { resend, defaultFrom } from "@/lib/email/resend";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin - try both supabaseAuthId and email lookup
    let adminUser = await db.query.users.findFirst({
      where: eq(users.supabaseAuthId, user.id),
    });

    // Fallback to email lookup if supabaseAuthId not found
    if (!adminUser && user.email) {
      adminUser = await db.query.users.findFirst({
        where: eq(users.email, user.email),
      });
    }

    if (!adminUser) {
      console.error("Admin user not found in database:", user.id, user.email);
      return NextResponse.json({ error: "User not found in database" }, { status: 403 });
    }

    if (adminUser.role !== UserRole.ADMIN) {
      console.error("User is not admin:", adminUser.role);
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, role } = body;

    // Validate input
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "Email, name, and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["nd", "hr", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if user already exists in our database
    const existingDbUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingDbUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Also check if user exists in Supabase Auth
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingAuthUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (existingAuthUser) {
      return NextResponse.json(
        { error: "A user with this email already exists in the authentication system" },
        { status: 400 }
      );
    }

    // Get the base URL for the redirect
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Generate a temporary password (user will reset it)
    const tempPassword = crypto.randomBytes(16).toString("hex");

    // Create user directly in Supabase Auth (no email sent by Supabase)
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email so they can log in after setting password
      user_metadata: {
        name,
        role,
      },
    });

    if (createError) {
      console.error("Supabase create user error:", createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    // Generate a password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${baseUrl}/auth/accept-invite`,
      },
    });

    if (resetError) {
      console.error("Generate link error:", resetError);
      // Clean up the created user if we can't generate a link
      await supabaseAdmin.auth.admin.deleteUser(createData.user.id);
      return NextResponse.json(
        { error: "Failed to generate invitation link" },
        { status: 500 }
      );
    }

    // Create user record in our database
    const dbRole = role === "nd" ? UserRole.ND : role === "hr" ? UserRole.HR : UserRole.ADMIN;
    
    await db.insert(users).values({
      supabaseAuthId: createData.user.id,
      email: email.toLowerCase(),
      name,
      role: dbRole,
      isActive: true,
    });

    // Extract the token from the action link
    const actionLink = resetData.properties?.action_link || "";
    
    // Send invitation email via Resend
    const roleDescriptions: Record<string, string> = {
      nd: "National Director",
      hr: "Human Resources Manager",
      admin: "Administrator",
    };

    const rolePermissions: Record<string, string> = {
      nd: `
        <ul style="color: #666; line-height: 1.8;">
          <li>Create new hire requests</li>
          <li>Track onboarding progress</li>
          <li>Resend candidate invitations</li>
        </ul>
      `,
      hr: `
        <ul style="color: #666; line-height: 1.8;">
          <li>View all onboarding requests</li>
          <li>Complete HR forms</li>
          <li>Export data to CSV/Excel</li>
        </ul>
      `,
      admin: `
        <ul style="color: #666; line-height: 1.8;">
          <li>Manage all onboarding requests</li>
          <li>Invite and manage users</li>
          <li>Access all system features</li>
        </ul>
      `,
    };

    try {
      console.log("Sending invitation email...");
      console.log("From:", defaultFrom);
      console.log("To:", email);
      console.log("Action Link:", actionLink);
      console.log("API Key exists:", !!process.env.RESEND_API_KEY);

      const emailResult = await resend.emails.send({
        from: defaultFrom,
        to: email,
        subject: "You're Invited to DanceOne Onboarding Hub",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #5D87FF; font-size: 32px; margin: 0;">DanceOne</h1>
              <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">Onboarding Hub</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
              <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">Welcome, ${name}!</h2>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">
                You've been invited to join as a <strong>${roleDescriptions[role]}</strong>
              </p>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Click the button below to set up your password and activate your account:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; 
                        font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Set Up Your Account
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Once your account is set up, you'll be able to:
            </p>
            ${rolePermissions[role]}
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              This invitation link will expire in 24 hours.<br>
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        `,
      });

      console.log("Email sent successfully:", emailResult);
    } catch (emailError: any) {
      console.error("Resend email error:", emailError);
      console.error("Error details:", JSON.stringify(emailError, null, 2));
      // Don't fail the request - user was created, admin can resend
      return NextResponse.json({
        success: true,
        warning: `User created but email failed to send: ${emailError?.message || 'Unknown error'}. You can resend the invitation.`,
        message: `User created for ${email}`,
        user: {
          id: createData.user.id,
          email,
          name,
          role,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      user: {
        id: createData.user.id,
        email,
        name,
        role,
      },
    });
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json(
      { error: "Failed to invite user" },
      { status: 500 }
    );
  }
}


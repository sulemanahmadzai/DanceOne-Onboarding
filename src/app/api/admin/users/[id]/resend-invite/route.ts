import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { users, UserRole } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { resend, defaultFrom } from "@/lib/email/resend";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await db.query.users.findFirst({
      where: eq(users.supabaseAuthId, user.id),
    });

    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Get the user to resend invitation to
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!targetUser.supabaseAuthId) {
      return NextResponse.json({ error: "User has no auth account" }, { status: 400 });
    }

    // Create Supabase admin client
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the base URL for the redirect
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Generate a new password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: targetUser.email,
      options: {
        redirectTo: `${baseUrl}/auth/accept-invite`,
      },
    });

    if (resetError) {
      console.error("Generate link error:", resetError);
      return NextResponse.json(
        { error: "Failed to generate invitation link" },
        { status: 500 }
      );
    }

    const actionLink = resetData.properties?.action_link || "";
    const role = targetUser.role;
    const name = targetUser.name || targetUser.email;

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

    // Send invitation email via Resend
    try {
      await resend.emails.send({
        from: defaultFrom,
        to: targetUser.email,
        subject: "Your DanceOne Invitation (Resent)",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #5D87FF; font-size: 32px; margin: 0;">DanceOne</h1>
              <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">Onboarding Hub</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
              <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">Hi ${name}!</h2>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">
                Here's a new invitation link to set up your account as a <strong>${roleDescriptions[role] || role}</strong>
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
            ${rolePermissions[role] || ""}
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              This invitation link will expire in 24 hours.<br>
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Resend email error:", emailError);
      return NextResponse.json(
        { error: "Failed to send invitation email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Invitation resent to ${targetUser.email}`,
    });
  } catch (error) {
    console.error("Error resending invitation:", error);
    return NextResponse.json(
      { error: "Failed to resend invitation" },
      { status: 500 }
    );
  }
}




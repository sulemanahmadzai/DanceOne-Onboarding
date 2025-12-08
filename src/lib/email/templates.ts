export function getCandidateInvitationEmail(params: {
  candidateFirstName: string;
  candidateLastName: string;
  tourName: string;
  positionTitle: string;
  candidateLink: string;
}) {
  const { candidateFirstName, candidateLastName, tourName, positionTitle, candidateLink } = params;

  return {
    subject: "DanceOne Onboarding – Please complete your information",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Onboarding</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">DanceOne</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Onboarding Hub</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Welcome, ${candidateFirstName}!</h2>
    
    <p>You have been invited to complete your onboarding information for the following position:</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Tour:</strong> ${tourName}</p>
      <p style="margin: 0;"><strong>Position:</strong> ${positionTitle || 'Not specified'}</p>
    </div>
    
    <p>Please click the button below to complete your personal information. This link will expire in 7 days.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${candidateLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Complete Your Information
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="color: #667eea; font-size: 14px; word-break: break-all;">${candidateLink}</p>
    
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; margin: 0;">
      This is an automated message from DanceOne Onboarding Hub. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `,
  };
}

export function getHRNotificationEmail(params: {
  candidateFirstName: string;
  candidateLastName: string;
  ndName: string;
  tourName: string;
  requestId: number;
  hrLink: string;
}) {
  const { candidateFirstName, candidateLastName, ndName, tourName, requestId, hrLink } = params;

  return {
    subject: `Onboarding ready for HR – ${candidateFirstName} ${candidateLastName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onboarding Ready for HR</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">DanceOne</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Onboarding Hub</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">New Onboarding Ready for Review</h2>
    
    <p>A candidate has completed their onboarding information and is ready for HR review.</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Request ID:</strong> #${requestId}</p>
      <p style="margin: 0 0 10px 0;"><strong>Candidate:</strong> ${candidateFirstName} ${candidateLastName}</p>
      <p style="margin: 0 0 10px 0;"><strong>Submitted by ND:</strong> ${ndName}</p>
      <p style="margin: 0;"><strong>Tour:</strong> ${tourName}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${hrLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Review & Complete
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; margin: 0;">
      This is an automated message from DanceOne Onboarding Hub.
    </p>
  </div>
</body>
</html>
    `,
  };
}

export function getCompletionConfirmationEmail(params: {
  candidateFirstName: string;
  candidateLastName: string;
  tourName: string;
  recipientName: string;
}) {
  const { candidateFirstName, candidateLastName, tourName, recipientName } = params;

  return {
    subject: `Onboarding Completed – ${candidateFirstName} ${candidateLastName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onboarding Completed</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #13DEB9 0%, #0A7EA4 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✓ Onboarding Complete</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hi ${recipientName},</h2>
    
    <p>The onboarding process has been completed for the following candidate:</p>
    
    <div style="background: #E6FFFA; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #13DEB9;">
      <p style="margin: 0 0 10px 0;"><strong>Candidate:</strong> ${candidateFirstName} ${candidateLastName}</p>
      <p style="margin: 0;"><strong>Tour:</strong> ${tourName}</p>
    </div>
    
    <p>The record is now ready for export to ADP.</p>
    
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; margin: 0;">
      This is an automated message from DanceOne Onboarding Hub.
    </p>
  </div>
</body>
</html>
    `,
  };
}


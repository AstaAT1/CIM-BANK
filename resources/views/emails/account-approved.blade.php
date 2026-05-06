<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Your CIM bank account has been approved</title>
</head>
<body style="margin: 0; background: #F7F8FA; color: #061F39; font-family: Arial, sans-serif; line-height: 1.6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #F7F8FA; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; background: #FFFFFF; border: 1px solid #D1D9DA; border-radius: 12px; overflow: hidden;">
                    <tr>
                        <td style="background: #082F54; padding: 24px 28px; color: #FFFFFF;">
                            <div style="font-size: 13px; font-weight: 700; color: #D4A23C; letter-spacing: .04em; text-transform: uppercase;">Credit-Intelligence-Mizan</div>
                            <h1 style="margin: 8px 0 0; font-size: 22px; line-height: 1.3;">Bank account approved</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 28px;">
                            <p>Hello {{ $user->name }},</p>

                            <p>Your Credit-Intelligence-Mizan (CIM) bank account request has been approved.</p>

                            <p>You can now login to your account and access your dashboard, bank account details, and card information.</p>

                            <p>Thank you for choosing CIM.</p>

                            <p style="margin-top: 28px; color: #64748b; font-size: 13px;">This notification contains only your account request status. For security, CIM will never include sensitive card or document information in this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

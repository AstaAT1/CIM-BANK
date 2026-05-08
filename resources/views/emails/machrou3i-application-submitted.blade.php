<div style="font-family: Arial, sans-serif; color: #061F39; line-height: 1.6;">
    <h1 style="color: #082F54; margin-bottom: 8px;">Machrou3i by CIM</h1>

    <p>Hello {{ $application->user->name }},</p>

    <p>Your Machrou3i application for <strong>{{ $application->project_name }}</strong> has been submitted and is ready for CIM review.</p>

    <div style="border: 1px solid #D1D9DA; border-radius: 8px; padding: 14px; background: #F7F8FA;">
        <p style="margin: 0;">Status: <strong>{{ str_replace('_', ' ', $application->status) }}</strong></p>
        <p style="margin: 6px 0 0;">Risk level: <strong>{{ $application->risk_level ?? 'pending' }}</strong></p>
        <p style="margin: 6px 0 0;">Requested amount: <strong>{{ number_format((float) $application->requested_amount, 2) }} MAD</strong></p>
    </div>

    <p>This message confirms application submission only. CIM staff will review your dossier and salary proof before any next step.</p>

    <p style="color: #0A6474; font-weight: 700;">CIM Bank</p>
</div>

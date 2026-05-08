<div style="font-family: Arial, sans-serif; color: #061F39; line-height: 1.6;">
    <h1 style="color: #082F54; margin-bottom: 8px;">Machrou3i by CIM</h1>

    <p>Hello {{ $application->user->name }},</p>

    <p>Your Machrou3i application for <strong>{{ $application->project_name }}</strong> has a new status: <strong>{{ str_replace('_', ' ', $application->status) }}</strong>.</p>

    @if ($application->offered_amount)
        <div style="border: 1px solid #D1D9DA; border-radius: 8px; padding: 14px; background: #F7F8FA;">
            <p style="margin: 0;">Offered amount: <strong>{{ number_format((float) $application->offered_amount, 2) }} MAD</strong></p>
            <p style="margin: 6px 0 0;">Repayment months: <strong>{{ $application->offered_repayment_months }}</strong></p>
            <p style="margin: 6px 0 0;">Monthly installment: <strong>{{ number_format((float) $application->offered_monthly_installment, 2) }} MAD</strong></p>
        </div>
    @endif

    @if ($application->decision_note)
        <p><strong>Decision note:</strong> {{ $application->decision_note }}</p>
    @endif

    @if ($application->required_documents_note)
        <p><strong>Required documents:</strong> {{ $application->required_documents_note }}</p>
    @endif

    <p>This is a Machrou3i review update, not a final loan disbursement notice.</p>

    <p style="color: #0A6474; font-weight: 700;">CIM Bank</p>
</div>

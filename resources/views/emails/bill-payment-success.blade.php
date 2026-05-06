<h1>CIM bill payment receipt</h1>

<p>Hello {{ $bill->user?->name }},</p>

<p>Your bill payment was completed successfully.</p>

<ul>
    <li><strong>Bill:</strong> {{ $bill->label }}</li>
    <li><strong>Provider:</strong> {{ $bill->provider_name }}</li>
    <li><strong>Amount:</strong> {{ number_format((float) $payment->amount, 2) }} MAD</li>
    <li><strong>Reference:</strong> {{ $payment->reference }}</li>
    <li><strong>Paid at:</strong> {{ $payment->paid_at?->format('M d, Y H:i') }}</li>
    @if ($remainingBalance !== '')
        <li><strong>Remaining balance:</strong> {{ number_format((float) $remainingBalance, 2) }} MAD</li>
    @endif
</ul>

<p>Thank you for using CIM Bills & AutoPay.</p>

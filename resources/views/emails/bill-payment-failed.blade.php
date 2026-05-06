<h1>CIM AutoPay could not process a bill</h1>

<p>Hello {{ $bill->user?->name }},</p>

<p>Your scheduled AutoPay payment was not completed.</p>

<ul>
    <li><strong>Bill:</strong> {{ $bill->label }}</li>
    <li><strong>Provider:</strong> {{ $bill->provider_name }}</li>
    <li><strong>Amount:</strong> {{ number_format((float) $bill->amount, 2) }} MAD</li>
    <li><strong>Reason:</strong> {{ $reason }}</li>
    <li><strong>Reference:</strong> {{ $payment->reference }}</li>
</ul>

<p>Please review your bill settings or account balance before the next scheduled attempt.</p>

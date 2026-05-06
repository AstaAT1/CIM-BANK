@php
    $account = $bill->bankAccount;
    $maskedAccount = $account?->account_number
        ? str_repeat('*', max(0, strlen($account->account_number) - 4)).substr($account->account_number, -4)
        : 'your CIM account';
@endphp

<h1>CIM AutoPay reminder</h1>

<p>Hello {{ $bill->user?->name }},</p>

<p>Your payment is scheduled automatically. Make sure your balance is sufficient.</p>

<ul>
    <li><strong>Bill:</strong> {{ $bill->label }}</li>
    <li><strong>Provider:</strong> {{ $bill->provider_name }}</li>
    <li><strong>Amount:</strong> {{ number_format((float) $bill->amount, 2) }} MAD</li>
    <li><strong>Due date:</strong> {{ $bill->next_due_at?->format('M d, Y H:i') }}</li>
    <li><strong>Account:</strong> {{ $maskedAccount }}</li>
</ul>

<p>CIM AutoPay will process this payment only if your account is active and your balance stays above your configured minimum balance.</p>

<?php

namespace App\Mail;

use App\Models\BillPayment;
use App\Models\CustomerBill;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BillPaymentSuccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public CustomerBill $bill,
        public BillPayment $payment,
        public string $remainingBalance,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "CIM bill payment receipt: {$this->bill->label}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.bill-payment-success',
        );
    }
}

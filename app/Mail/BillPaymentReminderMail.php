<?php

namespace App\Mail;

use App\Models\CustomerBill;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BillPaymentReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public CustomerBill $bill) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "CIM AutoPay reminder: {$this->bill->label} payment scheduled today",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.bill-payment-reminder',
        );
    }
}

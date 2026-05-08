<?php

namespace App\Mail;

use App\Models\Machrou3iApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class Machrou3iApplicationSubmittedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Machrou3iApplication $application) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Machrou3i application submitted',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.machrou3i-application-submitted',
        );
    }
}

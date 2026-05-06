<?php

namespace App\Services;

use App\Models\AccountOpeningRequest;
use App\Models\Appointment;
use App\Models\Atm;
use App\Models\BankAccount;
use App\Models\CustomerProfile;
use App\Models\Document;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

class ChatbotService
{
    private const INTENT_ACCOUNT_STATUS = 'account_status';

    private const INTENT_ATM_STATUS = 'atm_status';

    private const INTENT_ATM_LIST_STATUS = 'atm_list_status';

    private const INTENT_APPOINTMENT_STATUS = 'appointment_status';

    private const INTENT_DOCUMENTS_STATUS = 'documents_status';

    private const INTENT_TRANSFER_HELP = 'transfer_help';

    private const INTENT_AI_ELIGIBLE = 'ai_eligible';

    private const INTENT_AI_UNAVAILABLE = 'ai_unavailable';

    private const INTENT_FALLBACK_SUPPORT = 'fallback_support';

    public function __construct(
        private readonly OpenRouterBankAssistantService $aiAssistant
    ) {}

    /**
     * @return array{message: string, intent: string, metadata: array<string, mixed>}
     */
    public function reply(User $user, string $message): array
    {
        $intent = $this->detectIntent($message);

        return match ($intent) {
            self::INTENT_ACCOUNT_STATUS => $this->accountStatusReply($user),
            self::INTENT_ATM_STATUS => $this->atmStatusReply($message),
            self::INTENT_ATM_LIST_STATUS => $this->atmListStatusReply(),
            self::INTENT_APPOINTMENT_STATUS => $this->appointmentStatusReply($user),
            self::INTENT_DOCUMENTS_STATUS => $this->documentsStatusReply($user),
            self::INTENT_TRANSFER_HELP => $this->transferHelpReply($user),
            self::INTENT_FALLBACK_SUPPORT => $this->fallbackReply(),
            default => $this->aiFallbackReply($message),
        };
    }

    private function detectIntent(string $message): string
    {
        $text = $this->normalize($message);

        if ($this->isGeneralAccountEducationQuestion($text)) {
            return self::INTENT_AI_ELIGIBLE;
        }

        if ($this->isGeneralAccountOpeningQuestion($text)) {
            return self::INTENT_AI_ELIGIBLE;
        }

        if ($this->isGeneralAtmCashListQuestion($text)) {
            return self::INTENT_ATM_LIST_STATUS;
        }

        if ($this->isPersonalAccountStatusQuestion($text)) {
            return self::INTENT_ACCOUNT_STATUS;
        }

        $intentKeywords = [
            self::INTENT_APPOINTMENT_STATUS => [
                'rendez-vous',
                'rdv',
                'appointment',
                'موعد',
                'date',
                'validation appointment',
            ],
            self::INTENT_DOCUMENTS_STATUS => [
                'document',
                'documents',
                'papier',
                'cin',
                'بطاقة',
                'ناقص',
                'naqsin',
                'na9sin',
                'missing',
                'rejected',
            ],
            self::INTENT_TRANSFER_HELP => [
                'transfer',
                'virement',
                'nsift',
                'envoyer',
                'تحويل',
                'ma n9drch',
                'n9drch',
                'pourquoi',
                'why',
            ],
            self::INTENT_ATM_STATUS => [
                'atm',
                'guichet',
                'distributeur',
                'flos',
                'cash',
                'argent',
                'maarif',
                'twin',
                'cfc',
                'casa finance',
                'hay hassani',
            ],
        ];

        foreach ($intentKeywords as $intent => $keywords) {
            if ($this->containsAny($text, $keywords)) {
                return $intent;
            }
        }

        if ($this->isExplicitSupportFallback($text)) {
            return self::INTENT_FALLBACK_SUPPORT;
        }

        return self::INTENT_AI_ELIGIBLE;
    }

    /**
     * @return array{message: string, intent: string, metadata: array<string, mixed>}
     */
    private function accountStatusReply(User $user): array
    {
        $profile = $this->customerProfile($user);
        $request = $this->latestAccountOpeningRequest($user, $profile);
        $account = $this->activeBankAccount($user);
        $documents = $this->documents($user, $request);
        $appointment = $this->nextAppointment($user, $request);

        $documentSummary = $this->documentSummary($documents);
        $status = $this->statusString($request?->getAttribute('status') ?? $profile?->getAttribute('status'));

        $metadata = [
            'profile_status' => $profile?->getAttribute('status'),
            'request_status' => $request?->getAttribute('status'),
            'has_active_account' => (bool) $account,
            'appointment_status' => $appointment?->getAttribute('status'),
            'documents' => $documentSummary,
        ];

        if (! $profile && ! $request && ! $account) {
            return $this->response(
                'ما لقيتش طلب فتح الحساب ديالك دابا. كمل التسجيل والوثائق باش فريق CIM يراجع الطلب.',
                self::INTENT_ACCOUNT_STATUS,
                $metadata
            );
        }

        if ($documentSummary['rejected'] > 0) {
            return $this->response(
                $this->documentsMissingMessage($documentSummary['rejected_types']),
                self::INTENT_ACCOUNT_STATUS,
                $metadata
            );
        }

        if ($documentSummary['pending'] > 0) {
            return $this->response(
                '⏳ حسابك باقي قيد المراجعة. فريق CIM غادي يكمل verification ديالك قريباً.',
                self::INTENT_ACCOUNT_STATUS,
                $metadata
            );
        }

        if (in_array($status, ['rejected', 'refused'], true)) {
            $reason = $this->displayString($request?->getAttribute('rejection_reason'));

            return $this->response(
                $reason
                    ? "❌ طلب فتح الحساب ما تقبلش. السبب: {$reason}. تقدر تصلح المعلومات وترجع تدفع الطلب."
                    : '❌ طلب فتح الحساب ما تقبلش. تقدر تصلح المعلومات وترجع تدفع الطلب.',
                self::INTENT_ACCOUNT_STATUS,
                $metadata
            );
        }

        if ($appointment && in_array($status, ['submitted', 'appointment_scheduled'], true)) {
            return $this->response(
                '📅 خاصك تحضر rendez-vous ديال validation. جيب معاك CIN والوثائق المطلوبة.',
                self::INTENT_ACCOUNT_STATUS,
                $metadata
            );
        }

        if (in_array($status, ['draft', 'submitted', 'pending'], true)) {
            return $this->response(
                '⏳ حسابك باقي قيد المراجعة. فريق CIM غادي يكمل verification ديالك قريباً.',
                self::INTENT_ACCOUNT_STATUS,
                $metadata
            );
        }

        if (in_array($status, ['under_review', 'appointment_scheduled'], true)) {
            return $this->response(
                '🔎 طلبك دابا under review. منين يكمل الموظف المراجعة غادي يبان ليك status النهائي.',
                self::INTENT_ACCOUNT_STATUS,
                $metadata
            );
        }

        if (in_array($status, ['approved', 'account_created'], true) && ! $account) {
            return $this->response(
                '✅ طلبك approved، ولكن الحساب ما باينش active دابا. تسنى التفعيل أو تواصل مع support.',
                self::INTENT_ACCOUNT_STATUS,
                $metadata
            );
        }

        if ($account) {
            return $this->response(
                '✅ حسابك متقبل ومفعل. تقدر دابا تستعمل التحويلات و ATM إلا كان balance كافي.',
                self::INTENT_ACCOUNT_STATUS,
                $metadata
            );
        }

        return $this->response(
            '⏳ حسابك باقي قيد المراجعة. فريق CIM غادي يكمل verification ديالك قريباً.',
            self::INTENT_ACCOUNT_STATUS,
            $metadata
        );
    }

    /**
     * @return array{message: string, intent: string, metadata: array<string, mixed>}
     */
    private function atmStatusReply(string $message): array
    {
        $atm = $this->findAtm($message);

        if (! $atm) {
            return $this->response(
                'ما لقيتش هاد ATM. جرب تكتب الاسم بحال Maarif، Twin Center، CFC، ولا Hay Hassani.',
                self::INTENT_ATM_STATUS,
                ['atm_found' => false]
            );
        }

        $status = $this->statusString($atm->getAttribute('status'));
        $isActive = (bool) $atm->getAttribute('is_active');
        $cash = (float) ($atm->getAttribute('current_cash') ?? 0);
        $threshold = $this->atmLowCashThreshold($atm);
        $name = $this->displayString($atm->getAttribute('name')) ?: 'هاد ATM';

        $metadata = [
            'atm_found' => true,
            'atm_id' => $atm->getKey(),
            'atm_name' => $name,
            'area' => $atm->getAttribute('area'),
            'status' => $status,
            'is_active' => $isActive,
            'current_cash' => $cash,
            'low_cash_threshold' => $threshold,
        ];

        if (in_array($status, ['offline'], true)) {
            return $this->response(
                "🛠️ ATM ديال {$name} حالياً خارج الخدمة. جرب ATM أخرى قريبة.",
                self::INTENT_ATM_STATUS,
                $metadata
            );
        }

        if (! $isActive || in_array($status, ['maintenance', 'out_of_service'], true)) {
            return $this->response(
                "🛠️ ATM ديال {$name} حالياً خارج الخدمة. جرب ATM أخرى قريبة.",
                self::INTENT_ATM_STATUS,
                $metadata
            );
        }

        if ($cash <= 0 || in_array($status, ['empty'], true)) {
            return $this->response(
                "⚠️ ATM ديال {$name} ما فيهاش cash كافي دابا. جرب ATM أخرى قريبة.",
                self::INTENT_ATM_STATUS,
                $metadata
            );
        }

        if ($cash <= $threshold || in_array($status, ['low_cash'], true)) {
            return $this->response(
                "⚠️ ATM ديال {$name} خدامة ولكن cash فيها قليل. حسن تجرب Twin Center أو Casa Finance City.",
                self::INTENT_ATM_STATUS,
                $metadata
            );
        }

        return $this->response(
            "✅ ATM ديال {$name} خدامة وفيها cash كافي. تقدر تسحب إلا كان حسابك active وفيه balance.",
            self::INTENT_ATM_STATUS,
            $metadata
        );
    }

    /**
     * @return array{message: string, intent: string, metadata: array<string, mixed>}
     */
    private function atmListStatusReply(): array
    {
        if (! $this->hasTable('atms')) {
            return $this->response(
                'ما لقيتش بيانات ATMs دابا. جرب من بعد أو تواصل مع دعم CIM.',
                self::INTENT_ATM_LIST_STATUS,
                ['type' => 'list', 'atms' => []]
            );
        }

        try {
            $query = Atm::query();

            if ($this->hasColumn('atms', 'is_active')) {
                $query->where('is_active', true);
            }

            if ($this->hasColumn('atms', 'status')) {
                $query->whereNotIn('status', ['out_of_service', 'maintenance', 'offline', 'empty']);
            }

            if ($this->hasColumn('atms', 'current_cash')) {
                $query->orderByDesc('current_cash');
            }

            $atms = $query
                ->orderBy('name')
                ->limit(3)
                ->get();
        } catch (Throwable $exception) {
            Log::warning('CIM chatbot ATM list lookup failed.', [
                'exception' => $exception::class,
            ]);

            $atms = collect();
        }

        if ($atms->isEmpty()) {
            return $this->response(
                'ما لقيتش ATM active فيها cash دابا. جرب تسول على منطقة محددة أو تواصل مع دعم CIM.',
                self::INTENT_ATM_LIST_STATUS,
                ['type' => 'list', 'atms' => []]
            );
        }

        $lines = $atms
            ->values()
            ->map(fn (Atm $atm, int $index): string => sprintf(
                '%d. %s - %s MAD',
                $index + 1,
                $atm->name,
                $this->formatMad($atm->getAttribute('current_cash'))
            ))
            ->implode("\n");

        return $this->response(
            "أكثر ATMs فيها cash دابا:\n{$lines}\nتقدر تسحب إلا كان حسابك active وفيه balance.",
            self::INTENT_ATM_LIST_STATUS,
            [
                'type' => 'list',
                'atms' => $atms->map(fn (Atm $atm): array => [
                    'id' => $atm->getKey(),
                    'name' => $atm->name,
                    'area' => $atm->area,
                    'status' => $atm->status,
                    'current_cash' => (float) ($atm->current_cash ?? 0),
                ])->values()->all(),
            ]
        );
    }

    /**
     * @return array{message: string, intent: string, metadata: array<string, mixed>}
     */
    private function appointmentStatusReply(User $user): array
    {
        $request = $this->latestAccountOpeningRequest($user, $this->customerProfile($user));
        $appointment = $this->nextAppointment($user, $request) ?? $this->latestAppointment($user, $request);

        if (! $appointment) {
            return $this->response(
                'ما عندك حتى rendez-vous جاي دابا. إلا كان حسابك باقي pending، تسنى confirmation من CIM.',
                self::INTENT_APPOINTMENT_STATUS,
                ['appointment_found' => false]
            );
        }

        $scheduledAt = $appointment->getAttribute('scheduled_at');
        $date = $scheduledAt ? $scheduledAt->format('d/m/Y') : 'غير محدد';
        $time = $scheduledAt ? $scheduledAt->format('H:i') : 'غير محدد';
        $status = $this->statusString($appointment->getAttribute('status')) ?: 'scheduled';

        return $this->response(
            "📅 عندك rendez-vous يوم {$date} مع {$time}، status: {$status}. جيب معاك CIN والوثائق المطلوبة.",
            self::INTENT_APPOINTMENT_STATUS,
            [
                'appointment_found' => true,
                'appointment_id' => $appointment->getKey(),
                'scheduled_at' => $scheduledAt?->toDateTimeString(),
                'status' => $status,
            ]
        );
    }

    /**
     * @return array{message: string, intent: string, metadata: array<string, mixed>}
     */
    private function documentsStatusReply(User $user): array
    {
        $request = $this->latestAccountOpeningRequest($user, $this->customerProfile($user));
        $documents = $this->documents($user, $request);
        $summary = $this->documentSummary($documents);

        if ($documents->isEmpty()) {
            return $this->response(
                $this->documentsMissingMessage([]),
                self::INTENT_DOCUMENTS_STATUS,
                ['documents' => $summary]
            );
        }

        if ($summary['rejected'] > 0) {
            return $this->response(
                $this->documentsMissingMessage($summary['rejected_types']),
                self::INTENT_DOCUMENTS_STATUS,
                ['documents' => $summary]
            );
        }

        if ($summary['pending'] > 0) {
            return $this->response(
                '⏳ الوثائق ديالك وصلو وباقيين pending review عند فريق CIM.',
                self::INTENT_DOCUMENTS_STATUS,
                ['documents' => $summary]
            );
        }

        return $this->response(
            '✅ الوثائق ديالك باينين مقبولين. إلا الحساب باقي ما تفعلش، verification باقي كتكمل.',
            self::INTENT_DOCUMENTS_STATUS,
            ['documents' => $summary]
        );
    }

    /**
     * @return array{message: string, intent: string, metadata: array<string, mixed>}
     */
    private function transferHelpReply(User $user): array
    {
        $account = $this->activeBankAccount($user);

        return $this->response(
            'باش تصيفط الفلوس خاص الحساب يكون verified و active، يكون عندك balance كافي، وأحياناً خاص beneficiary يكون مضاف.',
            self::INTENT_TRANSFER_HELP,
            [
                'has_active_account' => (bool) $account,
                'read_only' => true,
            ]
        );
    }

    /**
     * @return array{message: string, intent: string, metadata: array<string, mixed>}
     */
    private function fallbackReply(): array
    {
        return $this->response(
            'ما فهمتش الطلب مزيان، ولكن فتحت ليك ticket باش فريق CIM يشوف المشكل.',
            self::INTENT_FALLBACK_SUPPORT,
            ['support_ticket_can_be_created' => true]
        );
    }

    /**
     * @return array{message: string, intent: string, metadata: array<string, mixed>}
     */
    private function aiUnavailableReply(): array
    {
        return $this->response(
            'CIM Assistant دابا ما قدرش يجاوب بالAI. عاود جرب بعد لحظة، أو سَوّلني على حالة الحساب، ATM، الوثائق، rendez-vous، ولا التحويلات.',
            self::INTENT_AI_UNAVAILABLE,
            [
                'provider' => 'openrouter',
                'support_ticket_can_be_created' => false,
            ]
        );
    }

    /**
     * @return array{message: string, intent: string, metadata: array<string, mixed>}
     */
    private function aiFallbackReply(string $message): array
    {
        try {
            $answer = $this->aiAssistant->answer($message, $this->aiContext());
        } catch (Throwable $exception) {
            Log::warning('CIM chatbot AI fallback failed.', [
                'exception' => $exception::class,
            ]);

            $answer = null;
        }

        if (is_array($answer) && isset($answer['message'], $answer['intent'])) {
            return [
                'message' => (string) $answer['message'],
                'intent' => (string) $answer['intent'],
                'metadata' => is_array($answer['metadata'] ?? null) ? $answer['metadata'] : [],
            ];
        }

        return $this->aiUnavailableReply();
    }

    private function aiContext(): array
    {
        return [
            'bank_name' => 'Credit-Intelligence-Mizan',
            'brand' => 'CIM',
            'product_summary' => 'CIM is a banking web app for customers and bank employees.',
            'available_customer_features' => [
                'account opening request tracking',
                'customer profile verification tracking',
                'appointment/rendez-vous tracking',
                'document verification',
                'ATM status and cash availability',
                'bank account activation status',
                'transfer guidance',
                'beneficiary guidance',
                'support tickets',
            ],
            'available_admin_employee_features' => [
                'review customer account opening requests',
                'verify customer documents',
                'manage appointments',
                'view customer details',
                'manage ATM status and cash availability',
                'support customers',
            ],
            'cim_rules' => [
                'A customer cannot fully use banking services until the account is verified/approved and active',
                'ATM withdrawals require an active account and enough balance',
                'Transfers require an active verified account, enough balance, and sometimes a beneficiary',
                'If exact fees, rates, deadlines, or legal rules are not in context, the CIM team will confirm',
            ],
            'safety_rules' => [
                'CIM never asks for password, PIN, OTP, CVV, full card number, or full account number',
                'The assistant cannot approve accounts, reject accounts, transfer money, or change balances',
                'The assistant cannot update ATM cash, update ATM status, or change appointments',
                'Personal account status must come from Laravel database tools, not AI guesses',
            ],
        ];
    }

    private function customerProfile(User $user): ?CustomerProfile
    {
        if (! $this->hasTable('customer_profiles')) {
            return null;
        }

        return $this->safeFirst(function () use ($user) {
            if (method_exists($user, 'profile')) {
                return $user->profile()->first();
            }

            return CustomerProfile::query()
                ->where('user_id', $user->id)
                ->first();
        });
    }

    private function latestAccountOpeningRequest(User $user, ?CustomerProfile $profile = null): ?AccountOpeningRequest
    {
        if (! $this->hasTable('account_opening_requests')) {
            return null;
        }

        return $this->safeFirst(function () use ($user, $profile) {
            if (method_exists($user, 'accountOpeningRequests')) {
                $request = $user->accountOpeningRequests()->latest()->first();

                if ($request) {
                    return $request;
                }
            }

            return AccountOpeningRequest::query()
                ->where('user_id', $user->id)
                ->when($profile, fn ($query) => $query->orWhere('customer_profile_id', $profile->getKey()))
                ->latest()
                ->first();
        });
    }

    private function activeBankAccount(User $user): ?BankAccount
    {
        if (! $this->hasTable('bank_accounts')) {
            return null;
        }

        return $this->safeFirst(function () use ($user) {
            if (method_exists($user, 'bankAccounts')) {
                $account = $user->bankAccounts()
                    ->where('status', 'active')
                    ->latest()
                    ->first();

                if ($account) {
                    return $account;
                }
            }

            return BankAccount::query()
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->latest()
                ->first();
        });
    }

    private function nextAppointment(User $user, ?AccountOpeningRequest $request = null): ?Appointment
    {
        if (! $this->hasTable('appointments')) {
            return null;
        }

        return $this->safeFirst(fn () => Appointment::query()
            ->where(function ($query) use ($user, $request) {
                $query->where('customer_id', $user->id);

                if ($request) {
                    $query->orWhere('account_opening_request_id', $request->getKey());
                }
            })
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at')
            ->first());
    }

    private function latestAppointment(User $user, ?AccountOpeningRequest $request = null): ?Appointment
    {
        if (! $this->hasTable('appointments')) {
            return null;
        }

        return $this->safeFirst(fn () => Appointment::query()
            ->where(function ($query) use ($user, $request) {
                $query->where('customer_id', $user->id);

                if ($request) {
                    $query->orWhere('account_opening_request_id', $request->getKey());
                }
            })
            ->latest('scheduled_at')
            ->first());
    }

    /**
     * @return Collection<int, Document>
     */
    private function documents(User $user, ?AccountOpeningRequest $request = null): Collection
    {
        if (! $this->hasTable('documents')) {
            return collect();
        }

        try {
            if (method_exists($user, 'documents')) {
                $documents = $user->documents()->latest()->get();

                if ($documents->isNotEmpty()) {
                    return $documents;
                }
            }

            return Document::query()
                ->where(function ($query) use ($user, $request) {
                    $query->where('user_id', $user->id);

                    if ($request) {
                        $query->orWhere('account_opening_request_id', $request->getKey());
                    }
                })
                ->latest()
                ->get();
        } catch (Throwable) {
            return collect();
        }
    }

    /**
     * @param  Collection<int, Document>  $documents
     * @return array{total: int, pending: int, rejected: int, approved: int, missing: int, rejected_types: array<int, mixed>, pending_types: array<int, mixed>}
     */
    private function documentSummary(Collection $documents): array
    {
        $pending = $documents->where('status', 'pending');
        $rejected = $documents->where('status', 'rejected');
        $approved = $documents->whereIn('status', ['approved', 'accepted', 'valid']);

        return [
            'total' => $documents->count(),
            'pending' => $pending->count(),
            'rejected' => $rejected->count(),
            'approved' => $approved->count(),
            'missing' => $documents->isEmpty() ? 1 : 0,
            'rejected_types' => $rejected->pluck('document_type')->values()->all(),
            'pending_types' => $pending->pluck('document_type')->values()->all(),
        ];
    }

    private function documentsMissingMessage(array $documentTypes): string
    {
        $documents = collect($documentTypes)
            ->filter(fn ($type) => is_string($type) && $type !== '')
            ->unique()
            ->values();

        $label = $documents->isNotEmpty()
            ? $documents->implode(', ')
            : 'CIN والوثائق المطلوبة';

        return "📄 باقي خاصك تكمل بعض الوثائق: {$label}. دخل لصفحة الوثائق وكمّل الرفع.";
    }

    private function findAtm(string $message): ?Atm
    {
        if (! $this->hasTable('atms')) {
            return null;
        }

        $text = $this->normalize($message);
        $targets = [
            'hay hassani' => ['hay hassani'],
            'casa finance city' => ['casa finance city', 'casa finance', 'cfc'],
            'twin center' => ['twin center', 'twin'],
            'maarif' => ['maarif'],
        ];

        foreach ($targets as $name => $keywords) {
            if (! $this->containsAny($text, $keywords)) {
                continue;
            }

            $atm = $this->safeFirst(fn () => Atm::query()
                ->where('name', 'like', "%{$name}%")
                ->orWhere('area', 'like', "%{$name}%")
                ->orderByRaw('LOWER(name) = ? DESC', ["{$name} atm"])
                ->orderByRaw('LOWER(name) LIKE ? DESC', ["{$name}%"])
                ->orderBy('name')
                ->first());

            if ($atm) {
                return $atm;
            }
        }

        return $this->safeFirst(fn () => Atm::query()
            ->where(function ($query) use ($message) {
                $query->where('name', 'like', "%{$message}%")
                    ->orWhere('area', 'like', "%{$message}%")
                    ->orWhere('address', 'like', "%{$message}%");
            })
            ->orderBy('name')
            ->first());
    }

    private function atmLowCashThreshold(Atm $atm): float
    {
        if ($this->hasColumn('atms', 'cash_threshold')) {
            return (float) ($atm->getAttribute('cash_threshold') ?? 1000);
        }

        return 1000.0;
    }

    /**
     * @return array{message: string, intent: string, metadata: array<string, mixed>}
     */
    private function response(string $message, string $intent, array $metadata = []): array
    {
        return [
            'message' => $message,
            'intent' => $intent,
            'metadata' => $metadata,
        ];
    }

    private function containsAny(string $text, array $keywords): bool
    {
        foreach ($keywords as $keyword) {
            if (str_contains($text, $this->normalize($keyword))) {
                return true;
            }
        }

        return false;
    }

    private function isGeneralAccountEducationQuestion(string $text): bool
    {
        return $this->containsAny($text, ['lfar9', 'difference', 'différence', 'far9'])
            && $this->containsAny($text, ['compte', 'account', 'حساب'])
            && $this->containsAny($text, ['courant', 'epargne', 'épargne', 'saving', 'savings']);
    }

    private function isGeneralAccountOpeningQuestion(string $message): bool
    {
        $text = $this->normalize($message);

        return $this->containsAny($text, [
            'how can i open an account',
            'how can i open account',
            'how can i create an account',
            'how can i create account',
            'how do i open an account',
            'how do i open account',
            'how do i create an account',
            'how do i create account',
            'how to open an account',
            'how to open account',
            'how to create an account',
            'how to create account',
            'create an account',
            'create account',
            'open an account',
            'open account',
            'account opening',
            'bank account opening',
            'new account',
            'documents required to open account',
            'documents required to open an account',
            'documents to open account',
            'documents to open an account',
            'required to open account',
            'required to open an account',
            'ouvrir un compte',
            'ouvrir compte',
            'ouvrir mon compte',
            'kifach nsawb account',
            'kifach nsaweb account',
            'kifach n7el compte',
            'kifach nfte7 compte',
            'kifach nfta7 compte',
            'n7el compte',
            'nfte7 compte',
            'nfta7 compte',
            'nfta7 account',
            'فتح حساب',
            'شنو خاصني باش نفتح حساب',
            'بغيت نفتح حساب',
            'نفتح حساب',
            'نفتح compte',
            'nfta7 compte',
        ]);
    }

    private function isPersonalAccountStatusQuestion(string $message): bool
    {
        $text = $this->normalize($message);

        if ($this->containsAny($text, [
            'account dyali',
            'account diali',
            'compte dyali',
            'compte diali',
            'حسابي',
            'حساب ديالي',
            'الحساب ديالي',
            'حالة الحساب ديالي',
            'request dyali',
            'request diali',
            'طلب ديالي',
            'طلب diali',
            'dossier dyali',
            'dossier diali',
            'verification dyali',
            'verification diali',
            'vérification dyali',
            'vérification diali',
            'واش الحساب ديالي',
            'واش طلب ديالي',
        ])) {
            return true;
        }

        return $this->containsAny($text, [
            'dyali',
            'diali',
            'my',
            'mon',
            'ma',
            'ديالي',
            'حسابي',
        ])
            && $this->containsAny($text, [
                'account',
                'compte',
                'حساب',
                'request',
                'demande',
                'طلب',
                'dossier',
                'verification',
                'vérification',
            ])
            && $this->containsAny($text, [
                't9bel',
                't9bal',
                'tqbel',
                'tqbal',
                'accepted',
                'approved',
                'validé',
                'valide',
                'validated',
                'pending',
                'under_review',
                'under review',
                'status',
                'statut',
                'état',
                'etat',
                'حالة',
                'مقبول',
                'تقبل',
                'قبل',
                'قيد المراجعة',
            ]);
    }

    private function isExplicitSupportFallback(string $text): bool
    {
        return $this->containsAny($text, [
            'support ticket',
            'create ticket',
            'open ticket',
            'ticket',
            'support',
            'problem',
            'issue',
            'bug',
            'mouchkil',
            'mushkil',
            'مشكل',
        ]);
    }

    private function isGeneralAtmCashListQuestion(string $text): bool
    {
        return $this->containsAny($text, ['atm', 'guichet', 'distributeur'])
            && $this->containsAny($text, ['most cash', 'lot of money', 'a lot of money', 'cash availability', 'flos bzaf', 'flous bzaf', 'فلوس بزاف', 'فيه فلوس بزاف', 'current cash'])
            && ! $this->containsAny($text, ['maarif', 'twin', 'cfc', 'casa finance', 'hay hassani']);
    }

    private function formatMad(mixed $value): string
    {
        $amount = (float) ($value ?? 0);

        return number_format($amount, 0, '.', ' ');
    }

    private function normalize(string $value): string
    {
        return Str::of($value)
            ->lower()
            ->squish()
            ->toString();
    }

    private function statusString(mixed $value): string
    {
        return is_string($value) ? Str::lower($value) : '';
    }

    private function displayString(mixed $value): string
    {
        return is_string($value) ? $value : '';
    }

    /**
     * @template TModel of Model
     *
     * @param  callable(): TModel|null  $callback
     * @return TModel|null
     */
    private function safeFirst(callable $callback): ?Model
    {
        try {
            return $callback();
        } catch (Throwable) {
            return null;
        }
    }

    private function hasTable(string $table): bool
    {
        try {
            return Schema::hasTable($table);
        } catch (Throwable) {
            return false;
        }
    }

    private function hasColumn(string $table, string $column): bool
    {
        try {
            return Schema::hasColumn($table, $column);
        } catch (Throwable) {
            return false;
        }
    }
}

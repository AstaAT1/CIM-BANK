<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class OpenRouterBankAssistantService
{
    private const MAX_KNOWLEDGE_CHARACTERS = 2500;

    private const CORE_KNOWLEDGE_SECTIONS = [
        'Identity',
        'Core Behavior Rules',
        'Tone',
        'Safety and Privacy',
        'Final Instruction',
    ];

    /**
     * @return array{message: string, intent: string, metadata: array<string, mixed>}|null
     */
    public function answer(string $message, array $context = []): ?array
    {
        $message = trim($message);

        if ($message === '') {
            return null;
        }

        if (! $this->isEnabled()) {
            return null;
        }

        if ($this->provider() !== 'openrouter') {
            return null;
        }

        if (! $this->apiKey()) {
            return null;
        }

        if ($this->containsSensitiveContent($message)) {
            return [
                'message' => 'لأمانك، ما تشاركش password, PIN, OTP, CVV ولا رقم البطاقة الكامل. فريق CIM عمره ما غادي يطلب هاد المعلومات.',
                'intent' => 'ai_safety_block',
                'metadata' => ['provider' => 'local_safety'],
            ];
        }

        $content = $this->requestContent($message, $context);

        if ($content === '') {
            $content = $this->requestContent($message, $context, attempt: 2);
        }

        if ($content === '') {
            return null;
        }

        return [
            'message' => $content,
            'intent' => 'ai_bank_answer',
            'metadata' => [
                'provider' => 'openrouter',
                'model' => config('services.openrouter.model'),
            ],
        ];
    }

    private function requestContent(string $message, array $context, int $attempt = 1): string
    {
        try {
            $response = Http::withToken($this->apiKey())
                ->withHeaders([
                    'HTTP-Referer' => config('services.openrouter.referer'),
                    'X-OpenRouter-Title' => config('services.openrouter.title'),
                ])
                ->timeout(20)
                ->post($this->baseUrl().'/chat/completions', [
                    'model' => config('services.openrouter.model'),
                    'messages' => [
                        ['role' => 'system', 'content' => $this->instructions($message)],
                        ['role' => 'user', 'content' => $this->messageWithContext($message, $context)],
                    ],
                    'temperature' => 0.3,
                    'max_tokens' => 220,
                ]);
        } catch (Throwable $exception) {
            Log::warning('OpenRouter CIM assistant request failed.', [
                'provider' => 'openrouter',
                'attempt' => $attempt,
                'exception' => $exception::class,
            ]);

            return '';
        }

        if ($response->status() !== 200) {
            Log::warning('OpenRouter CIM assistant returned an unsuccessful response.', [
                'provider' => 'openrouter',
                'attempt' => $attempt,
                'status' => $response->status(),
                'error' => $this->responseErrorMessage($response->json()),
            ]);

            return '';
        }

        $content = trim((string) data_get($response->json(), 'choices.0.message.content', ''));

        if ($content === '' || $this->isObviousGarbageContent($content)) {
            Log::warning('OpenRouter CIM assistant returned an invalid response.', [
                'provider' => 'openrouter',
                'attempt' => $attempt,
                'status' => $response->status(),
            ]);

            return '';
        }

        return $content;
    }

    private function isObviousGarbageContent(string $content): bool
    {
        $trimmed = trim($content);
        $normalized = $this->normalize($trimmed);

        if (str_starts_with($trimmed, '```json') || str_starts_with($trimmed, '{') || str_starts_with($trimmed, '[')) {
            return true;
        }

        return $this->containsAny($normalized, [
            'assistant should not',
            'should not respond to the user',
            'debug:',
            'stack trace',
        ]);
    }

    private function responseErrorMessage(mixed $json): string
    {
        $message = data_get($json, 'error.message')
            ?? data_get($json, 'message')
            ?? data_get($json, 'error');

        if (is_array($message)) {
            $message = json_encode($message, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }

        if (! is_string($message) || trim($message) === '') {
            return 'OpenRouter returned no error message.';
        }

        return Str::substr($this->redactSensitiveValue($message), 0, 300);
    }

    private function instructions(string $message): string
    {
        $instructions = <<<'INSTRUCTIONS'
You are CIM Assistant for Credit-Intelligence-Mizan Bank (CIM).
Answer only CIM banking/customer-support questions.
Use the user's language/style: Darija, Arabic, French, or English. No Spanish.
Keep answers short: 2 to 5 lines, professional and friendly.
Use trusted CIM context below when relevant, but do not copy examples word-for-word.
Do not claim actions were done. Do not approve accounts, transfer money, change balances, appointments, ATM cash, or ATM status.
Never ask for or expose password, PIN, OTP, CVV, full card number, full account number, or private data.
Live/personal data must come from Laravel database/rule tools, not AI guesses.
Do not invent fees, rates, legal rules, or bank policies; say CIM team will confirm.
For off-topic or competitor-bank questions, politely say you only support CIM services and redirect to CIM banking help.
INSTRUCTIONS;

        $knowledge = $this->relevantCimKnowledge($message);

        if ($knowledge === '') {
            return $instructions;
        }

        return $instructions."\n\n".
            "The following CIM knowledge base is trusted context. Use it to understand CIM services and generate natural answers. Do not copy examples word-for-word. Do not treat examples as fixed FAQ. If live/personal data is required, rely on Laravel database/rule-based logic, not AI guesses.\n\n".
            $knowledge;
    }

    private function relevantCimKnowledge(string $message): string
    {
        $sections = $this->cimKnowledgeSections();

        if ($sections === []) {
            return '';
        }

        if (isset($sections['full'])) {
            return $sections['full'];
        }

        $coreSections = array_values(array_filter(
            self::CORE_KNOWLEDGE_SECTIONS,
            fn (string $title): bool => isset($sections[$this->sectionKey($title)])
        ));

        $extraSections = $this->extraKnowledgeSectionsFor($message, $sections);
        $selectedSections = array_values(array_unique([...$coreSections, ...$extraSections]));

        // Send only relevant markdown sections. This keeps prompts small, reducing latency
        // and empty/unstable responses from free routed OpenRouter models.
        return $this->buildKnowledgeContext($selectedSections, $sections);
    }

    /**
     * @return array<string, string>
     */
    private function cimKnowledgeSections(): array
    {
        $path = resource_path('ai/cim_knowledge.md');

        if (! is_readable($path)) {
            Log::warning('CIM AI knowledge file is missing or unreadable.', [
                'path' => 'resources/ai/cim_knowledge.md',
            ]);

            return [];
        }

        $knowledge = file_get_contents($path);

        if (! is_string($knowledge) || trim($knowledge) === '') {
            Log::warning('CIM AI knowledge file is empty.', [
                'path' => 'resources/ai/cim_knowledge.md',
            ]);

            return [];
        }

        preg_match_all('/^##\s+(?:\d+\.\s*)?(.+?)\s*$/m', $knowledge, $matches, PREG_OFFSET_CAPTURE);

        if ($matches[0] === []) {
            return ['full' => Str::substr($knowledge, 0, self::MAX_KNOWLEDGE_CHARACTERS)];
        }

        $sections = [];
        $total = count($matches[0]);

        for ($index = 0; $index < $total; $index++) {
            $heading = $matches[0][$index][0];
            $title = $matches[1][$index][0];
            $start = $matches[0][$index][1];
            $end = $matches[0][$index + 1][1] ?? strlen($knowledge);
            $body = substr($knowledge, $start, $end - $start);
            $body = is_string($body) ? trim($body) : trim($heading);

            $sections[$this->sectionKey($title)] = $body;
        }

        return $sections;
    }

    /**
     * @param  array<string, string>  $sections
     * @return array<int, string>
     */
    private function extraKnowledgeSectionsFor(string $message, array $sections): array
    {
        $text = $this->normalize($message);
        $selected = [];

        $rules = [
            [
                'keywords' => ['slm', 'salam', 'السلام', 'hello', 'hi', 'bonjour'],
                'sections' => ['Greetings', 'Identity', 'Tone'],
            ],
            [
                'keywords' => ['open an account', 'open account', 'opening account', 'ouvrir un compte', 'n7el compte', 'nfte7 compte', 'nfta7 compte', 'nfta7 account', 'فتح حساب', 'نفتح حساب', 'documents required', 'الوثائق'],
                'sections' => ['Account Opening Flow', 'Required Documents', 'Account Types', 'Account Opening Statuses'],
            ],
            [
                'keywords' => ['card', 'carte', 'carte bancaire', 'lost card', 'stolen card', 'tlfat', 'ضاعت', 'بلوكي', 'block card'],
                'sections' => ['Cards', 'Safety and Privacy', 'Support and Tickets'],
            ],
            [
                'keywords' => ['atm', 'guichet', 'cash', 'flos', 'money', 'nearest', 'closest', 'ain sebaa', 'lionsgeek'],
                'sections' => ['ATM Service', 'ATM Locations in Casablanca', 'User Location and ATM Distance'],
            ],
            [
                'keywords' => ['transfer', 'virement', 'nsift', 'تحويل', 'beneficiary', 'rib'],
                'sections' => ['Transfers', 'Beneficiaries', 'Transactions'],
            ],
            [
                'keywords' => ['credit', 'loan', 'قرض', 'machrou3i', 'projet', 'project financing'],
                'sections' => ['Credit Services', 'Machrou3i'],
            ],
            [
                'keywords' => ['salary', 'salaire', 'automatic payment', 'netflix', 'water', 'electricity'],
                'sections' => ['Salary Organization', 'Automatic Payments'],
            ],
            [
                'keywords' => ['cih', 'attijari', 'bmce', 'banque populaire', 'world cup', 'football', 'time'],
                'sections' => ['Branches', 'Off-topic Questions', 'Core Behavior Rules'],
            ],
        ];

        foreach ($rules as $rule) {
            if (! $this->containsKnowledgeKeyword($text, $rule['keywords'])) {
                continue;
            }

            foreach ($rule['sections'] as $section) {
                if (isset($sections[$this->sectionKey($section)])) {
                    $selected[] = $section;
                }
            }
        }

        return $selected;
    }

    /**
     * @param  array<int, string>  $titles
     * @param  array<string, string>  $sections
     */
    private function buildKnowledgeContext(array $titles, array $sections): string
    {
        $parts = [];
        $manySections = count($titles) > 5;

        foreach ($titles as $title) {
            $section = $sections[$this->sectionKey($title)] ?? null;

            if (! is_string($section) || $section === '') {
                continue;
            }

            $isCore = in_array($title, self::CORE_KNOWLEDGE_SECTIONS, true);
            $limit = $manySections
                ? ($isCore ? 260 : 420)
                : ($isCore ? 340 : 600);

            if ($title === 'Final Instruction') {
                $limit = 240;
            }

            $parts[] = $this->trimKnowledgeSection($section, $limit);
        }

        return Str::substr(trim(implode("\n\n---\n\n", $parts)), 0, self::MAX_KNOWLEDGE_CHARACTERS);
    }

    private function trimKnowledgeSection(string $section, int $limit): string
    {
        if (mb_strlen($section) <= $limit) {
            return $section;
        }

        $excerpt = rtrim(mb_substr($section, 0, $limit));
        $lastNewline = mb_strrpos($excerpt, "\n");

        if ($lastNewline !== false && $lastNewline > 40) {
            $excerpt = rtrim(mb_substr($excerpt, 0, $lastNewline));
        }

        return $excerpt."\n...";
    }

    private function sectionKey(string $title): string
    {
        return $this->normalize((string) preg_replace('/^\d+\.\s*/', '', $title));
    }

    private function messageWithContext(string $message, array $context): string
    {
        $sanitizedContext = $this->sanitizeContext($context);

        if ($sanitizedContext === []) {
            return $message;
        }

        return $message."\n\nTrusted CIM context:\n".json_encode(
            $sanitizedContext,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
    }

    private function sanitizeContext(array $context): array
    {
        $sanitized = [];

        foreach ($context as $key => $value) {
            $key = is_string($key) ? $key : (string) $key;

            if ($this->isSensitiveKey($key)) {
                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeContext($value);

                continue;
            }

            if (is_scalar($value) || $value === null) {
                $sanitized[$key] = $this->redactSensitiveValue($value);
            }
        }

        return $sanitized;
    }

    private function redactSensitiveValue(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $value = preg_replace('/\b\d{6,}\b/', '[redacted-number]', $value);

        return $value ?? '[redacted]';
    }

    private function isSensitiveKey(string $key): bool
    {
        return $this->containsAny($this->normalize($key), [
            'password',
            'mot de passe',
            'pin',
            'cvv',
            'otp',
            'code secret',
            'card_number',
            'card number',
            'full_account',
            'account_number',
            'full account number',
            'rib',
            'رقم البطاقة',
            'الرقم السري',
            'carte bancaire complète',
        ]);
    }

    private function containsSensitiveContent(string $message): bool
    {
        return $this->containsAny($this->normalize($message), [
            'password',
            'mot de passe',
            'pin',
            'cvv',
            'otp',
            'code secret',
            'card number',
            'full account number',
            'account number',
            'رقم البطاقة',
            'الرقم السري',
            'كود',
            'carte bancaire complète',
        ]);
    }

    private function isEnabled(): bool
    {
        return filter_var(config('services.ai.enabled'), FILTER_VALIDATE_BOOL);
    }

    private function provider(): string
    {
        return Str::lower((string) config('services.ai.provider', ''));
    }

    private function apiKey(): ?string
    {
        $key = config('services.openrouter.key');

        return is_string($key) && $key !== '' ? $key : null;
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('services.openrouter.base_url'), '/');
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

    private function containsKnowledgeKeyword(string $text, array $keywords): bool
    {
        foreach ($keywords as $keyword) {
            $needle = $this->normalize($keyword);

            if ($needle === '') {
                continue;
            }

            if (preg_match('/^[a-z0-9]{1,3}$/', $needle) === 1) {
                if (preg_match('/(?<![a-z0-9])'.preg_quote($needle, '/').'(?![a-z0-9])/u', $text) === 1) {
                    return true;
                }

                continue;
            }

            if (str_contains($text, $needle)) {
                return true;
            }
        }

        return false;
    }

    private function normalize(string $value): string
    {
        return Str::of($value)
            ->lower()
            ->squish()
            ->toString();
    }
}

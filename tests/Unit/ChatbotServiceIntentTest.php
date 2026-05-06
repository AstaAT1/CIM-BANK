<?php

namespace Tests\Unit;

use App\Models\User;
use App\Services\ChatbotService;
use App\Services\OpenRouterBankAssistantService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class ChatbotServiceIntentTest extends TestCase
{
    #[DataProvider('generalAccountOpeningMessages')]
    public function test_general_account_opening_messages_use_ai_path(string $message): void
    {
        $this->assertSame('ai_eligible', $this->detectIntent($message));
    }

    #[DataProvider('generalAccountOpeningMessages')]
    public function test_general_account_opening_replies_never_use_account_status(string $message): void
    {
        $reply = $this->service()->reply(new User(['name' => 'Test User']), $message);

        $this->assertSame('ai_bank_answer', $reply['intent']);
        $this->assertNotSame('account_status', $reply['intent']);
    }

    #[DataProvider('personalAccountStatusMessages')]
    public function test_personal_account_status_messages_use_account_status(string $message): void
    {
        $this->assertSame('account_status', $this->detectIntent($message));
    }

    public function test_specific_atm_question_uses_atm_status(): void
    {
        $this->assertSame('atm_status', $this->detectIntent('Wach ATM Maarif fiha flos?'));
    }

    public function test_general_atm_cash_question_uses_atm_list_status(): void
    {
        $this->assertSame('atm_list_status', $this->detectIntent('Which ATMs currently have a lot of money in them?'));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function generalAccountOpeningMessages(): array
    {
        return [
            'english create account verbose' => ['can you tell me how can i create an account in CIM bank'],
            'english create account short' => ['how can i create account in CIM bank'],
            'darija account' => ['kifach nsawb account fi CIM bank'],
            'darija arabic' => ['شنو خاصني باش نفتح حساب ف CIM?'],
        ];
    }

    /**
     * @return array<string, array{string}>
     */
    public static function personalAccountStatusMessages(): array
    {
        return [
            'accepted darija' => ['wach account diali t9bel?'],
            'status darija' => ['status dyal account dyali'],
        ];
    }

    private function detectIntent(string $message): string
    {
        $method = new ReflectionMethod(ChatbotService::class, 'detectIntent');
        $method->setAccessible(true);

        return $method->invoke($this->service(), $message);
    }

    private function service(): ChatbotService
    {
        return new ChatbotService(new class extends OpenRouterBankAssistantService
        {
            public function answer(string $message, array $context = []): ?array
            {
                return [
                    'message' => 'AI answer',
                    'intent' => 'ai_bank_answer',
                    'metadata' => [],
                ];
            }
        });
    }
}

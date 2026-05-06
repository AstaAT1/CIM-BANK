<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\SupportTicket;
use App\Models\User;
use App\Services\ChatbotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class ChatbotController extends Controller
{
    public function message(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $message = $validated['message'];

        $this->storeChatMessage($user, [
            'sender' => 'user',
            'message' => $message,
            'intent' => null,
            'metadata' => [],
        ]);

        try {
            $reply = app(ChatbotService::class)->reply($user, $message);
        } catch (Throwable $exception) {
            Log::error('CIM chatbot reply failed.', [
                'user_id' => $user->id,
                'exception' => $exception,
            ]);

            $reply = [
                'message' => 'وقع مشكل صغير فـ CIM Assistant. عاود جرب أو تواصل مع الدعم.',
                'intent' => 'fallback_support',
                'metadata' => [
                    'support_ticket_can_be_created' => true,
                    'service_error' => true,
                ],
            ];
        }

        $this->storeChatMessage($user, [
            'sender' => 'bot',
            'message' => $reply['message'],
            'intent' => $reply['intent'],
            'metadata' => $reply['metadata'] ?? [],
        ]);

        if (($reply['intent'] ?? null) === 'fallback_support') {
            $this->createSupportTicket($user, $message);
        }

        return response()->json([
            'reply' => $reply['message'],
            'intent' => $reply['intent'],
            'metadata' => $reply['metadata'] ?? [],
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $messages = ChatMessage::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit(30)
            ->get()
            ->reverse()
            ->values()
            ->map(fn (ChatMessage $message): array => [
                'sender' => $message->sender,
                'message' => $message->message,
                'intent' => $message->intent,
                'metadata' => $message->metadata ?? [],
                'created_at' => $message->created_at?->toISOString(),
            ]);

        return response()->json([
            'messages' => $messages,
        ]);
    }

    /**
     * @param  array{sender: string, message: string, intent: string|null, metadata: array<string, mixed>}  $data
     */
    private function storeChatMessage(User $user, array $data): void
    {
        try {
            if (method_exists($user, 'chatMessages')) {
                $user->chatMessages()->create($data);

                return;
            }

            ChatMessage::create([
                ...$data,
                'user_id' => $user->id,
            ]);
        } catch (Throwable $exception) {
            Log::warning('CIM chatbot message could not be stored.', [
                'user_id' => $user->id,
                'sender' => $data['sender'],
                'exception' => $exception,
            ]);
        }
    }

    private function createSupportTicket(User $user, string $message): void
    {
        $data = [
            'subject' => 'Chatbot support request',
            'message' => $message,
            'status' => 'open',
            'priority' => 'normal',
            'source' => 'chatbot',
        ];

        try {
            if (method_exists($user, 'supportTickets')) {
                $user->supportTickets()->create($data);

                return;
            }

            SupportTicket::create([
                ...$data,
                'user_id' => $user->id,
            ]);
        } catch (Throwable $exception) {
            Log::warning('CIM chatbot support ticket could not be created.', [
                'user_id' => $user->id,
                'exception' => $exception,
            ]);
        }
    }
}

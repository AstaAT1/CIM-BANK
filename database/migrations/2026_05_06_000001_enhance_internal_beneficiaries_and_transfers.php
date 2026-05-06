<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('beneficiaries', function (Blueprint $table) {
            if (! Schema::hasColumn('beneficiaries', 'account_number')) {
                $table->string('account_number')->nullable()->index();
            }

            if (! Schema::hasColumn('beneficiaries', 'linked_bank_account_id')) {
                $table->foreignId('linked_bank_account_id')
                    ->nullable()
                    ->constrained('bank_accounts')
                    ->nullOnDelete();
            }

            $table->unique(['user_id', 'rib'], 'beneficiaries_user_rib_unique');
            $table->unique(['user_id', 'account_number'], 'beneficiaries_user_account_number_unique');
        });

        Schema::table('transfer_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('transfer_requests', 'sender_user_id')) {
                $table->foreignId('sender_user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('transfer_requests', 'receiver_user_id')) {
                $table->foreignId('receiver_user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('transfer_requests', 'sender_bank_account_id')) {
                $table->foreignId('sender_bank_account_id')
                    ->nullable()
                    ->constrained('bank_accounts')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('transfer_requests', 'receiver_bank_account_id')) {
                $table->foreignId('receiver_bank_account_id')
                    ->nullable()
                    ->constrained('bank_accounts')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('transfer_requests', 'currency')) {
                $table->string('currency', 3)->default('MAD')->index();
            }

            if (! Schema::hasColumn('transfer_requests', 'note')) {
                $table->text('note')->nullable();
            }

            $table->index(['sender_user_id', 'status'], 'transfer_requests_sender_status_index');
            $table->index(['receiver_user_id', 'status'], 'transfer_requests_receiver_status_index');
            $table->index(['receiver_bank_account_id', 'status'], 'transfer_requests_receiver_account_status_index');
        });
    }

    public function down(): void
    {
        Schema::table('transfer_requests', function (Blueprint $table) {
            $table->dropIndex('transfer_requests_sender_status_index');
            $table->dropIndex('transfer_requests_receiver_status_index');
            $table->dropIndex('transfer_requests_receiver_account_status_index');

            $table->dropConstrainedForeignId('receiver_bank_account_id');
            $table->dropConstrainedForeignId('sender_bank_account_id');
            $table->dropConstrainedForeignId('receiver_user_id');
            $table->dropConstrainedForeignId('sender_user_id');
            $table->dropColumn(['currency', 'note']);
        });

        Schema::table('beneficiaries', function (Blueprint $table) {
            $table->dropUnique('beneficiaries_user_rib_unique');
            $table->dropUnique('beneficiaries_user_account_number_unique');
            $table->dropConstrainedForeignId('linked_bank_account_id');
            $table->dropColumn('account_number');
        });
    }
};

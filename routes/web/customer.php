<?php

use App\Http\Controllers\Customer\AtmMapController;
use App\Http\Controllers\Customer\BeneficiaryController;
use App\Http\Controllers\Customer\BillController;
use App\Http\Controllers\Customer\ChatbotController;
use App\Http\Controllers\Customer\ExchangeRateController;
use App\Http\Controllers\Customer\TransferController;
use Illuminate\Support\Facades\Route;

/*
 |--------------------------------------------------------------------------
 | Customer Preview Routes (Frontend Team)
 |--------------------------------------------------------------------------
 | These are UI/navigation routes for verified customers.
 | Business logic lives in routes/backend/customer.php.
 */
Route::middleware(['auth', 'verified', 'role.customer', 'verified.customer'])
    ->group(function () {
        Route::get('/customer/atm-map', [AtmMapController::class, 'index'])
            ->name('customer.atm-map');

        Route::get('/customer/exchange-rates', [ExchangeRateController::class, 'index'])
            ->name('customer.exchange-rates');

        Route::get('/customer/beneficiaries', [BeneficiaryController::class, 'index'])
            ->name('customer.beneficiaries');

        Route::get('/customer/transfers', [TransferController::class, 'index'])
            ->name('customer.transfers');

        Route::get('/customer/bills', [BillController::class, 'index'])
            ->name('customer.bills');

        Route::post('/customer/chatbot/message', [ChatbotController::class, 'message'])
            ->name('customer.chatbot.message');

        Route::get('/customer/chatbot/history', [ChatbotController::class, 'history'])
            ->name('customer.chatbot.history');
    });

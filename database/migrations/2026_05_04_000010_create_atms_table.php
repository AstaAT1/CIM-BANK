<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('atms', function (Blueprint $table) {
            $table->id();

            $table->string('code')->unique();          // e.g. CIM-AIN-001
            $table->string('name');                    // Human-readable name
            $table->string('city')->default('Casablanca');
            $table->string('area');                    // Ain Sebaa, Maarif, etc.
            $table->string('address');

            $table->decimal('latitude', 10, 7);        // GPS coordinates
            $table->decimal('longitude', 10, 7);

            $table->decimal('current_cash', 12, 2)->default(0);   // Current cash inside
            $table->decimal('max_capacity', 12, 2)->default(200000); // Max the ATM can hold

            // active | low_cash | empty | out_of_service
            $table->string('status')->default('active')->index();

            $table->boolean('is_active')->default(true)->index();
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('atms');
    }
};

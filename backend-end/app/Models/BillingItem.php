<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillingItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'billing_id',
        'description',
        'type',
        'amount',
        'quantity',
        'total'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function billing()
    {
        return $this->belongsTo(Billing::class);
    }
}

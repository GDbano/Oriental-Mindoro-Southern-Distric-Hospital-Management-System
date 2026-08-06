<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_id',
        'generic_name',
        'brand_name',
        'default_dosage',
        'default_form',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function inventory()
    {
        return $this->belongsTo(Inventory::class, 'inventory_id');
    }
}

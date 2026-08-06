<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventory';

    protected $fillable = [
        'name',
        'description',
        'category',
        'quantity',
        'min_stock',
        'price',
        'expiry_date',
        'supplier',
        'is_active'
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function scopeLowStock($query)
    {
        return $query->where('quantity', '<=', \DB::raw('min_stock'))
            ->where('is_active', true);
    }

    public function scopeExpired($query)
    {
        return $query->where('expiry_date', '<', now())
            ->where('is_active', true);
    }

    public function scopeExpiringSoon($query, $days = 30)
    {
        return $query->whereBetween('expiry_date', [now(), now()->addDays($days)])
            ->where('is_active', true);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getStockStatusAttribute()
    {
        if ($this->quantity <= 0) {
            return 'out_of_stock';
        } elseif ($this->quantity <= $this->min_stock) {
            return 'low_stock';
        } else {
            return 'in_stock';
        }
    }

    public function getStockStatusColorAttribute()
    {
        return match ($this->stock_status) {
            'out_of_stock' => 'red',
            'low_stock' => 'yellow',
            'in_stock' => 'green',
        };
    }

    public function isLowStock()
    {
        return $this->quantity <= $this->min_stock;
    }

    public function isExpired()
    {
        return $this->expiry_date && \Carbon\Carbon::parse($this->expiry_date)->isPast();
    }
}
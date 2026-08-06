<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QueueCounter extends Model
{
    use HasFactory;

    protected $fillable = [
        'queue_date',
        'department_id',
        'prefix',
        'last_sequence',
    ];

    protected $casts = [
        'queue_date' => 'date',
        'last_sequence' => 'integer',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}

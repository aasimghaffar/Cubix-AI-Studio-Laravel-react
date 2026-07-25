<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'group'];

    /** Keys whose values are stored encrypted at rest. */
    public const SECRET_PATTERNS = ['_api_key', '_secret', '_token', '_client_id'];

    public static function isSecret(string $key): bool
    {
        foreach (self::SECRET_PATTERNS as $pattern) {
            if (str_contains($key, $pattern)) {
                return true;
            }
        }
        return false;
    }

    /** Get a setting value (decrypting secrets), with a per-key cache. */
    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::remember("setting.$key", 300, function () use ($key, $default) {
            $row = static::where('key', $key)->first();
            if (! $row || $row->value === null) {
                return $default;
            }
            if (self::isSecret($key)) {
                try {
                    return Crypt::decryptString($row->value);
                } catch (\Throwable) {
                    return $default;
                }
            }
            return $row->value;
        });
    }

    /** Create or update a setting (encrypting secrets). */
    public static function put(string $key, mixed $value, string $group = 'general'): void
    {
        $stored = self::isSecret($key) && $value !== null && $value !== ''
            ? Crypt::encryptString($value)
            : $value;

        static::updateOrCreate(['key' => $key], ['value' => $stored, 'group' => $group]);
        Cache::forget("setting.$key");
    }
}

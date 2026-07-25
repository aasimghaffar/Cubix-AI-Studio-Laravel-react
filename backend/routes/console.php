<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('subscriptions:send-expiry-reminders')->dailyAt('09:00');

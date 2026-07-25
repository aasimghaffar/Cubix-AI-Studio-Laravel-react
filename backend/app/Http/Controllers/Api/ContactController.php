<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    /** POST /api/contact — public contact form. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'    => 'required|string|max:100',
            'email'   => 'required|email|max:150',
            'subject' => 'nullable|string|max:150',
            'message' => 'required|string|max:5000',
        ]);

        ContactMessage::create($data);

        return response()->json(['message' => "Thanks! We'll get back to you soon."], 201);
    }

    /** GET /api/admin/messages */
    public function index()
    {
        return ContactMessage::latest()->paginate(20);
    }

    /** POST /api/admin/messages/{message}/read */
    public function toggleRead(ContactMessage $message)
    {
        $message->update(['is_read' => ! $message->is_read]);

        return $message;
    }

    /** DELETE /api/admin/messages/{message} */
    public function destroy(ContactMessage $message)
    {
        $message->delete();

        return response()->json(['message' => 'Message deleted.']);
    }
}

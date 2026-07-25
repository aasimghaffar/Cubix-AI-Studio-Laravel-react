# Cubix AI Studio — Complete Setup Guide (Windows + XAMPP)

This guide takes you from a blank Windows PC to a fully running site with demo data.
No Laravel or React experience is needed — just follow each step in order.
Time needed: about 20–30 minutes.

The product has two parts:
- **backend/** — the API (Laravel / PHP). Runs on `http://127.0.0.1:8000`
- **frontend/** — the website (React). Runs on `http://localhost:5173`

---

## STEP 1 — Install the required software

Install these three things (all free):

1. **XAMPP** with PHP 8.2 or newer — https://www.apachefriends.org
   During install, keep **MySQL** selected. Apache is optional (we use PHP's own server).
2. **Composer** (PHP package manager) — https://getcomposer.org/download
   Run `Composer-Setup.exe`. When it asks for the PHP path, point it to your XAMPP PHP,
   e.g. `C:\xampp\php\php.exe`.
3. **Node.js LTS** (JavaScript runtime) — https://nodejs.org (choose the LTS version).

Verify everything. Open **Command Prompt** (press Win+R, type `cmd`, Enter) and run:

```
php -v        → should print PHP 8.2.x or 8.3.x
composer -V   → should print Composer version 2.x
node -v       → should print v18, v20 or v22
npm -v        → should print a version number
```

If `php` is not recognized: add `C:\xampp\php` to your Windows PATH
(Start → "Edit the system environment variables" → Environment Variables →
select `Path` → Edit → New → `C:\xampp\php` → OK), then open a NEW Command Prompt.

### Enable the required PHP extensions

Open `C:\xampp\php\php.ini` in Notepad and make sure these lines exist **without a
semicolon (;) in front**:

```
extension=curl
extension=fileinfo
extension=gd
extension=mbstring
extension=openssl
extension=pdo_mysql
extension=zip
```

Most are already enabled in XAMPP. If you edited the file, save it.

While you're in `php.ini`, also raise these (needed for document uploads):

```
upload_max_filesize = 20M
post_max_size = 25M
max_execution_time = 300
```

---

## STEP 2 — Create the database

1. Open the **XAMPP Control Panel** and press **Start** next to **MySQL**.
2. In your browser open http://localhost/phpmyadmin
3. Click **New** (left sidebar).
4. Database name: `cubix_ai` — Collation: `utf8mb4_unicode_ci` — click **Create**.

That's all — the tables are created automatically later.

---

## STEP 3 — Set up the backend (API)

### 3.1 Create a fresh Laravel project

In Command Prompt:

```
cd C:\
composer create-project laravel/laravel cubix-api "^12.0"
cd C:\cubix-api
php artisan install:api
```

When `install:api` asks *"Would you like to run the pending database migrations?"*
answer **no** (we run them later, after copying our files).

### 3.2 Copy the product files into it

From the product download, open the `backend` folder. Copy these four folders
**into `C:\cubix-api`, replacing everything when Windows asks**:

```
app        →  C:\cubix-api\app
bootstrap  →  C:\cubix-api\bootstrap
database   →  C:\cubix-api\database
routes     →  C:\cubix-api\routes
```

### 3.3 (Optional but recommended) document-reading libraries

These let the AI Document Assistant read PDF and Word files
(plain .txt works without them):

```
composer require smalot/pdfparser phpoffice/phpword
```

### 3.4 Configure the environment

Open `C:\cubix-api\.env` in Notepad and set these lines
(edit the existing ones — don't duplicate):

```
APP_NAME="Cubix AI Studio"
APP_URL=http://127.0.0.1:8000

FRONTEND_URL=http://localhost:5173

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cubix_ai
DB_USERNAME=root
DB_PASSWORD=
```

(XAMPP's MySQL user is `root` with an empty password by default.)

Emails: by default they are written to the log file (safe for testing). To send real
emails later, fill the `MAIL_*` lines with your SMTP details — any provider works.

### 3.5 Install the database + demo content

Still inside `C:\cubix-api`:

```
php artisan storage:link
php artisan demo:install
```

Type `yes` when asked. This creates every table and fills the site with professional
demo content: 9 tools, plans, pages, menu, categories, testimonials, 3 demo customers
with activity — and (with internet) machine-translates every language. When it
finishes it prints a table of all logins.

### 3.6 Start the API

```
php artisan serve
```

Leave this window open. The API is now running at http://127.0.0.1:8000
(you can verify: http://127.0.0.1:8000/up should say the app is OK).

---

## STEP 4 — Set up the frontend (the website)

Open a **second** Command Prompt window. Copy the product's `frontend` folder
anywhere you like (for example `C:\cubix-frontend`) using File Explorer, then:

```
cd C:\cubix-frontend
npm install
npm run dev
```

When it says `Local: http://localhost:5173/`, open that address in your browser.

**Your site is live.** 🎉

---

## STEP 5 — Sign in and look around

| Account        | Email               | Password  |
|----------------|---------------------|-----------|
| Admin          | admin@example.com   | password  |
| Demo customer  | maya@example.com    | password  |
| Demo customer  | liam@example.com    | password  |
| Demo customer  | fatima@example.com  | password  |

- Browse the site as a guest first, then sign in as **maya** to see the customer
  side with an active plan, then as **admin** and open the **Admin panel** from the
  account menu (top-right).
- **Change the admin password immediately** for any real use:
  Account → Password tab.

---

## STEP 6 — The one required key (text tools)

The **image generator works free out of the box** (Pollinations, no key).
The six text tools need one AI key — two providers give keys for **free**:

- **Google Gemini** — https://aistudio.google.com → "Get API key" (free)
- **Groq** — https://console.groq.com → API Keys (free, very fast)
- Or paid: OpenAI, Anthropic Claude, DeepSeek, Mistral

Then: **Admin → AI Settings → API Keys** → paste the key → press **Test** right next
to it (it tests what you typed — no need to save first) → **Save settings** →
**Admin → AI Settings → AI Engines** → set the text tools to that engine → Save.

Each tool can use a different engine. If an engine ever fails mid-generation, the
system automatically retries on every other configured engine before showing any
error to the customer.

---

## STEP 7 — Payments (when you're ready to sell)

**Stripe (cards):**
1. Create an account at https://dashboard.stripe.com — enable **Test mode**.
2. Developers → API keys → copy the *Secret key* (sk_test_…).
3. Admin → Settings → Payments → paste into the Test secret key → **Test** → Save.
4. Buy a plan with test card `4242 4242 4242 4242`, any future date, any CVC.
   You'll return to the Tools page with a success popup and live credits.
   **No Stripe Price IDs are needed** — prices come from your packages automatically.
5. Going live: switch "Payment mode" to Live and paste your live key.

**PayPal:**
1. https://developer.paypal.com → Apps & Credentials → Create App (Sandbox first).
2. Copy the Client ID and Secret → Admin → Settings → Payments → enable PayPal →
   paste both → **Test** → Save. Plans/products are created automatically in PayPal.
3. With both gateways on, customers get a "How would you like to pay?" chooser.

**Webhook (recommended for live sites):** in Stripe → Developers → Webhooks, add
endpoint `https://YOUR-DOMAIN/api/billing/webhook/stripe` with events
`checkout.session.completed`, `invoice.payment_succeeded`,
`customer.subscription.deleted`, and paste the signing secret into
Admin → Settings → Payments. (On localhost this isn't needed — activation happens
on return.)

---

## STEP 8 — Optional features

**Google sign-in:** https://console.cloud.google.com → create OAuth Client ID
(Web application) → Authorized redirect URI:
`http://127.0.0.1:8000/api/auth/google/callback` → paste Client ID + Secret in
Admin → Settings → Sign-in options and enable the toggle.

**Languages:** Admin → Languages — enable/disable languages, one-click
**Auto-translate** per language, download the full text template, edit any string,
or add your own language. Everything (pages, plans, categories, testimonials, UI)
is translatable; missing strings fall back to English.

**Branding:** Admin → Settings — site name, logo, colors, dark/light theme colors,
currency, business info shown on the Contact page, email sender address,
notification toggles.

**Fresh restart anytime:** Admin → Dashboard → **Import demo data**
(asks for your password, wipes everything, reinstalls the showroom)
— or `php artisan demo:install` in the terminal.

---

## Moving to live hosting (summary)

1. Any Laravel-capable host (PHP 8.2+, MySQL). Upload the backend, point the domain
   at `/public`, set `.env` (APP_URL=https://api.yourdomain.com,
   FRONTEND_URL=https://yourdomain.com, real DB + SMTP), run
   `composer install`, `php artisan migrate --seed`, `php artisan storage:link`.
2. Frontend: run `npm run build` locally → upload the `dist` folder to your web root.
   Set the API URL: create `frontend/.env` with
   `VITE_API_URL=https://api.yourdomain.com/api` before building
   (defaults to the Vite proxy in development).
3. Add a cron entry for scheduled jobs (plan-expiry reminder emails):
   `* * * * * php /path-to-app/artisan schedule:run >> /dev/null 2>&1`
4. Switch Stripe/PayPal to live keys and add the Stripe webhook (Step 7).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `php` / `composer` / `npm` not recognized | Re-open Command Prompt after installing; check PATH (Step 1). |
| "Could not find driver" during install | Enable `extension=pdo_mysql` in php.ini, restart the `php artisan serve` window. |
| Access denied for user 'root' | MySQL not started in XAMPP, or you set a root password — put it in `.env` `DB_PASSWORD`. |
| Site loads but looks broken / old | Hard refresh: Ctrl+Shift+R. |
| Images generate but don't display | You skipped `php artisan storage:link`. |
| "Maximum execution time" errors | Raise `max_execution_time = 300` in php.ini (Step 1) and restart the API window. |
| Uploads fail in Document Assistant | Raise `upload_max_filesize` / `post_max_size` in php.ini (Step 1). |
| Port 8000 or 5173 already in use | `php artisan serve --port=8001` (and change the proxy target in `vite.config.js`), or `npm run dev -- --port 5174`. |
| Emails don't arrive | By default they go to `storage/logs/laravel.log`. Configure `MAIL_*` in `.env` for real sending. |
| Stuck on anything | Check `storage/logs/laravel.log` — every real error is written there with details. |

Enjoy building with Cubix AI Studio!

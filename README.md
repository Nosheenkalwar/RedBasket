# RedBasket – FYP-I (midterm build)

Online supermarket with a customer store and a staff admin panel.

| Part | Tech |
|---|---|
| `frontend/` | React 18 + TypeScript (Vite), Tailwind CSS, React Router |
| `backend/` | Node.js + NestJS + TypeScript, TypeORM, JWT, bcrypt, class-validator |
| Database | PostgreSQL |

## What is in this build

**Customer**
- Sign up and log in with phone number + OTP, with reCAPTCHA
- View and update profile, add / edit / delete delivery addresses, pick a default
- Browse by category and sub-category, live search box, filters (sub-category, price, brand, in stock) and sorting
- Product details page
- Cart: add, change quantity, remove (a guest cart is kept in the browser and merged after login)
- Wishlist: add and remove
- Checkout: saved or new address, delivery slot, cash on delivery or test card, order confirmation, My orders with tracking and cancel
- Shipping rules (Karachi only): area zone fee, free over Rs. 3,000, heavy order surcharge, courier by weight (`backend/src/shipping/shipping.rules.ts`)
- Terms of Use, Privacy Policy and Shipping pages

**Staff (email + password, account locks for 15 min after 5 wrong tries)**
- Super Admin: create, edit, block / unblock staff, give roles, reset passwords, activity log. Can also open every other page.
- Sub Admin: add, edit, hide, delete categories, sub-categories and products (with photo upload)
- Inventory Staff: stock-in and update stock levels, stock history
- Sales Staff (and Sub Admin): see and handle orders, Placed → Confirmed → Packed → Out for delivery → Delivered, or cancel before packing

New staff get a temporary password and must change it on their first login.

---

## 1. Install these once

1. **Node.js 20 or newer** – https://nodejs.org (check with `node -v`)
2. **PostgreSQL 14 or newer** – https://www.postgresql.org/download/ (remember the password you give the `postgres` user)
3. **VS Code** (optional) and **Postman** (optional, for testing the API)

## 2. Create the database

Open **SQL Shell (psql)** or **pgAdmin → Query Tool** and run:

```sql
CREATE USER redbasket WITH PASSWORD 'redbasket';
CREATE DATABASE redbasket OWNER redbasket;
```

(You can use other names, just change `DATABASE_URL` in the next step.)

## 3. Start the backend

Open a terminal in the project folder:

```bash
cd backend
npm install
```

Both `backend/.env` and `frontend/.env` are already in this zip with your keys. If one is missing, copy the example:

```bash
# Windows (Command Prompt)
copy .env.example .env
# macOS / Linux / Git Bash
cp .env.example .env
```

Open `backend/.env` and check `DATABASE_URL`. Change `JWT_SECRET` to any long random text.

Create the tables and load the sample data (categories, 49 products, staff accounts):

```bash
npm run seed
```

Start the API:

```bash
npm run start:dev
```

You should see `RedBasket API running on http://localhost:3000/api`. Keep this terminal open.

## 4. Start the frontend

Open a **second** terminal:

```bash
cd frontend
npm install
# Windows: copy .env.example .env      macOS/Linux: cp .env.example .env
npm run dev
```

Open **http://localhost:5173** in the browser.

## 5. Try it

**Customer:** click *Hello, sign in → Register*. Fill in the form, tick reCAPTCHA and press *Send OTP*. The 6-digit code arrives by SMS from the gateway phone (see *Setting up SMS Gateway for Android*).

**Staff portal:** http://localhost:5173/admin (also linked in the footer)

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@redbasket.pk | RedBasket@123 |
| Sub Admin | subadmin@redbasket.pk | RedBasket@123 |
| Inventory Staff | inventory@redbasket.pk | RedBasket@123 |
| Sales Staff | sales@redbasket.pk | RedBasket@123 |

---

## Notes

- **reCAPTCHA and SMS:** see the two setup sections below. Both are real services, so the customer sign up / sign in needs internet. Staff log in with email and password only.
- **Tables:** with `DB_SYNC=true` TypeORM creates and updates tables from the entity files in `backend/src/entities`. Turn it off and switch to migrations before deployment.
- **Product photos** are saved in `backend/uploads` (JPG, PNG or WebP, max 2 MB). Products without a photo show an icon for their sub-category.
- `npm run seed` can be run again safely; it skips anything that already exists.

## Setting up Google reCAPTCHA

The `.env` files in this zip already contain your keys. If you ever need new ones:

1. Open https://www.google.com/recaptcha/admin/create and sign in with your Google account.
2. **Label:** RedBasket. **reCAPTCHA type:** Challenge (v2) → "I'm not a robot" Checkbox.
3. **Domains:** add `localhost`. Later add your real domain too (for example `redbasket.pk`).
4. Accept the terms and press **Submit**.
5. Copy the **Site key** into `frontend/.env`:
   ```
   VITE_RECAPTCHA_SITE_KEY=your-site-key
   ```
6. Copy the **Secret key** into `backend/.env`:
   ```
   RECAPTCHA_SECRET=your-secret-key
   ```
7. Restart both terminals (`npm run start:dev` and `npm run dev`). Vite only reads `.env` when it starts.

The site key is public and goes to the browser. The secret key must stay only in `backend/.env`.

## Setting up SMS Gateway for Android (OTP by SMS, free)

RedBasket sends OTPs through **SMSGate** (https://sms-gate.app). It is free and open source and needs no CNIC or sender approval. An Android phone with the app sends each code as a normal SMS from its own SIM, so the only cost is your SIM's SMS (most Jazz, Zong, Telenor and Ufone bundles include SMS).

1. Take any Android phone (Android 5 or newer) with a SIM that has SMS balance or an SMS bundle.
2. Install the app: download the latest `app-release.apk` from https://github.com/capcom6/android-sms-gateway/releases (or the link on https://sms-gate.app). Allow "install unknown apps" for your browser when Android asks.
3. Open the app and allow **SMS** and **notifications** permissions. On Android 15 and newer, if sending fails, open *Settings → Apps → SMS Gateway → ⋮ → Allow restricted settings* and give the SMS permission again.
4. On the app's home screen turn **Cloud Server** on, then tap **Online**. The app shows a **username** and **password**.
5. Put them in `backend/.env`:
   ```
   SMSGATE_USERNAME=the-username-from-the-app
   SMSGATE_PASSWORD=the-password-from-the-app
   ```
6. Restart the backend (`npm run start:dev`).
7. Sign up from the store with a real number. The backend terminal prints `OTP queued for +92...` and the phone sends the SMS within a few seconds. You can see each message and its status in the app.

Keep in mind:
- The gateway phone must be **switched on, online and running the app**. Turn off battery optimisation for SMS Gateway (*Settings → Apps → SMS Gateway → Battery → Unrestricted*) so Android does not stop it.
- Customers see your SIM's number as the sender, not "RedBasket". Paid providers charge for a branded sender name.
- Do not use it for bulk messages; mobile networks can block a personal SIM that sends too many SMS. OTPs for testing and the demo are fine.

## Folder guide

```
backend/src
  entities/      database tables (staff, customers, categories, products, inventory, cart, wishlist, ...)
  common/        auth guard + @CustomerOnly() / @StaffOnly(role) decorators, error format, reCAPTCHA, helpers
  auth/          customer OTP sign up / login, staff login, change password
  orders/        checkout, customer orders, staff order handling
  shipping/      Karachi shipping rules, delivery areas and slots
  account/       customer profile and addresses
  catalog/       public categories, product list, search suggestions, product details
  shop/          cart and wishlist
  admin/         staff, activity log, categories, products, inventory, dashboard numbers
  database/      connection settings and seed script

frontend/src
  lib/           api wrapper, validation rules, form hook, formatting
  context/       logged-in customer, cart + wishlist, staff session, toasts
  components/    header, search box, product cards, cart drawer, sign in / sign up modal, form fields
  pages/         store pages (home, listing, product, wishlist, account)
  admin/         admin layout, login and the admin pages
```

## Common problems

| Problem | Fix |
|---|---|
| `password authentication failed for user "redbasket"` | The user or password in `DATABASE_URL` does not match step 2. |
| `database "redbasket" does not exist` | Run the SQL in step 2. |
| Frontend says "Cannot reach the server" | The backend terminal is not running, or it stopped with an error. |
| Port 3000 or 5173 already in use | Close the other program, or change `PORT` in `backend/.env` and the proxy in `frontend/vite.config.ts`. |
| reCAPTCHA box does not appear | Check your internet and that `VITE_RECAPTCHA_SITE_KEY` is set in `frontend/.env`, then restart `npm run dev`. |
| "We could not send the SMS right now" | Look at the backend terminal. `401` = wrong SMSGate username or password; no status = the backend has no internet. |
| "SMS is not set up on the server" | `SMSGATE_USERNAME` or `SMSGATE_PASSWORD` is empty in `backend/.env`. |
| OTP is queued but no SMS arrives | The gateway phone is offline, the app is closed, or the SIM has no SMS balance. Open the app and check the message status. |
| reCAPTCHA says "Invalid domain for site key" | Add `localhost` (and later your real domain) to the key's domains in the reCAPTCHA admin console. |
| Old address cannot be used at checkout | Edit it and choose the area from the list (addresses must be in Karachi). |

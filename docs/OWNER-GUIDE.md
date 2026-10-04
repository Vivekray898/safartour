# Owner Guide (Phase 1 setup)

Plain-language setup steps. No coding knowledge needed.

---

## Part 1 — Create the Supabase project (you must do this)

The old database is gone, so we are making a new one.

### Step 1. Create the project

1. Go to <https://supabase.com/dashboard> and sign in.
2. Click **New project**.
3. Fill in:
   - **Organization**: your account (or a new one)
   - **Name**: `safartour`
   - **Database password**: click **Generate a password** and copy it somewhere safe (a password manager). You will need it once. **Do not email it to anyone.**
   - **Region**: choose **Mumbai (ap-south-1)**. This matters — your customers are in India, and the old project was in Singapore which made the site slower.
   - **Plan**: Free
4. Click **Create new project**. Wait ~2 minutes.

### Step 2. Get the three values

1. Go to **Project Settings → API**.
2. Copy these three values into a password manager or a text file:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **Publishable key** — starts with `sb_publishable_`
   - **Secret key** — starts with `sb_secret_`. Click **Reveal** to see it.
3. Paste them here so I can finish the wiring.

### Step 3: Turn OFF public sign-ups

1. Go to **Authentication → Sign In / Providers**.
2. Turn **off** "Email" for new sign-ups (or keep Email on but disable self-registration).
   This stops anyone creating an account on their own. You create accounts
   deliberately with the script in Part 3.

### Step 4: Turn ON asymmetric signing keys

1. Go to **Authentication → Sign In / Providers → JWT Settings**.
2. Enable **Asymmetric signing keys** (sometimes called "Use asymmetric signing keys").
   Without this, the app has to phone Supabase on every request to verify a
   session, which is slower. Tell me if you cannot find this setting.

---

## Part 2: Point the app at the new project

You must paste these into **Vercel → Project → Settings → Environment Variables**
and redeploy. I cannot do this part for you.

| Variable | Where it goes | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel, both Production and Preview | the `https://….supabase.co` URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel, both | `sb_publishable_…` — safe in the browser |
| `SUPABASE_SECRET_KEY` | Vercel, **Production only** | `sb_secret_…` — **server only**, never add the `NEXT_PUBLIC_` prefix |

Also put the same three in your local `.env.local`.

Leave `DATABASE_URL` alone for now — it is only used by offline scripts.

After adding them, redeploy. The site should look exactly as before.

---

## Part 3: Create your login

Once you tell me the project is created and the migrations are applied, run:

```bash
node --env-file=.env.local scripts/create-first-admin.mjs \
  you@yourdomain.com 'a-long-password-at-least-12-chars' 'Your Name'
```

Then sign in at `/crm/login`.

For each staff member, run the same command with their email. They start as
`staff`; change a person's role to `admin` in the Supabase table editor
(`profiles` table, `role` column) only if they need full access.

**The old `admin123` accounts are gone and will not come back.** That was
deliberate — the password was published in the repository.

---

## Part 4: Bring in your old enquiries

1. Open your Google Sheet of enquiries.
2. **File → Download → Comma-separated values (.csv)**.
3. Put the file somewhere handy, e.g. `leads.csv` in the project folder.

Preview first (this changes nothing):

```bash
node --env-file=.env.local scripts/import-sheets-leads.mjs leads.csv --dry-run
```

It tells you how many rows are usable, how many were skipped, and how many are
repeat enquiries from people you already have. Then import for real by
dropping `--dry-run`.

It is safe to run twice — it matches people by phone number, so nobody is
created twice.

---

## Part 5: Every day

### To log in

Go to `/crm/login` and use your email and password.

### If you forget your password

There is no self-service reset yet. Run `create-first-admin.mjs` again with the
same email — it resets the password. (Self-service "forgot password" is on the
list for Phase 2.)

### To add a staff member

Run `create-first-admin.mjs` with their email. Give it a long password and send
it to them privately.

### To import more old enquiries

Repeat Part 4 with the new CSV.

---

## What is not ready yet

Phase 1 builds the secure foundation. The CRM screens still use the old login
until Phase 2 finishes, and these are **not working yet**:

- uploading customer documents (the Supabase bucket exists, but no screen uses it)
- seeing old CRM trips and customers that were not in the Google Sheet
- forgetting/resetting your password

New enquiries from the website still go to the Google Sheet. They start landing
in the CRM in **Phase 2**.
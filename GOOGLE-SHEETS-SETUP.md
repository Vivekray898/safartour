# Google Sheets Setup — Safar Tours Leads

This connects every website form to **one Google Spreadsheet** with **one tab per form type**. Takes about 10 minutes, no coding.

## How leads flow

```
Visitor fills form
        ↓
Next.js API route (/api/leads)   ← validates + rate-limits
        ↓
Google Apps Script (this script) ← writes a row
        ↓
Google Spreadsheet (Tours / Cars / Contact tabs)
```

If anything fails, the website offers the visitor a **WhatsApp fallback with their enquiry pre-filled** — so a lead is never lost, even if Sheets is down.

---

## Setup (12 steps)

### 1. Create the spreadsheet

Go to [sheets.new](https://sheets.new) and create a blank spreadsheet.
Name it something like **Safar Tours — Website Leads**.

### 2. (Optional) Rename the tabs

The script creates tabs automatically. If you want to pre-create them, name them exactly:

- `Tours` — tour package enquiries
- `Cars` — car rental & transfer enquiries
- `Contact` — contact page messages

> You don't need to add headers — the script does it on the first row of each tab.

### 3. Open Apps Script

In the spreadsheet: **Extensions → Apps Script**.

### 4. Paste the script

Delete any code in the editor. Copy the full contents of
[`google-apps-script/Code.gs`](./google-apps-script/Code.gs) from this repo and paste it in.

### 5. Save

Click the 💾 save icon (Ctrl/Cmd+S).

### 6. Deploy as Web App

Click **Deploy → New deployment**.

### 7. Choose "Web app"

Click the ⚙️ gear → **Web app**.

### 8. Set the access options

- **Description:** anything, e.g. `Website lead capture`
- **Execute as:** **Me** (your account)
- **Who has access:** **Anyone** ← important. This is what lets the website's server reach it. (The URL is a long unguessable random string; the script only writes rows, it can't read your spreadsheet back.)

### 9. Deploy & authorize

Click **Deploy**. Google asks you to authorize the script — click through
**Review permissions → choose your account → Advanced → Go to … (unsafe) → Allow**.
This is normal for your own script; it's asking for permission to edit *this* spreadsheet only.

### 10. Copy the Web App URL

You'll see a URL like:

```
https://script.google.com/macros/s/AKfycb.../exec
```

Copy it.

### 11. Add it to `.env.local`

In the project root, create or edit `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_SHEETS_ENDPOINT=https://script.google.com/macros/s/AKfycb.../exec
```

Then **restart the dev server** (`pnpm dev`) or redeploy. The variable is inlined at build time for the client.

### 12. Test

1. Open the website, fill a form, submit.
2. Check the spreadsheet — a row should appear in the matching tab (`Tours` for the general/enquiry forms, `Cars` for vehicle & route pages, `Contact` from the contact page).
3. **Test the fallback:** temporarily break the endpoint (e.g. delete a character from the URL in `.env.local`, restart, submit) — the form should show an amber box with a **"Send my enquiry on WhatsApp"** button that opens WhatsApp with all submitted details pre-filled.
4. Restore the URL when done.

---

## Updating the script later

If you change `Code.gs`: **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.
The URL stays the same.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| No row appears, no error on site | Check `.env.local` has the URL and the dev server was restarted. |
| `ok:false` in server logs | Re-check "Who has access: Anyone" in the deployment settings. |
| Rows appear in wrong tab | `formType` mismatches — compare the button's `formType` prop to `TABS` in Code.gs. |
| Script errors on save | Make sure the whole file was pasted, nothing truncated. |

## Environment variables reference

See [.env.example](./.env.example) for the full annotated list, including the optional Resend email fallback (`RESEND_API_KEY`, `ENQUIRY_TO_EMAIL`) which runs automatically when the Sheets write fails.

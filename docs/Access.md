# Cloudflare Access Setup Guide

This document explains how to secure **CDN Admin** using Cloudflare Zero Trust (Access).

If you want your dashboard to be publicly visible and accessible without cloudflare access, you can leave `AUTH_STATUS=dev` in worker configs and remove all cloudflare access.

Please note that cloudflare access will NOT work if you dont have a custom URL.

---

## When Should You Use Access?

Use Cloudflare Access if:

* You want a **private admin panel**
* You’re managing sensitive buckets
* You want SSO / email‑based authentication

Skip Access if:

* Your bucket is fully public
* You’re only browsing public assets

---

## Step 1 — Open Zero Trust

Login to Cloudflare:

👉 [https://one.dash.cloudflare.com](https://one.dash.cloudflare.com)

Navigate to:

* **Access Control**

---

## Step 2 — Create Application

Click **Add an application** → **Self‑hosted**

Configure:

* **Application name**: CDN Admin

Click on **Add public hostname**

* **Domain**: `admin.yourdomain.com`
* **Path (optional)**: `admin`

This ensures:

* Public browsing works
* `admin` is protected

---

## Step 3 — Add Policy

Create a policy such as:

* Allow → Emails ending in `@yourdomain.com`
* Or Allow → Specific email addresses

Example:

| Setting | Value                                       |
| ------- | ------------------------------------------- |
| Action  | Allow                                       |
| Include | Emails:[you@domain.com](mailto:you@domain.com) |

---

## Step 4 — Worker Configuration

Set this variable in your Worker:

```env
AUTH_STATUS=prod
```

In development:

```env
AUTH_STATUS=dev
```

This bypasses auth locally while enforcing it in production.

---

## Runtime Behavior

* Requests to `/admin/*` require Access JWT
* Public paths remain accessible
* Invalid / missing JWT returns `401 Unauthorized`

---

## Testing

1. Open the admin UI in an incognito window
2. Visit `/admin`
3. You should be redirected to Cloudflare login

---

## Notes

* Access headers are validated server‑side
* No client‑side secrets are stored
* Works with Google, GitHub, Azure AD, email OTP, etc.

---

Secure by design ✨

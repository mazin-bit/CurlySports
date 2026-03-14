# Curly Sports – Auth email templates

Use these in **Supabase Dashboard** so signup and auth emails match your brand.

## How to apply

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **Email Templates**.
3. Select the template (e.g. **Confirm signup**).
4. **Subject** (optional): e.g. `Confirm your Curly Sports account`.
5. **Message body**: Open the corresponding `.html` file in this folder, copy **all** of its content, and paste it into the template editor. Save.

Templates use Supabase variables such as `{{ .ConfirmationURL }}` and `{{ .Email }}`; leave these as-is.

## Files

- **confirm-signup.html** – Styled “Confirm your email” message with Curly Sports branding and a clear button/link.

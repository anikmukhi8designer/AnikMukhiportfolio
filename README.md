# Portfolio & CMS - Deployment Guide

This project is now configured as a **Vite + React** application with a **Supabase** backend.

## 1. Database Setup (Supabase)

If you haven't done this yet:
1.  Open your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Go to the **SQL Editor**.
3.  Run the contents of `supabase_schema.sql` to create your tables.

## 2. Connect Your App (Environment Variables)

To connect this code to your Supabase project, you must set up your API keys.

1.  Create a new file in the root directory named `.env`.
2.  Add the following lines to it (replace with your actual keys from Supabase Settings -> API):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> **Note:** Do not commit `.env` to GitHub if you want to keep your keys private (though the Anon key is technically public).

## 3. Verify & Seed Data

1.  Run the app locally: `npm run dev`.
2.  Open your browser to `http://localhost:5173`.
3.  Navigate to the Admin Panel by adding `#admin` to the URL:
    *   `http://localhost:5173/#admin`
4.  Login with the default fallback credentials (or your Supabase Auth user if you created one):
    *   **Email:** `admin@newgenre.studio`
    *   **Password:** `password`
5.  **Automatic Seeding:** The first time the app connects to your empty database, it will automatically upload the demo data (Projects, Experience, etc.) so you have something to start with.

## 4. Deploy to Vercel

1.  Push your code to GitHub.
2.  Import project into Vercel.
3.  **Important:** In Vercel Project Settings -> **Environment Variables**, add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values you used locally.
4.  Deploy.

## Troubleshooting

*   **Images not uploading?** Check your Supabase Storage policies. The SQL script should have enabled "Public" access, but you can double-check in Supabase -> Storage -> `portfolio` bucket -> Configuration.
*   **Login fails?** Ensure you copied the `VITE_SUPABASE_ANON_KEY` correctly and that it has no extra spaces.

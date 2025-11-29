# Portfolio & CMS - Deployment Guide

This project is now configured as a **Vite + React** application. This makes it production-ready and compatible with Vercel's automated build systems.

## How to Deploy to Vercel (Recommended)

1.  **Download Code**: Download all the files from this project to your local computer.
2.  **Push to GitHub**:
    *   Initialize a git repository (`git init`).
    *   Commit your files.
    *   Push to a new GitHub repository.
3.  **Connect to Vercel**:
    *   Go to [Vercel.com](https://vercel.com) and log in.
    *   Click **"Add New Project"**.
    *   Import your GitHub repository.
4.  **Deploy**:
    *   Vercel will automatically detect `vite.config.ts` and `package.json`.
    *   It will set the **Framework Preset** to `Vite`.
    *   Click **Deploy**.

## CMS Access

Once deployed, your live URL will be something like `https://your-project.vercel.app`.

*   **Access CMS**: Click the "CMS" link in the footer or login via the dashboard.
*   **Credentials**:
    *   Email: `admin@newgenre.studio`
    *   Password: `password`

## Data Persistence Warning

This CMS uses **LocalStorage** (browser memory). 
*   **Important**: Edits made in the CMS are saved **only on your specific browser/device**. 
*   If you want to update the public site permanently for all visitors, you must manually update the `data.ts` file in your code with your changes and redeploy to Vercel.

## Local Development

If you want to run this locally:

1.  Install Node.js.
2.  Run `npm install`.
3.  Run `npm run dev`.
4.  Open `http://localhost:5173`.

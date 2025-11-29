# Portfolio & CMS - Deployment Guide

This project is a React-based portfolio with a built-in CMS dashboard. To share this with a client, you need to deploy it to a public URL.

## Option 1: The Easiest Way (Vercel)

Vercel is free and works excellently with React projects.

1.  **Create a GitHub Repository**:
    *   Go to [GitHub.com](https://github.com) and create a new repository (e.g., `my-portfolio`).
    *   Upload all the files from this project to that repository.

2.  **Deploy to Vercel**:
    *   Go to [Vercel.com](https://vercel.com) and sign up/login.
    *   Click **"Add New..."** > **"Project"**.
    *   Select your GitHub repository (`my-portfolio`).
    *   **Important**: If asked for "Framework Preset", select **Vite** or **Create React App** depending on your local setup. If you are just uploading these files directly without a `package.json` build step, you might need to configure Vercel to serve it as a static site, but typically React apps require a build step.
    
    *If you are running this in a cloud IDE (like StackBlitz/Project IDX)*:
    *   Look for a "Share" or "Deploy" button in your editor's interface.

## Option 2: Netlify Drop (No GitHub required)

If you just want a quick link without setting up GitHub right now:

1.  **Build your project** (if you are in a local environment with `npm run build`).
2.  If you don't have a build folder, this method might not work for `.tsx` files directly as they need to be compiled.

## How to use the CMS

Once deployed:
1.  Go to your public URL (e.g., `https://your-project.vercel.app`).
2.  Add `/#admin` to the end of the URL (e.g., `https://your-project.vercel.app/#admin`).
3.  **Login**:
    *   Email: `admin@newgenre.studio`
    *   Password: `password`

## Note on Persistence

The CMS uses `localStorage` to save your data.
*   **Pros**: It works instantly on any device without a database.
*   **Cons**: Changes you make in the Admin panel are saved **only on that specific browser/device**. If you send the link to a client, they will see the **default** data initially, not your edits, unless you manually update the `data.ts` file in the code with your changes before deploying.

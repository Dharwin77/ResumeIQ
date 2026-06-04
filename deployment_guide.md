# Deployment Guide: ResumeIQ

This guide provides step-by-step instructions to deploy the ResumeIQ application to **Render** (recommended for persistent servers) or **Vercel** (for serverless environments).

---

## Option 1: Deploy on Render (Recommended)

Render is highly recommended because it runs a persistent Express server which is a perfect fit for this full-stack application.

### Step-by-Step Instructions:

1. **Log in to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/) and sign in (you can use your GitHub account).

2. **Create a New Web Service**:
   - Click the **New +** button in the top-right corner.
   - Select **Web Service**.

3. **Connect Your GitHub Repository**:
   - Locate and connect your repository: `Dharwin77/ResumeIQ`.
   - *(If it doesn't show up, make sure Render has permission to access your GitHub repositories under your account settings).*

4. **Configure the Service Settings**:
   - **Name**: `resume-iq` (or any name you prefer)
   - **Region**: Select the region closest to you or your audience.
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

5. **Configure Environment Variables**:
   - Click on the **Advanced** button.
   - Add the following environment variable:
     - **Key**: `GROQ_API_KEY`
     - **Value**: `your_groq_api_key_here` (starts with `gsk_...`)
   - *Note: Since the app also supports custom API keys via the browser settings UI, adding the environment variable is optional.*

6. **Deploy**:
   - Select the **Free** instance type.
   - Click **Create Web Service**.
   - Render will build the frontend using Vite and run the Express backend. Once the build completes, a live URL will be displayed in your dashboard.

---

## Option 2: Deploy on Vercel (Serverless)

We have added a `vercel.json` configuration at the root of the project to allow deploying it as a Serverless Function.

### Step-by-Step Instructions:

1. **Log in to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/) and sign in with GitHub.

2. **Import Your Project**:
   - Click the **Add New...** dropdown and select **Project**.
   - Find your `ResumeIQ` repository and click **Import**.

3. **Configure the Project**:
   - Vercel will automatically read the `vercel.json` file and set up the builds and routes.
   - You do **not** need to change the Build and Development settings because they are handled by the configuration.

4. **Add Environment Variables**:
   - Expand the **Environment Variables** section.
   - Add:
     - **Key**: `GROQ_API_KEY`
     - **Value**: `your_groq_api_key_here` (starts with `gsk_...`)

5. **Deploy**:
   - Click the **Deploy** button.
   - Vercel will deploy the static Vite frontend and treat `server.js` as a serverless backend under `/api`.

---

## Local Verification (Optional)

To check the production configuration locally:
1. Build the project:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```
3. Open `http://localhost:5000` in your browser.

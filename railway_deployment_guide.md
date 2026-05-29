# 🚀 Live Deployment Guide: Lead Finder PRO on Railway

This guide walks you through deploying your **Lead Finder PRO** full-stack application (React frontend + Node.js/Express backend) on **Railway**. 

Because your project is set up as a **monorepo** (with `client/` and `server/` in separate folders), we will deploy them as **two separate services** within a single Railway project. This is the cleanest, most performant way to manage a full-stack JavaScript application.

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Step 1: Deploy the Backend API (`server/`)](#step-1-deploy-the-backend-api-server)
3. [Step 2: Deploy the Frontend Client (`client/`)](#step-2-deploy-the-frontend-client-client)
4. [Step 3: Verification & Health Check](#step-3-verification--health-check)
5. [💡 Production Best Practices](#-production-best-practices)

---

## 1. Prerequisites
- [x] Your latest code has been pushed and is fully up-to-date on GitHub: [cosenhub07/Leand-finder](https://github.com/cosenhub07/Leand-finder).
- [ ] A [Railway.app](https://railway.app/) account (connected to your GitHub account).

---

## Step 1: Deploy the Backend API (`server/`)

We will deploy the Express server first so that we have its live URL ready to feed into the React frontend.

### 1. Create a New Railway Project
1. Log into your [Railway Dashboard](https://railway.app/dashboard).
2. Click the **+ New Project** button in the top right.
3. Select **Deploy from GitHub repo**.
4. Choose your **`Leand-finder`** repository from the list. (If it doesn't appear, make sure you've granted Railway permission to access your repository).
5. Click **Deploy Now**. This will initiate an initial deployment. We will configure it immediately.

### 2. Configure the Service to target `/server`
By default, Railway might try to deploy the root of the project. We need to tell it to look inside the `server/` directory:
1. Click on the newly created card in your canvas (it will be named `Leand-finder`).
2. Go to the **Settings** tab of the service.
3. Scroll down to the **General** section.
4. Set the **Service Name** to `lead-finder-api` (so it's easy to identify).
5. Scroll to the **Root Directory** setting and set it to:
   ```text
   server
   ```
6. Railway will automatically detect the `/server/package.json` and prepare a Node.js build.

### 3. Add Environment Variables
Your Express backend relies on environment variables for security. You **MUST** add these in the Railway UI (do not commit them to GitHub!).
1. Switch to the **Variables** tab of the `lead-finder-api` service.
2. Click **New Variable** (or click **Raw Editor** in the top right to paste all at once).
3. Add the following variables:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3001` | The internal port the server listens on |
| `SUPABASE_URL` | `https://eonkelmkqhteqcjklgve.supabase.co` | Your Supabase database endpoint |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1...` *(Paste your full key)* | Your public Supabase anon key |
| `BREVO_API_KEY` | `xkeysib-1d8a19058...` *(Paste your full key)* | Your Brevo transactional email key |
| `SERPER_API_KEY` | `a6a31fa21a719a964...` *(Paste your full key)* | Your Serper.dev search key |
| `GOOGLE_API_KEY` | `AIzaSyDLmEWddPoa-...` *(Paste your full key)* | Your Google Places API key |

> [!WARNING]
> Keep these keys confidential. Railway encrypts all variables securely in production.

### 4. Generate a Live Public URL
We need a public URL so the React frontend can contact this API:
1. Go back to the **Settings** tab of the `lead-finder-api` service.
2. Scroll to the **Networking** section.
3. Under **Public Networking**, click **Generate Domain**.
4. Railway will generate a unique domain for you, looking something like:
   `https://lead-finder-api-production.up.railway.app`
5. **Copy this URL!** You will need it in the next step.

---

## Step 2: Deploy the Frontend Client (`client/`)

Now that our live backend API is up and running, let's deploy our high-performance React application.

### 1. Create a Second Service in your Railway Project
1. In your Railway project workspace dashboard, click the **+ New** button in the top right.
2. Select **GitHub Repo**.
3. Choose the **`Leand-finder`** repository again.
4. Click **Deploy Now**. This will create a second, separate service card.

### 2. Configure the Service to target `/client`
1. Click on this new service card.
2. Go to the **Settings** tab.
3. Scroll down to the **General** section.
4. Set the **Service Name** to `lead-finder-client`.
5. Scroll to the **Root Directory** setting and set it to:
   ```text
   client
   ```
6. Scroll down to the **Build** section:
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`
   - **Publish Directory** (or output directory): `dist` (Nixpacks will detect this automatically, but keeping it in mind is good!).

### 3. Link Frontend to the Backend using Environment Variables
We set up your React client to read the API address dynamically using the environment. Let's feed in your live backend address:
1. Switch to the **Variables** tab of the `lead-finder-client` service.
2. Click **New Variable**.
3. Add the following variable:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://lead-finder-api-production.up.railway.app` | **Your backend public URL** (No trailing slash!) |

> [!NOTE]
> Vite embeds these variables during the build process. Adding this variable triggers a rebuild automatically so the React build is injected with the correct backend URL.

### 4. Generate the Frontend Public URL
1. Go to the **Settings** tab of the `lead-finder-client` service.
2. Scroll to the **Networking** section.
3. Under **Public Networking**, click **Generate Domain**.
4. Railway will create a domain like:
   `https://leadfinder-production.up.railway.app`
5. **Click the link!** Your fully live dashboard and landing page are now active.

---

## Step 3: Verification & Health Check

Let's verify everything works flawlessly in production:

### 1. API Health Check
Open your browser and navigate to:
`https://<your-backend-domain>.up.railway.app/health`

You should receive a successful JSON response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-29T11:54:10.000Z"
}
```

### 2. OTP Authentication
- Go to your live React app URL.
- Enter your email in the Login / Sign Up portal.
- Verify that Brevo sends the login OTP and that you are able to sign in successfully.

### 3. Live Leads Search
- Run a search (e.g. *"Restaurants in Mumbai"* or *"Software Agencies in New York"*).
- Verify that it pulls active Google Places results, scrapes emails, scores leads, and logs search history correctly in Supabase.

---

## 💡 Production Best Practices

1. **GitHub Auto-Deployments**: Whenever you push changes to your `main` branch on GitHub in the future, Railway will automatically detect the changes, pull the code, rebuild, and hot-reload both your frontend and backend seamlessly!
2. **Brevo Sender Validation**: Ensure your Brevo transactional email sender is a custom domain instead of `@gmail.com` to prevent emails from bouncing or ending up in the spam folders of your users.
3. **Database Performance**: Since Supabase is fully cloud-hosted already, both your local environment and Railway production will point to the same database. This keeps your local development and production database records perfectly synchronized.

🎉 **Congratulations! Your Lead Finder PRO application is now live and fully operational on the web!** Let me know if you run into any questions during the setup.

# Connect this project to GitHub

**Status:** Git is installed, repo is initialized, and the first commit is done. You only need to create the repo on GitHub and push.

## 1. Sign in to GitHub in your browser

1. Open **[https://github.com](https://github.com)** in your browser.
2. Click **Sign in** (top right).
3. Sign in with your GitHub account (username/password or SSO).
4. Confirm it’s the correct account (check the profile/avatar in the top right).

---

## 2. Create a new repository (after you’ve signed in)

1. On GitHub, click the **+** in the top right → **New repository**.
2. Fill in:
   - **Repository name:** e.g. `DocYard` or `HFUF` (whatever you prefer).
   - **Description:** optional, e.g. `Property accounting – trial balance & balance sheet to Yardi JE`.
   - **Public** or **Private** – your choice.
   - **Do not** check “Add a README” or “Add .gitignore” (this folder already has content).
3. Click **Create repository**.

---

## 3. Connect and push (one-time)

GitHub will show **“Quick setup”** with a repo URL like  
`https://github.com/YOUR_USERNAME/REPO_NAME.git`

**In PowerShell or Git Bash** (from this folder):

```powershell
cd "c:\Users\AustinDuffy\Desktop\Work\AP\HFUF"

# Add your new repo as remote (paste YOUR URL from GitHub):
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push (you may be prompted to sign in to GitHub in the browser):
git push -u origin main
```

Or run the script (it will ask for the URL once):  
`.\push-to-github.ps1`

**Option B – Using GitHub Desktop:**

1. Install [GitHub Desktop](https://desktop.github.com/) if you don’t have it.
2. **File → Add local repository** → choose `c:\Users\AustinDuffy\Desktop\Work\AP\HFUF`.
3. If it says “not a Git repository”, use **Create a repository** and set the path to this folder.
4. **Publish repository** and pick the repo you created in step 2 (or create one from the app).

**Option C – Using Cursor/VS Code:**

1. Open the **Source Control** view (Ctrl+Shift+G).
2. Click **Initialize Repository** if asked.
3. Stage all, commit, then use **Publish to GitHub** and pick or create the repo (sign in through the browser when prompted).

---

## 4. Confirm it’s the right repo

After pushing:

- Open **https://github.com/YOUR_USERNAME/REPO_NAME** in your browser.
- Check that the files (e.g. `client/`, `server/`, `package.json`, etc.) match this project.

Once you’ve signed in at [github.com](https://github.com) and created the new repo, use the URL from the “Quick setup” section in step 3 and replace `YOUR_USERNAME/REPO_NAME` in the commands or in GitHub Desktop/Cursor with your actual repo.

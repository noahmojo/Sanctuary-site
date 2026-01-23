# Sierra Alpaca Sanctuary

Simple CMS for managing your animal sanctuary website.

## Deploy to Railway

1. Push this code to a GitHub repo
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Railway auto-detects Node.js and deploys

## Connect Your Domain (Spaceship)

1. In Railway, go to your project → Settings → Domains
2. Add a custom domain (e.g., `yourdomain.com`)
3. Railway gives you a CNAME target
4. In Spaceship DNS settings, add:
   - Type: CNAME
   - Name: @ (or www)
   - Target: [Railway's target]

## Usage

- **Public site**: `yourdomain.com`
- **Admin CMS**: `yourdomain.com/admin`

## Features

- Add/edit/delete animals
- Upload multiple photos per animal
- Birthday field with auto age calculation
- Featured animals on homepage
- Filter/sort animals by breed and age
- Site settings (name, tagline, about, donate URL)

## Local Development

```bash
npm install
npm start
```

Visit `http://localhost:3000`

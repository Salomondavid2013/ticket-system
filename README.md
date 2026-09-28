# 🎫 TicketShow — Système de vente de billets de spectacle

Application complète de billetterie en ligne.

## Fonctionnalités

- Liste des spectacles + page détail
- Plan de salle interactif (sélection de places)
- Réservation temporaire anti-surbooking
- Paiement Stripe Checkout
- Webhook → places vendues + génération billets PDF/QR
- Dashboard admin + statistiques
- Authentification Google (NextAuth)

## Stack

- Next.js 15 (App Router) + TypeScript
- PostgreSQL + Prisma
- NextAuth.js
- Stripe
- Tailwind CSS
- pdf-lib + qrcode

---

## Installation locale (5 minutes)

```bash
cd ticket-system
npm install
cp .env.example .env
```

Édite le fichier `.env` (au minimum DATABASE_URL et NEXTAUTH_SECRET).

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts   # données de test
npm run dev
```

Ouvre → http://localhost:3000

---

## Variables d'environnement

Crée un fichier `.env` à partir de `.env.example` :

```
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="colle-ici-une-chaine-aleatoire-longue"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_URL="http://localhost:3000"
```

Génère un secret : `openssl rand -base64 32`

---

## Mise en ligne (production)

### 1. Base de données gratuite → Neon

1. Va sur https://neon.tech et crée un compte
2. Crée un projet
3. Copie la connection string → mets-la dans `DATABASE_URL`

### 2. Stripe

1. Compte sur https://stripe.com
2. Developers → API keys → copie les clés **test**
3. Une fois le site en ligne, crée un Webhook :
   - Endpoint URL : `https://ton-domaine.vercel.app/api/stripe/webhook`
   - Événement : `checkout.session.completed`
   - Copie le **Signing secret**

### 3. Google OAuth (pour se connecter)

1. https://console.cloud.google.com → APIs & Services → Credentials
2. Crée un OAuth 2.0 Client ID (type Web)
3. Authorized redirect URIs :
   - `http://localhost:3000/api/auth/callback/google`
   - `https://ton-domaine.vercel.app/api/auth/callback/google`

### 4. Déploiement sur Vercel (le plus simple)

**Option A – Interface :**
1. Pousse le code sur GitHub
2. Va sur https://vercel.com → New Project → importe le repo
3. Ajoute **toutes** les variables d’environnement
4. Clique sur Deploy

**Option B – CLI :**
```bash
npm i -g vercel
vercel
```

Après le premier déploiement, applique le schéma de base de données :
```bash
npx prisma db push
```

(ou configure un script de build qui le fait)

---

## Structure du projet

```
ticket-system/
├── prisma/
│   ├── schema.prisma      # Modèle de données complet
│   └── seed.ts            # Données de démo
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Liste des spectacles
│   │   ├── events/[id]/            # Détail + plan de salle
│   │   ├── success/                 # Page après paiement
│   │   ├── admin/                   # Dashboard
│   │   └── api/
│   │       ├── auth/                # NextAuth
│   │       ├── seats/               # Réservation
│   │       └── stripe/              # Checkout + Webhook
│   ├── components/
│   │   └── SeatMap.tsx              # Plan de salle interactif
│   └── lib/
│       ├── prisma.ts
│       ├── stripe.ts
│       ├── auth.ts
│       ├── tickets.ts               # Génération PDF + QR
│       └── utils.ts
└── .env.example
```

---

## Flux d’achat

1. L’utilisateur choisit un spectacle
2. Sélectionne des places sur le plan de salle
3. Clique sur « Continuer vers le paiement »
4. Les places passent en RESERVED + commande créée
5. Redirection vers Stripe Checkout
6. Paiement réussi → Webhook Stripe
7. Places → SOLD + billets générés (code unique + PDF)
8. Page de succès affichée

---

## Améliorations recommandées en production

- Upload d’images d’événements (Vercel Blob ou Cloudinary)
- Envoi d’email automatique avec le PDF (Resend)
- Job pour libérer les places RESERVED après 15 minutes
- Middleware pour protéger `/admin` (rôle ADMIN)
- CRUD complet des événements dans l’admin
- Page de scan QR code pour le contrôle à l’entrée

---

Bon lancement ! 🚀

Si tu as besoin d’aide pour une partie précise (email, admin CRUD, etc.), dis-le.

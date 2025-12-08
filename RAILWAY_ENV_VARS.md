# Variables d'environnement pour Railway

## Configuration requise sur Railway

Lorsque vous déployez sur Railway, vous devez configurer les variables d'environnement suivantes dans le dashboard Railway.

### 1. Base de données PostgreSQL

Si vous ajoutez un service PostgreSQL sur Railway, la variable `DATABASE_URL` sera automatiquement injectée. Sinon, configurez-la manuellement :

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

### 2. Variables d'environnement à configurer

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | Environnement d'exécution | `production` |

### 3. Variables optionnelles

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | URL publique de l'application | `https://votre-app.railway.app` |
| `NEXTAUTH_SECRET` | Secret pour NextAuth (si utilisé) | `votre-secret-genere` |
| `NEXTAUTH_URL` | URL pour NextAuth | `https://votre-app.railway.app` |

## Instructions de déploiement Railway

### Étape 1 : Créer un nouveau projet sur Railway
1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur "New Project"
3. Sélectionnez "Deploy from GitHub repo"
4. Choisissez le dépôt `Intern.Nukleo`

### Étape 2 : Ajouter PostgreSQL
1. Dans votre projet Railway, cliquez sur "New"
2. Sélectionnez "Database" → "PostgreSQL"
3. Railway injectera automatiquement `DATABASE_URL`

### Étape 3 : Configurer les variables d'environnement
1. Cliquez sur votre service Next.js
2. Allez dans l'onglet "Variables"
3. Ajoutez les variables nécessaires

### Étape 4 : Déployer
Railway déploiera automatiquement à chaque push sur la branche `main`.

## Fichiers de configuration Railway inclus

- `railway.toml` - Configuration du déploiement Railway
- `nixpacks.toml` - Configuration du build avec Nixpacks

## Commandes Prisma utiles

```bash
# Générer le client Prisma
pnpm exec prisma generate

# Pousser le schéma vers la base de données
pnpm db:push

# Créer une migration
pnpm db:migrate

# Ouvrir Prisma Studio
pnpm db:studio
```

# Guide : Comment générer une clé API

Ce guide vous explique étape par étape comment générer une clé API pour accéder à l'endpoint des témoignages.

## Prérequis

- Accès au projet HUB (localement ou sur Railway)
- Node.js installé (si vous générez la clé en local)
- Accès à la base de données (pour que le script puisse créer la clé)

## Méthode 1 : Génération en local (recommandé)

### Étape 1 : Ouvrir un terminal

Sur Windows :
- Appuyez sur `Windows + R`
- Tapez `cmd` ou `powershell` et appuyez sur Entrée
- Naviguez vers le dossier du projet :
  ```bash
  cd C:\Users\cleme\Nukleo.HUB
  ```

### Étape 2 : Vérifier que vous êtes dans le bon dossier

```bash
dir
```

Vous devriez voir des dossiers comme `src`, `prisma`, `scripts`, etc.

### Étape 3 : Vérifier que Node.js est installé

```bash
node --version
```

Si vous voyez une erreur, installez Node.js depuis https://nodejs.org/

### Étape 4 : Vérifier que la base de données est accessible

Assurez-vous que votre fichier `.env` contient la variable `DATABASE_URL` avec les bonnes informations de connexion.

### Étape 5 : Générer la clé API

Exécutez la commande suivante :

```bash
node scripts/generate-api-key.mjs "Site web nukleo.digital"
```

**Exemple avec options :**
```bash
node scripts/generate-api-key.mjs "Site web nukleo.digital" --expires-in-days=365 --rate-limit=5000
```

### Étape 6 : Copier la clé API

Le script va afficher quelque chose comme :

```
✅ Clé API créée avec succès!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID:        clx123abc...
Nom:       Site web nukleo.digital
Clé API:   nk_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
Préfixe:   nk_abc123...
Limite:    1000 requêtes/heure
Expire le: Jamais
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT: Copiez cette clé maintenant, elle ne sera plus affichée!
```

**⚠️ IMPORTANT :** Copiez la ligne `Clé API:` complète (tout ce qui commence par `nk_`). C'est cette valeur que vous devrez utiliser dans votre variable d'environnement `INTERNAL_PLATFORM_API_KEY`.

## Méthode 2 : Génération via Railway (si vous avez accès SSH)

### Étape 1 : Se connecter à Railway

1. Allez sur https://railway.app
2. Ouvrez votre projet HUB
3. Ouvrez l'onglet "Deployments"
4. Cliquez sur le dernier déploiement
5. Ouvrez l'onglet "Logs" ou "Shell"

### Étape 2 : Exécuter la commande

Dans le terminal Railway, exécutez :

```bash
node scripts/generate-api-key.mjs "Site web nukleo.digital"
```

### Étape 3 : Copier la clé

Copiez la clé API affichée dans les logs.

## Méthode 3 : Création manuelle via Prisma Studio (alternative)

Si les méthodes précédentes ne fonctionnent pas, vous pouvez créer la clé manuellement :

### Étape 1 : Ouvrir Prisma Studio

```bash
npx prisma studio
```

### Étape 2 : Créer une nouvelle clé API

1. Dans Prisma Studio, allez dans la table `ApiKey`
2. Cliquez sur "Add record"
3. Remplissez les champs :
   - `name`: "Site web nukleo.digital"
   - `key`: Vous devez générer un hash SHA-256 d'une clé aléatoire
   - `keyPrefix`: Les 8 premiers caractères de votre clé (ex: "nk_abc123...")
   - `isActive`: true
   - `rateLimit`: 1000

**⚠️ Note :** Cette méthode est plus complexe car vous devez générer le hash vous-même. Il est préférable d'utiliser le script.

## Dépannage

### Erreur : "Cannot find module '@prisma/client'"

**Solution :** Installez les dépendances d'abord :
```bash
pnpm install
# ou
npm install
```

### Erreur : "Prisma schema not found"

**Solution :** Assurez-vous d'être dans le bon dossier (celui qui contient `prisma/schema.prisma`).

### Erreur de connexion à la base de données

**Solution :** Vérifiez votre fichier `.env` et que `DATABASE_URL` est correctement configuré.

### Le script ne s'exécute pas

**Solution :** Essayez avec `node` directement :
```bash
node --version  # Vérifier que Node.js est installé
node scripts/generate-api-key.mjs "Test"
```

## Utilisation de la clé API

Une fois la clé générée, ajoutez-la dans votre projet `nukleo.digital` :

```env
INTERNAL_PLATFORM_URL=https://nukleohub-production.up.railway.app
INTERNAL_PLATFORM_API_KEY=nk_votre-cle-api-generee-ici
```

## Besoin d'aide ?

Si vous rencontrez toujours des problèmes, vérifiez :
1. Que vous êtes dans le bon dossier
2. Que Node.js est installé et à jour
3. Que la base de données est accessible
4. Que le fichier `scripts/generate-api-key.mjs` existe


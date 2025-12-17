# Configuration du projet consommateur (nukleo.digital)

Ce guide explique comment configurer votre projet `nukleo.digital` pour consommer l'API des témoignages depuis le HUB.

## Variables d'environnement requises

### 1. Variable obligatoire

**`INTERNAL_PLATFORM_URL`**

- **Où :** Dans le projet `nukleo.digital` (Railway/Vercel ou fichier `.env` local)
- **Description :** URL de base du HUB Nukleo
- **Exemples :**
  ```
  INTERNAL_PLATFORM_URL=https://nukleo-hub.up.railway.app
  INTERNAL_PLATFORM_URL=https://hub.nukleo.digital
  INTERNAL_PLATFORM_URL=http://localhost:3000  # Pour le développement local
  ```

### 2. Variable optionnelle (si authentification activée)

**`INTERNAL_PLATFORM_API_KEY`**

- **Où :** Dans le projet `nukleo.digital` (Railway/Vercel ou fichier `.env` local)
- **Description :** Clé API secrète pour authentifier les requêtes vers le HUB
- **Valeur :** Clé API générée dans le HUB (voir section "Génération d'une clé API" ci-dessous)
- **Exemple :**
  ```
  INTERNAL_PLATFORM_API_KEY=nk_abc123def456...
  ```

## Configuration selon la plateforme

### Railway

1. Allez dans votre projet `nukleo.digital` sur Railway
2. Ouvrez l'onglet **Variables**
3. Ajoutez les variables :
   - `INTERNAL_PLATFORM_URL` = `https://votre-hub-url.com`
   - `INTERNAL_PLATFORM_API_KEY` = `votre-cle-api` (si nécessaire)

### Vercel

1. Allez dans votre projet `nukleo.digital` sur Vercel
2. Ouvrez **Settings** → **Environment Variables**
3. Ajoutez les variables pour les environnements appropriés (Production, Preview, Development)
4. Redéployez votre application

### Développement local (.env)

Créez ou modifiez le fichier `.env` à la racine de votre projet `nukleo.digital` :

```env
# URL du HUB Nukleo
INTERNAL_PLATFORM_URL=https://nukleo-hub.up.railway.app

# Clé API (optionnelle, seulement si l'authentification est activée)
INTERNAL_PLATFORM_API_KEY=nk_votre-cle-api-secrete
```

## Génération d'une clé API

Si vous avez besoin d'une clé API pour authentifier vos requêtes :

1. Connectez-vous au HUB Nukleo
2. Exécutez le script de génération :
   ```bash
   node scripts/generate-api-key.mjs "Site web nukleo.digital"
   ```
3. Copiez la clé API générée
4. Ajoutez-la à la variable `INTERNAL_PLATFORM_API_KEY` dans votre projet `nukleo.digital`

## Exemple d'utilisation dans le code

### JavaScript/TypeScript (Next.js, React, etc.)

```typescript
// Récupérer les témoignages en français
async function fetchTestimonials(language: 'fr' | 'en' = 'fr') {
  const hubUrl = process.env.INTERNAL_PLATFORM_URL;
  const apiKey = process.env.INTERNAL_PLATFORM_API_KEY;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Ajouter la clé API si disponible
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    // ou headers['X-API-Key'] = apiKey;
  }
  
  const response = await fetch(
    `${hubUrl}/api/testimonials?language=${language}`,
    { headers }
  );
  
  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status}`);
  }
  
  const data = await response.json();
  return data.testimonials;
}

// Utilisation
const testimonials = await fetchTestimonials('fr');
```

### PHP

```php
<?php
$hubUrl = getenv('INTERNAL_PLATFORM_URL');
$apiKey = getenv('INTERNAL_PLATFORM_API_KEY');

$headers = [
    'Content-Type: application/json',
];

if ($apiKey) {
    $headers[] = 'Authorization: Bearer ' . $apiKey;
    // ou $headers[] = 'X-API-Key: ' . $apiKey;
}

$ch = curl_init($hubUrl . '/api/testimonials?language=fr');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    $testimonials = $data['testimonials'];
} else {
    error_log("Erreur API: " . $httpCode);
}
?>
```

## Vérification de la configuration

Pour vérifier que votre configuration est correcte, testez l'endpoint :

```bash
# Avec curl
curl -H "Authorization: Bearer $INTERNAL_PLATFORM_API_KEY" \
  "$INTERNAL_PLATFORM_URL/api/testimonials?language=fr"

# Ou avec la variable d'environnement directement
curl -H "Authorization: Bearer votre-cle-api" \
  "https://votre-hub-url.com/api/testimonials?language=fr"
```

Vous devriez recevoir une réponse JSON avec les témoignages.

## Dépannage

### Erreur 401 Unauthorized

- Vérifiez que `INTERNAL_PLATFORM_API_KEY` est correctement configurée
- Vérifiez que la clé API n'a pas expiré
- Vérifiez que la clé API est active dans le HUB

### Erreur de connexion

- Vérifiez que `INTERNAL_PLATFORM_URL` pointe vers la bonne URL
- Vérifiez que le HUB est accessible depuis votre environnement
- Vérifiez les restrictions IP si votre clé API en a

### Erreur 429 Too Many Requests

- Vous avez dépassé la limite de requêtes par heure
- Attendez un peu avant de refaire une requête
- Contactez l'administrateur pour augmenter la limite si nécessaire

## Support

Pour toute question ou problème, contactez l'équipe du HUB Nukleo.


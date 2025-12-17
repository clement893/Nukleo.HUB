# API Témoignages - Documentation

## Endpoint Public

### GET /api/testimonials

Récupère les témoignages clients en ligne. Nécessite une clé API valide.

#### Authentification

L'endpoint nécessite une clé API valide fournie dans les headers HTTP :

**Option 1: Header Authorization**
```
Authorization: Bearer <votre-cle-api>
```

**Option 2: Header X-API-Key**
```
X-API-Key: <votre-cle-api>
```

#### Paramètres de requête

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `language` | `string` | Non | Langue des témoignages (`fr` ou `en`). Défaut: `fr` |
| `featured` | `string` | Non | Si `true`, retourne uniquement les témoignages mis en avant |

#### Exemples de requêtes

```bash
# Récupérer les témoignages en français
curl -H "Authorization: Bearer nk_votre-cle-api" \
  "https://votre-domaine.com/api/testimonials?language=fr"

# Récupérer les témoignages en anglais mis en avant
curl -H "X-API-Key: nk_votre-cle-api" \
  "https://votre-domaine.com/api/testimonials?language=en&featured=true"
```

#### Réponse (succès)

**Status:** `200 OK`

```json
{
  "success": true,
  "language": "fr",
  "count": 5,
  "testimonials": [
    {
      "id": "clx123...",
      "clientName": "Jean Dupont",
      "companyName": "Entreprise ABC",
      "text": "Excellent service, je recommande vivement!",
      "title": "Projet de transformation digitale",
      "rating": 5,
      "featured": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Réponse (erreur)

**Status:** `401 Unauthorized`

```json
{
  "error": "Clé API invalide ou manquante. Veuillez fournir une clé API valide dans le header Authorization: Bearer <key> ou X-API-Key."
}
```

**Status:** `400 Bad Request`

```json
{
  "error": "Le paramètre 'language' doit être 'fr' ou 'en'"
}
```

## Génération d'une clé API

Pour générer une nouvelle clé API, utilisez le script fourni :

```bash
node scripts/generate-api-key.mjs "Nom de la clé" [options]
```

### Options disponibles

- `--expires-in-days=N` : Nombre de jours avant expiration (défaut: jamais)
- `--rate-limit=N` : Limite de requêtes par heure (défaut: 1000)
- `--allowed-ips=ip1,ip2` : IPs autorisées, séparées par virgule (défaut: toutes)

### Exemples

```bash
# Clé API simple
node scripts/generate-api-key.mjs "Site web principal"

# Clé API avec expiration et limite personnalisée
node scripts/generate-api-key.mjs "Site web principal" \
  --expires-in-days=365 \
  --rate-limit=5000

# Clé API restreinte à certaines IPs
node scripts/generate-api-key.mjs "API mobile" \
  --allowed-ips=192.168.1.100,10.0.0.50
```

## Rate Limiting

Chaque clé API a une limite de requêtes par heure configurable. Par défaut, la limite est de 1000 requêtes/heure.

Si la limite est dépassée, l'API retournera un status `429 Too Many Requests`.

## Sécurité

- Les clés API sont stockées sous forme de hash SHA-256 dans la base de données
- Seules les clés actives peuvent être utilisées
- Les clés expirées sont automatiquement rejetées
- Option de restriction par IP disponible
- Toutes les requêtes sont loggées avec l'ID de la clé API utilisée

## Notes importantes

⚠️ **Important:** Une fois générée, la clé API complète ne sera plus affichée. Assurez-vous de la copier immédiatement.

🔒 **Sécurité:** Ne partagez jamais votre clé API publiquement. Gardez-la secrète comme un mot de passe.

📊 **Monitoring:** Les utilisations des clés API sont enregistrées avec la date de dernière utilisation.


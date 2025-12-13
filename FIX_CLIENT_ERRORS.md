# Fix: Erreurs côté client après optimisation de performance

## Problème
Après l'ajout de la pagination aux APIs, les composants côté client recevaient un format de réponse différent (`{ data: [...], pagination: {...} }`) au lieu d'un tableau simple, causant des erreurs d'exécution.

## Solution
Ajout d'une compatibilité rétroactive : les APIs retournent maintenant :
- **Un tableau simple** si aucun paramètre de pagination (`?page=` ou `?limit=`) n'est fourni
- **Un objet paginé** (`{ data: [...], pagination: {...} }`) si des paramètres de pagination sont fournis

## Fichiers modifiés

### `/workspace/src/lib/pagination.ts`
- `getPaginationParams()` retourne maintenant `null` si aucun paramètre n'est fourni (au lieu de valeurs par défaut)

### APIs modifiées (mode rétrocompatible)
- `/api/contacts` - Retourne tableau si pas de pagination
- `/api/projects` - Retourne tableau si pas de pagination  
- `/api/opportunities` - Retourne tableau si pas de pagination
- `/api/companies` - Retourne tableau si pas de pagination
- `/api/tasks` - Retourne tableau si pas de pagination
- `/api/events` - Retourne tableau si pas de pagination

## Impact
- ✅ Tous les composants existants continuent de fonctionner sans modification
- ✅ La pagination reste disponible pour les nouveaux composants qui en ont besoin
- ✅ Les performances sont améliorées pour les grandes listes (via pagination optionnelle)
- ✅ Le cache fonctionne pour les deux formats

## Migration future
Pour utiliser la pagination dans un nouveau composant :
```typescript
const response = await fetch("/api/contacts?page=1&limit=20");
const { data, pagination } = await response.json();
// data: Contact[]
// pagination: { page, limit, total, totalPages, hasMore }
```

Pour garder le format simple (rétrocompatible) :
```typescript
const response = await fetch("/api/contacts");
const contacts = await response.json(); // Contact[] directement
```

# Rapport d'Audit de Sécurité - Nukleo.HUB

**Date de l'audit :** 11 décembre 2025  
**Version de l'application :** Production (Railway)  
**Auditeur :** Manus AI

---

## Résumé Exécutif

Cette analyse de sécurité a identifié plusieurs vulnérabilités et points d'amélioration dans l'application Nukleo.HUB. Les failles sont classées par niveau de criticité : **Critique**, **Élevé**, **Moyen** et **Faible**.

| Niveau | Nombre de failles |
|--------|-------------------|
| Critique | 1 |
| Élevé | 3 |
| Moyen | 4 |
| Faible | 3 |

---

## 1. Failles Critiques

### 1.1 Absence de vérification d'authentification sur la majorité des APIs

**Fichiers concernés :** 99+ routes API sur 102  
**Localisation :** `/src/app/api/`

**Description :**  
La grande majorité des APIs ne vérifient pas l'authentification de l'utilisateur. Bien que le middleware redirige les utilisateurs non authentifiés vers la page de login pour les routes web, les appels API directs (via curl, Postman, etc.) peuvent contourner cette protection.

**Exemple de code vulnérable :**
```typescript
// src/app/api/contacts/route.ts
export async function GET() {
  const contacts = await prisma.contact.findMany({
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json(contacts);
}
```

**Impact :**  
- Accès non autorisé aux données sensibles (contacts, projets, employés, opportunités)
- Modification ou suppression de données sans authentification
- Exposition complète de la base de données

**Recommandation :**
```typescript
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  // ... reste du code
}
```

**Priorité de correction :** Immédiate

---

## 2. Failles de Niveau Élevé

### 2.1 Absence de validation des entrées utilisateur

**Fichiers concernés :** 72+ routes avec `request.json()`  
**Localisation :** Toutes les routes POST/PATCH/PUT

**Description :**  
Aucune validation de schéma (Zod, Yup, Joi) n'est utilisée pour valider les données entrantes. Les données sont directement passées à Prisma sans vérification.

**Exemple de code vulnérable :**
```typescript
export async function POST(request: Request) {
  const body = await request.json();
  const contact = await prisma.contact.create({
    data: body, // Données non validées
  });
}
```

**Impact :**
- Injection de champs non autorisés dans la base de données
- Corruption de données
- Potentielles erreurs de type causant des crashs

**Recommandation :**
```typescript
import { z } from "zod";

const contactSchema = z.object({
  fullName: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  // ...
});

export async function POST(request: Request) {
  const body = await request.json();
  const validated = contactSchema.parse(body);
  const contact = await prisma.contact.create({ data: validated });
}
```

---

### 2.2 Vulnérabilités XSS potentielles

**Fichiers concernés :**
- `src/app/leo/page.tsx`
- `src/app/onboarding/page.tsx`

**Description :**  
Utilisation de `dangerouslySetInnerHTML` sans sanitisation du contenu.

**Exemple de code vulnérable :**
```tsx
<div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
<div dangerouslySetInnerHTML={{ __html: policy.content.replace(/\n/g, "<br/>") }} />
```

**Impact :**
- Exécution de scripts malveillants dans le navigateur des utilisateurs
- Vol de cookies de session
- Redirection vers des sites malveillants

**Recommandation :**
```typescript
import DOMPurify from "dompurify";

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```

---

### 2.3 Tokens de portail prévisibles

**Fichiers concernés :**
- `src/app/api/client-portals/route.ts`
- `src/app/api/employee-portal/route.ts`

**Description :**  
Les tokens de portail (client et employé) sont générés avec `randomBytes(16)` ce qui est correct, mais ils sont stockés en clair et n'ont pas de mécanisme d'expiration.

**Impact :**
- Accès permanent aux portails une fois le token compromis
- Pas de possibilité de révoquer l'accès sans supprimer le portail

**Recommandation :**
- Ajouter une date d'expiration aux tokens
- Implémenter un mécanisme de rotation des tokens
- Ajouter un historique des accès

---

## 3. Failles de Niveau Moyen

### 3.1 Absence de rate limiting

**Description :**  
Aucune limite de taux n'est implémentée sur les APIs, ce qui expose l'application aux attaques par force brute et au déni de service.

**APIs critiques sans rate limiting :**
- `/api/auth/login` - Tentatives de connexion
- `/api/portal/[token]` - Énumération de tokens
- `/api/leo` - Appels LLM coûteux

**Recommandation :**
```typescript
import rateLimit from "express-rate-limit";

// Ou utiliser un middleware Next.js personnalisé
// Ou un service comme Cloudflare, Vercel Edge
```

---

### 3.2 Tokens OAuth Google stockés en clair

**Fichiers concernés :**
- `prisma/schema.prisma` (Employee model)

**Description :**  
Les tokens d'accès et de rafraîchissement Google sont stockés en texte clair dans la base de données.

```prisma
googleAccessToken     String?   @db.Text
googleRefreshToken    String?   @db.Text
```

**Impact :**
- En cas de compromission de la base de données, tous les tokens Google sont exposés
- Accès aux calendriers Google de tous les employés

**Recommandation :**
- Chiffrer les tokens avant stockage avec une clé de chiffrement
- Utiliser un service de gestion de secrets (AWS Secrets Manager, HashiCorp Vault)

---

### 3.3 Absence de contrôle d'accès basé sur les ressources (IDOR)

**Description :**  
Plusieurs APIs ne vérifient pas si l'utilisateur a le droit d'accéder à la ressource demandée.

**Exemple :**
```typescript
// src/app/api/projects/[id]/route.ts
export async function GET(request, { params }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });
  return NextResponse.json(project);
}
// Aucune vérification que l'utilisateur a accès à ce projet
```

**Recommandation :**
- Vérifier les permissions utilisateur pour chaque ressource
- Utiliser le système UserAccess existant pour filtrer les résultats

---

### 3.4 Sessions sans invalidation côté serveur

**Description :**  
Les sessions ont une durée de 30 jours sans possibilité de les invalider toutes en cas de compromission.

**Recommandation :**
- Ajouter une fonctionnalité "Déconnecter toutes les sessions"
- Implémenter une version de session pour invalider en masse
- Réduire la durée de session à 7 jours avec renouvellement automatique

---

## 4. Failles de Niveau Faible

### 4.1 Logs d'erreurs exposant des détails techniques

**Description :**  
Les erreurs sont loguées avec `console.error` et peuvent exposer des informations sensibles dans les logs de production.

**Recommandation :**
- Utiliser un service de logging structuré (Sentry, LogRocket)
- Ne pas exposer les détails d'erreur aux utilisateurs

---

### 4.2 Absence de headers de sécurité

**Description :**  
Les headers de sécurité HTTP ne sont pas configurés (CSP, X-Frame-Options, etc.).

**Recommandation :**
Ajouter dans `next.config.js` :
```javascript
async headers() {
  return [
    {
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Content-Security-Policy", value: "default-src 'self'..." },
      ],
    },
  ];
}
```

---

### 4.3 Uploads de fichiers sans scan antivirus

**Description :**  
Les fichiers uploadés (photos d'employés, documents) ne sont pas scannés pour les malwares.

**Recommandation :**
- Intégrer un service de scan antivirus (ClamAV, VirusTotal API)
- Limiter les types de fichiers autorisés (déjà partiellement fait)

---

## 5. Points Positifs

L'application présente également de bonnes pratiques de sécurité :

1. **Cookies de session sécurisés** : `httpOnly`, `secure` en production, `sameSite: "lax"`
2. **Hachage des tokens de session** : Utilisation de `randomBytes(32)` pour la génération
3. **Validation du domaine email** : Restriction aux domaines `@nukleo.com` et `@nukleo.ca`
4. **Protection des super admins** : Logique empêchant la modification/suppression par des admins normaux
5. **Validation des types de fichiers** : Pour les uploads de photos
6. **Utilisation de Prisma** : Protection native contre les injections SQL

---

## 6. Plan de Remédiation Recommandé

### Phase 1 - Immédiat (1-2 jours)
1. Ajouter `getCurrentUser()` à toutes les APIs non publiques
2. Installer et configurer Zod pour la validation des entrées

### Phase 2 - Court terme (1 semaine)
3. Implémenter le rate limiting sur les APIs critiques
4. Ajouter DOMPurify pour sanitiser le HTML
5. Configurer les headers de sécurité

### Phase 3 - Moyen terme (2-4 semaines)
6. Chiffrer les tokens OAuth Google
7. Implémenter le contrôle d'accès IDOR
8. Ajouter l'expiration des tokens de portail

### Phase 4 - Long terme (1-2 mois)
9. Audit de sécurité externe
10. Tests de pénétration
11. Mise en place d'un programme de bug bounty

---

## 7. Conclusion

L'application Nukleo.HUB présente des vulnérabilités significatives, principalement liées à l'absence de vérification d'authentification sur les APIs. La correction de la faille critique (authentification des APIs) devrait être la priorité absolue avant toute autre amélioration.

Les fondations de sécurité (OAuth, sessions, Prisma) sont solides, mais nécessitent une couche supplémentaire de contrôles d'accès et de validation pour atteindre un niveau de sécurité acceptable en production.

---

*Ce rapport a été généré automatiquement et ne remplace pas un audit de sécurité professionnel.*

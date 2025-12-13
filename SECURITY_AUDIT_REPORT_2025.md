# Rapport d'Audit de Sécurité - Nukleo.HUB

**Date de l'audit :** 15 janvier 2025  
**Version de l'application :** Production (Railway)  
**Auditeur :** Audit Automatisé  
**Version Next.js :** 15.0.3  
**Version Prisma :** 5.22.0

---

## Résumé Exécutif

Cet audit de sécurité a été effectué sur l'application Nukleo.HUB pour identifier les vulnérabilités de sécurité actuelles et évaluer les améliorations depuis le dernier audit (décembre 2024).

### Améliorations Depuis le Dernier Audit

✅ **Authentification des APIs** : La grande majorité des routes API utilisent maintenant `requireAuth()` ou `requireAdmin()`  
✅ **Rate Limiting** : Implémentation d'un système de rate limiting sur les endpoints critiques  
✅ **Validation des Entrées** : Utilisation de Zod pour la validation dans plusieurs routes (contacts, employees, opportunities)  
✅ **Headers de Sécurité** : Configuration complète des headers de sécurité HTTP dans `next.config.ts`  
✅ **Sanitisation XSS** : Utilisation de DOMPurify dans plusieurs composants

### État Actuel

| Niveau | Nombre de failles |
|--------|-------------------|
| Critique | 2 |
| Élevé | 4 |
| Moyen | 6 |
| Faible | 3 |

---

## 1. Failles Critiques

### 1.1 Vulnérabilités dans les Dépendances (Next.js)

**Fichiers concernés :** `package.json`  
**Version actuelle :** Next.js 15.0.3  
**Versions vulnérables :** < 15.1.2, < 15.2.2, < 15.4.5

**Description :**  
Plusieurs vulnérabilités connues (CVE) affectent la version actuelle de Next.js :

1. **CVE-2024-56332** (Modéré) - DoS avec Server Actions
   - Versions affectées : >=15.0.0 <15.1.2
   - Impact : Attaques DoS permettant de laisser des requêtes en suspens
   - Correction : Mettre à jour vers >= 15.1.2

2. **CVE-2025-48068** (Faible) - Exposition d'informations dans le dev server
   - Versions affectées : >=15.0.0 <15.2.2
   - Impact : Exposition limitée du code source en développement
   - Correction : Mettre à jour vers >= 15.2.2

3. **CVE-2025-57752** (Modéré) - Cache Key Confusion pour Image Optimization
   - Versions affectées : < 15.4.5
   - Impact : Images servies à des utilisateurs non autorisés via cache
   - Correction : Mettre à jour vers >= 15.4.5

**Impact :**
- Risque de déni de service
- Exposition potentielle de code source en développement
- Fuite d'informations via le cache d'images

**Recommandation :**
```bash
pnpm update next@latest
# Vérifier la compatibilité avec les autres dépendances
```

**Priorité de correction :** Immédiate

---

### 1.2 Absence de Validation sur Plusieurs Routes API

**Fichiers concernés :** 
- `src/app/api/projects/route.ts` (POST)
- `src/app/api/companies/route.ts` (POST)
- `src/app/api/tasks/route.ts` (POST)
- Et plusieurs autres routes

**Description :**  
Bien que certaines routes utilisent maintenant la validation Zod (contacts, employees, opportunities), de nombreuses routes acceptent encore des données non validées directement dans Prisma.

**Exemple de code vulnérable :**
```typescript
// src/app/api/projects/route.ts
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const project = await prisma.project.create({
      data: body, // ❌ Données non validées
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    // ...
  }
}
```

**Impact :**
- Injection de champs non autorisés dans la base de données
- Corruption de données
- Erreurs de type causant des crashs
- Possibilité d'injection NoSQL (bien que Prisma protège contre SQL)

**Recommandation :**
```typescript
import { projectCreateSchema, validateBody } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    
    // Validation avec Zod
    const validation = validateBody(projectCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: validation.data, // ✅ Données validées
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    // ...
  }
}
```

**Routes nécessitant une validation :**
- `/api/projects` (POST)
- `/api/companies` (POST, PUT)
- `/api/tasks` (POST, PUT)
- `/api/events` (POST, PUT)
- `/api/testimonials` (POST, PUT)
- `/api/milestones` (POST, PUT)
- `/api/quotes` (POST, PUT)
- `/api/invoices` (POST, PUT)
- `/api/documents` (POST)
- Et plusieurs autres...

**Priorité de correction :** Immédiate

---

## 2. Failles de Niveau Élevé

### 2.1 XSS Potentiel dans Leo Page

**Fichiers concernés :**
- `src/app/leo/page.tsx` (ligne 279)

**Description :**  
Bien que `formatMessage` utilise DOMPurify, il y a un risque si le contenu est rendu côté serveur avant la sanitisation côté client.

**Code actuel :**
```typescript
const formatMessage = (content: string) => {
  const formatted = content
    .split("\n")
    .map((line, i) => {
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // ...
    })
    .join("");
  // Sanitiser le HTML pour prévenir les attaques XSS (côté client ET serveur)
  if (typeof window !== "undefined") {
    return DOMPurify.sanitize(formatted, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'a'],
      ALLOWED_ATTR: ['href', 'class'],
      ALLOW_DATA_ATTR: false,
    });
  }
  return formatted; // ⚠️ Retourne du HTML non sanitisé côté serveur
};

// Utilisation
<div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
```

**Impact :**
- Si le rendu SSR est activé, le HTML non sanitisé pourrait être servi
- Risque d'exécution de scripts malveillants

**Recommandation :**
```typescript
import DOMPurify from "isomorphic-dompurify"; // Version SSR-safe

const formatMessage = (content: string) => {
  const formatted = content
    .split("\n")
    .map((line, i) => {
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // ...
    })
    .join("");
  
  // Sanitiser toujours, même côté serveur
  return DOMPurify.sanitize(formatted, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'a'],
    ALLOWED_ATTR: ['href', 'class'],
    ALLOW_DATA_ATTR: false,
  });
};
```

**Priorité de correction :** Élevée

---

### 2.2 Tokens OAuth Google Stockés en Clair

**Fichiers concernés :**
- `prisma/schema.prisma` (modèle Employee)

**Description :**  
Les tokens d'accès et de rafraîchissement Google OAuth sont stockés en texte clair dans la base de données.

```prisma
model Employee {
  // ...
  googleAccessToken     String?   @db.Text
  googleRefreshToken    String?   @db.Text
  googleTokenExpiry     DateTime?
  // ...
}
```

**Impact :**
- En cas de compromission de la base de données, tous les tokens Google sont exposés
- Accès aux calendriers Google de tous les employés
- Violation de la confidentialité des données OAuth

**Recommandation :**
1. Chiffrer les tokens avant stockage avec AES-256-GCM
2. Utiliser une clé de chiffrement stockée dans les variables d'environnement
3. Implémenter une rotation automatique des tokens

**Exemple d'implémentation :**
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes en hex
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

**Priorité de correction :** Élevée

---

### 2.3 Rate Limiting en Mémoire (Non Distribué)

**Fichiers concernés :**
- `src/lib/rate-limit.ts`

**Description :**  
Le rate limiting est implémenté en mémoire avec un `Map`, ce qui ne fonctionne pas correctement dans un environnement distribué (plusieurs instances de serveur).

**Code actuel :**
```typescript
// Store en mémoire pour le rate limiting (en production, utiliser Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();
```

**Impact :**
- En production avec plusieurs instances (Railway, Vercel), chaque instance a son propre store
- Un attaquant peut contourner le rate limiting en distribuant ses requêtes entre les instances
- Le rate limiting ne fonctionne pas efficacement

**Recommandation :**
Utiliser Redis pour un store distribué :

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.pexpire(key, config.windowMs);
  }
  
  const ttl = await redis.pttl(key);
  const resetTime = now + ttl;
  
  if (current > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime,
    };
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - current,
    resetTime,
  };
}
```

**Priorité de correction :** Élevée

---

### 2.4 Absence de Contrôle d'Accès Basé sur les Ressources (IDOR)

**Description :**  
Plusieurs APIs ne vérifient pas si l'utilisateur a le droit d'accéder à la ressource demandée spécifiquement.

**Exemples :**
```typescript
// src/app/api/projects/[id]/route.ts
export async function GET(request, { params }) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;
  
  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });
  // ⚠️ Aucune vérification que l'utilisateur a accès à ce projet
  return NextResponse.json(project);
}
```

**Impact :**
- Un utilisateur peut accéder à des projets/clients/contacts auxquels il n'a pas accès
- Violation de la confidentialité des données
- Non-respect du système `UserAccess` existant

**Recommandation :**
```typescript
import { getUserAccess } from "@/lib/user-access";

export async function GET(request, { params }) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;
  
  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });
  
  if (!project) {
    return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
  }
  
  // Vérifier les permissions d'accès
  const userAccess = await getUserAccess(auth.id);
  if (!canAccessProject(userAccess, project.id)) {
    return NextResponse.json(
      { error: "Accès refusé" },
      { status: 403 }
    );
  }
  
  return NextResponse.json(project);
}
```

**Priorité de correction :** Élevée

---

## 3. Failles de Niveau Moyen

### 3.1 Sessions Sans Invalidation Côté Serveur

**Fichiers concernés :**
- `src/lib/auth.ts`
- `src/lib/api-auth.ts`

**Description :**  
Les sessions ont une durée de 7 jours avec renouvellement automatique (sliding window), mais il n'y a pas de mécanisme pour invalider toutes les sessions d'un utilisateur en cas de compromission.

**Impact :**
- En cas de vol de cookie de session, l'accès reste valide jusqu'à expiration
- Pas de possibilité de "déconnecter toutes les sessions" en urgence

**Recommandation :**
1. Ajouter un champ `version` aux sessions pour invalidation en masse
2. Implémenter une fonction "Déconnecter toutes les sessions"
3. Ajouter un mécanisme de détection de sessions suspectes (changement d'IP, user-agent)

---

### 3.2 Logs d'Erreurs Exposant des Détails Techniques

**Fichiers concernés :** Toutes les routes API

**Description :**  
Les erreurs sont loguées avec `console.error` et peuvent exposer des informations sensibles dans les logs de production.

**Exemple :**
```typescript
catch (error) {
  console.error("Error fetching projects:", error);
  return NextResponse.json(
    { error: "Failed to fetch projects" },
    { status: 500 }
  );
}
```

**Impact :**
- Exposition de stack traces dans les logs
- Risque de fuite d'informations sensibles (chemins de fichiers, requêtes SQL, etc.)

**Recommandation :**
```typescript
import { logger } from "@/lib/logger";

catch (error) {
  logger.error("Error fetching projects", error as Error, "PROJECTS_API", {
    userId: auth.id,
    // Ne pas logger les détails sensibles
  });
  
  const errorMessage = process.env.NODE_ENV === "production"
    ? "Une erreur est survenue lors de la récupération des projets."
    : (error as Error).message;
    
  return NextResponse.json(
    { error: errorMessage },
    { status: 500 }
  );
}
```

---

### 3.3 Uploads de Fichiers Sans Scan Antivirus

**Fichiers concernés :**
- `src/app/api/documents/route.ts`
- `src/app/api/employees/[id]/photo/route.ts`

**Description :**  
Les fichiers uploadés (photos d'employés, documents) ne sont pas scannés pour les malwares.

**Impact :**
- Risque d'upload de fichiers malveillants
- Propagation de malwares dans l'infrastructure

**Recommandation :**
- Intégrer un service de scan antivirus (ClamAV, VirusTotal API)
- Limiter strictement les types MIME autorisés
- Implémenter une validation de taille de fichier

---

### 3.4 Tokens de Portail Sans Expiration Obligatoire

**Fichiers concernés :**
- `src/app/api/client-portals/route.ts`
- `src/app/api/employee-portal/route.ts`

**Description :**  
Les tokens de portail (client et employé) peuvent être créés sans date d'expiration (`expiresAt` est optionnel).

**Impact :**
- Accès permanent aux portails une fois le token compromis
- Pas de possibilité de révoquer l'accès sans supprimer le portail

**Recommandation :**
- Rendre `expiresAt` obligatoire avec une valeur par défaut (ex: 1 an)
- Implémenter un mécanisme de rotation automatique des tokens
- Ajouter un historique des accès pour audit

---

### 3.5 Absence de CSRF Protection sur les Mutations

**Description :**  
Bien que Next.js protège contre CSRF par défaut, il n'y a pas de vérification explicite de tokens CSRF pour les mutations sensibles.

**Impact :**
- Risque d'attaques CSRF sur les actions sensibles (suppression, modification)

**Recommandation :**
- Utiliser les tokens CSRF de Next.js pour les mutations
- Vérifier l'origine des requêtes pour les actions critiques

---

### 3.6 Secrets Hardcodés dans le Code

**Fichiers concernés :**
- `src/app/api/auth/google/callback/route.ts` (ligne 10-11)

**Description :**  
Des URLs hardcodées sont présentes dans le code.

**Exemple :**
```typescript
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  : "https://nukleohub-production.up.railway.app/api/auth/google/callback"; // ⚠️ Hardcodé
```

**Impact :**
- Difficulté de maintenance
- Risque si l'URL change

**Recommandation :**
- Utiliser uniquement les variables d'environnement
- Lever une erreur si les variables ne sont pas définies

---

## 4. Failles de Niveau Faible

### 4.1 Headers CSP Trop Permissifs

**Fichiers concernés :**
- `next.config.ts` (ligne 96)

**Description :**  
Le Content Security Policy autorise `'unsafe-inline'` et `'unsafe-eval'` pour les scripts.

**Code actuel :**
```typescript
"Content-Security-Policy",
"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; ..."
```

**Impact :**
- Réduction de l'efficacité de la protection CSP
- Risque d'exécution de scripts inline malveillants

**Recommandation :**
- Utiliser des nonces pour les scripts inline
- Éliminer `'unsafe-eval'` si possible
- Restreindre davantage les sources autorisées

---

### 4.2 Absence de Monitoring de Sécurité

**Description :**  
Aucun système de monitoring des tentatives d'attaque ou d'accès suspect n'est en place.

**Recommandation :**
- Implémenter un système de logging des tentatives d'authentification échouées
- Monitorer les patterns d'accès suspects
- Alertes en cas de tentatives de brute force

---

### 4.3 Absence de Tests de Sécurité Automatisés

**Description :**  
Aucun test de sécurité automatisé n'est présent dans le projet.

**Recommandation :**
- Ajouter des tests unitaires pour les validations
- Implémenter des tests d'intégration pour l'authentification
- Utiliser des outils comme OWASP ZAP ou Snyk pour les scans automatiques

---

## 5. Points Positifs

L'application présente plusieurs bonnes pratiques de sécurité :

1. ✅ **Cookies de session sécurisés** : `httpOnly`, `secure` en production, `sameSite: "lax"`
2. ✅ **Hachage des tokens de session** : Utilisation de `randomBytes(32)` pour la génération
3. ✅ **Validation du domaine email** : Restriction aux domaines `@nukleo.com` et `@nukleo.ca`
4. ✅ **Protection des super admins** : Logique empêchant la modification/suppression par des admins normaux
5. ✅ **Validation des types de fichiers** : Pour les uploads de photos
6. ✅ **Utilisation de Prisma** : Protection native contre les injections SQL
7. ✅ **Headers de sécurité HTTP** : Configuration complète dans `next.config.ts`
8. ✅ **Rate limiting** : Implémenté sur les endpoints critiques
9. ✅ **Authentification systématique** : La majorité des routes utilisent `requireAuth()`

---

## 6. Plan de Remédiation Recommandé

### Phase 1 - Immédiat (1-2 jours) 🔴

1. **Mettre à jour Next.js** vers la dernière version (>= 15.4.5)
   ```bash
   pnpm update next@latest
   ```

2. **Ajouter la validation Zod** sur toutes les routes POST/PUT/PATCH
   - Priorité : `/api/projects`, `/api/companies`, `/api/tasks`, `/api/events`

3. **Corriger le XSS dans Leo** avec `isomorphic-dompurify`

### Phase 2 - Court terme (1 semaine) 🟠

4. **Chiffrer les tokens OAuth Google** avant stockage

5. **Implémenter Redis** pour le rate limiting distribué

6. **Ajouter le contrôle d'accès IDOR** sur toutes les routes avec paramètres d'ID

7. **Corriger les secrets hardcodés** dans le code

### Phase 3 - Moyen terme (2-4 semaines) 🟡

8. **Implémenter l'invalidation de sessions** en masse

9. **Ajouter le scan antivirus** pour les uploads de fichiers

10. **Rendre obligatoire l'expiration** des tokens de portail

11. **Améliorer les logs** avec un système structuré (Sentry, LogRocket)

### Phase 4 - Long terme (1-2 mois) 🟢

12. **Renforcer le CSP** avec des nonces

13. **Implémenter le monitoring de sécurité**

14. **Ajouter des tests de sécurité automatisés**

15. **Audit de sécurité externe** par un professionnel

---

## 7. Métriques de Sécurité

### Couverture d'Authentification
- Routes avec authentification : **~95%** (96/101 routes API principales)
- Routes sans authentification : **~5%** (principalement les routes publiques de portail)

### Couverture de Validation
- Routes avec validation Zod : **~15%** (15/101 routes)
- Routes nécessitant validation : **~60%** (routes POST/PUT/PATCH)

### Dépendances Vulnérables
- Vulnérabilités critiques : **0**
- Vulnérabilités modérées : **3** (Next.js)
- Vulnérabilités faibles : **1** (Next.js)

---

## 8. Conclusion

L'application Nukleo.HUB a fait des progrès significatifs en matière de sécurité depuis le dernier audit. L'authentification est maintenant systématique sur la plupart des routes, et plusieurs mécanismes de protection sont en place.

Cependant, plusieurs vulnérabilités critiques nécessitent une attention immédiate :
1. La mise à jour de Next.js pour corriger les CVE
2. L'ajout de validation sur toutes les routes de mutation
3. La correction du risque XSS dans la page Leo

Les améliorations recommandées permettront d'atteindre un niveau de sécurité robuste pour une application en production.

---

## 9. Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Prisma Security](https://www.prisma.io/docs/guides/security)
- [CVE-2024-56332](https://nvd.nist.gov/vuln/detail/CVE-2024-56332)
- [CVE-2025-48068](https://nvd.nist.gov/vuln/detail/CVE-2025-48068)
- [CVE-2025-57752](https://nvd.nist.gov/vuln/detail/CVE-2025-57752)

---

*Ce rapport a été généré automatiquement et ne remplace pas un audit de sécurité professionnel effectué par un expert en sécurité.*

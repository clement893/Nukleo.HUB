# Rapport d'Audit de Sécurité - Nukleo.HUB

**Date de l'audit :** 13 décembre 2025  
**Version de l'application :** Production (Railway)  
**Auditeur :** AI Security Analyst  
**Classification :** Confidentiel

---

## Résumé Exécutif

Cet audit de sécurité a été réalisé sur l'application Nukleo.HUB, une plateforme de gestion d'entreprise comprenant un CRM, une gestion de projets, des portails employés et clients, ainsi qu'un système d'administration. L'analyse révèle une **amélioration significative** par rapport aux audits précédents, avec la plupart des vulnérabilités critiques corrigées.

### Comparaison avec les audits précédents

| Aspect | Audit 2024 | Audit Décembre 2024 | Audit 2025 (Actuel) | Statut |
|--------|------------|---------------------|---------------------|--------|
| **Authentification sur APIs** | ❌ 1/104 | ❌ 1/104 | ✅ ~277/296 | ✅ **CORRIGÉ** |
| **Validation des entrées** | ❌ Aucune | ❌ Aucune | ✅ Zod implémenté | ✅ **CORRIGÉ** |
| **Sanitisation XSS** | ⚠️ Partielle | ⚠️ Partielle | ✅ DOMPurify | ✅ **AMÉLIORÉ** |
| **Headers de sécurité** | ❌ Aucun | ❌ Aucun | ✅ Configurés | ✅ **CORRIGÉ** |
| **Rate limiting** | ❌ Aucun | ❌ Aucun | ⚠️ Partiel | ⚠️ **EN COURS** |
| **Chiffrement tokens OAuth** | ❌ Non | ❌ Non | ❌ Non | ❌ **EN ATTENTE** |

### Statistiques des vulnérabilités

| Niveau | Nombre | Pourcentage |
|--------|--------|-------------|
| **Critique** | 1 | 8% |
| **Élevé** | 3 | 25% |
| **Moyen** | 5 | 42% |
| **Faible** | 3 | 25% |
| **Total** | 12 | 100% |

---

## Méthodologie

L'audit a été conduit selon les standards OWASP Top 10 2021 et couvre :

1. **Authentification et gestion des sessions** - Analyse du système OAuth Google et des cookies de session
2. **Contrôle d'accès** - Vérification des permissions sur les APIs et les ressources
3. **Validation des entrées** - Recherche d'injections SQL, XSS et autres attaques par injection
4. **Protection des données** - Analyse du stockage, du chiffrement et de l'exposition des données sensibles
5. **Configuration de sécurité** - Vérification des headers HTTP et de la configuration serveur
6. **Dépendances** - Analyse des vulnérabilités dans les packages npm

---

## Vulnérabilités Identifiées

### 1. Absence de Rate Limiting sur les APIs Critiques (CRITIQUE)

**Catégorie OWASP :** A04:2021 - Insecure Design  
**Sévérité :** Critique (CVSS 8.5)

**Description :**  
Un système de rate limiting existe (`src/lib/rate-limit.ts`) mais n'est **utilisé que sur l'API d'upload de documents**. Les APIs critiques suivantes ne sont pas protégées :

- `/api/auth/google` - Tentatives de connexion (force brute)
- `/api/leo` - Appels LLM coûteux (abus de coûts)
- `/api/contacts` - Scraping de données
- `/api/projects` - Scraping de données
- `/api/employees` - Scraping de données
- `/api/invoices` - Accès aux données financières

**Code actuel :**
```typescript
// Seulement utilisé dans documents/route.ts
const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.upload);
```

**Impact :**
- Attaques par force brute sur l'authentification
- Abus de l'API LLM (coûts élevés)
- Scraping massif de données
- Déni de service (DoS) au niveau applicatif

**Recommandation :**
```typescript
// Appliquer le rate limiting sur toutes les APIs critiques
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limiting avant l'authentification
  const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.api);
  if (rateLimitError) return rateLimitError;
  
  const auth = await requireAuth();
  // ...
}
```

**Priorité de correction :** Immédiate

---

### 2. Absence de Validation sur Certaines Routes (ÉLEVÉ)

**Catégorie OWASP :** A03:2021 - Injection  
**Sévérité :** Élevée (CVSS 7.5)

**Description :**  
Bien que Zod soit implémenté et utilisé sur plusieurs routes (notamment `/api/contacts`), certaines routes acceptent encore des données non validées :

**Routes vulnérables identifiées :**
- `/api/projects/[id]` - PATCH accepte `body` directement sans validation
- `/api/opportunities` - POST accepte `body` directement
- `/api/employees` - POST accepte `body` directement
- Plusieurs autres routes dans `/api/admin/`

**Exemple de code vulnérable :**
```typescript
// src/app/api/projects/[id]/route.ts
export async function PATCH(request: NextRequest, { params }) {
  const auth = await requireAuth();
  const body = await request.json();
  
  const project = await prisma.project.update({
    where: { id },
    data: body, // ❌ Données non validées
  });
}
```

**Impact :**
- Mass assignment (injection de champs non autorisés)
- Corruption de données
- Erreurs de type causant des crashs

**Recommandation :**
```typescript
import { projectUpdateSchema, validateBody } from "@/lib/validations";

export async function PATCH(request: NextRequest, { params }) {
  const auth = await requireAuth();
  const body = await request.json();
  
  const validation = validateBody(projectUpdateSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }
  
  const project = await prisma.project.update({
    where: { id },
    data: validation.data,
  });
}
```

**Priorité de correction :** Haute (1 semaine)

---

### 3. Vulnérabilités XSS Potentielles (ÉLEVÉ)

**Catégorie OWASP :** A03:2021 - Injection  
**Sévérité :** Élevée (CVSS 7.0)

**Description :**  
Bien que DOMPurify soit utilisé dans `SafeHTML.tsx` et dans certaines pages (`onboarding/page.tsx`), il reste des utilisations de `dangerouslySetInnerHTML` sans sanitisation complète :

**Fichiers concernés :**
- `src/app/leo/page.tsx` (ligne 271) - Utilise `formatMessage()` mais pas DOMPurify
- `src/components/SafeHTML.tsx` - Sanitise côté client uniquement (SSR non protégé)

**Code vulnérable :**
```typescript
// src/app/leo/page.tsx
<div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
```

**Impact :**
- Exécution de scripts malveillants si le contenu LLM est compromis
- Vol de cookies de session
- Redirection vers des sites malveillants

**Recommandation :**
```typescript
import DOMPurify from "dompurify";

// Utiliser SafeHTML partout
<SafeHTML html={formatMessage(message.content)} />

// Ou sanitiser manuellement
<div dangerouslySetInnerHTML={{ 
  __html: typeof window !== "undefined" 
    ? DOMPurify.sanitize(formatMessage(message.content))
    : formatMessage(message.content) 
}} />
```

**Priorité de correction :** Haute (1 semaine)

---

### 4. Tokens OAuth Google Stockés en Clair (ÉLEVÉ)

**Catégorie OWASP :** A02:2021 - Cryptographic Failures  
**Sévérité :** Élevée (CVSS 7.0)

**Description :**  
Les tokens OAuth Google (access_token et refresh_token) sont stockés en texte clair dans la base de données.

**Schéma actuel :**
```prisma
model Employee {
  googleAccessToken     String?   @db.Text
  googleRefreshToken    String?   @db.Text
  googleTokenExpiry     DateTime?
}
```

**Impact :**
- En cas de compromission de la base de données, tous les tokens Google sont exposés
- Accès aux calendriers Google de tous les employés
- Violation de la confidentialité des données

**Recommandation :**
```typescript
// Utiliser un chiffrement AES-256-GCM
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const ALGORITHM = "aes-256-gcm";

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
```

**Priorité de correction :** Haute (2 semaines)

---

### 5. Absence de Contrôle d'Accès IDOR sur Certaines Routes (MOYEN)

**Catégorie OWASP :** A01:2021 - Broken Access Control  
**Sévérité :** Moyenne (CVSS 6.5)

**Description :**  
Plusieurs APIs ne vérifient pas si l'utilisateur a le droit d'accéder à la ressource demandée. Un utilisateur peut accéder/modifier des ressources qui ne lui appartiennent pas.

**Exemples :**
- `/api/projects/[id]` - Aucune vérification que l'utilisateur a accès à ce projet
- `/api/employees/[id]` - Aucune vérification des permissions
- `/api/invoices/[id]` - Aucune vérification des permissions

**Code vulnérable :**
```typescript
// src/app/api/projects/[id]/route.ts
export async function GET(request, { params }) {
  const auth = await requireAuth();
  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });
  // ❌ Aucune vérification que l'utilisateur a accès à ce projet
  return NextResponse.json(project);
}
```

**Recommandation :**
```typescript
// Utiliser le système UserAccess existant
import { getUserAccess } from "@/lib/user-access";

export async function GET(request, { params }) {
  const auth = await requireAuth();
  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });
  
  // Vérifier les permissions
  const userAccess = await getUserAccess(auth.id);
  if (!hasProjectAccess(userAccess, project.id)) {
    return NextResponse.json(
      { error: "Accès refusé" },
      { status: 403 }
    );
  }
  
  return NextResponse.json(project);
}
```

**Priorité de correction :** Moyenne (3-4 semaines)

---

### 6. Sessions de Longue Durée (MOYEN)

**Catégorie OWASP :** A07:2021 - Identification and Authentication Failures  
**Sévérité :** Moyenne (CVSS 5.5)

**Description :**  
Les sessions utilisateur ont une durée de 30 jours sans mécanisme de renouvellement ou de détection d'activité suspecte.

**Code actuel :**
```typescript
// src/lib/auth.ts
const SESSION_DURATION_DAYS = 30;
```

**Impact :**
- Sessions compromises restent valides trop longtemps
- Pas de détection d'activité suspecte
- Pas de mécanisme de "déconnexion de toutes les sessions"

**Recommandation :**
```typescript
const SESSION_DURATION_DAYS = 7; // Réduire à 7 jours
const SESSION_SLIDING_WINDOW = true; // Renouveler à chaque activité

// Ajouter un mécanisme de sliding session
export async function refreshSession(token: string) {
  const session = await prisma.session.findUnique({ where: { token } });
  if (session && SESSION_SLIDING_WINDOW) {
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + SESSION_DURATION_DAYS);
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt },
    });
  }
}
```

**Priorité de correction :** Moyenne (2-3 semaines)

---

### 7. Absence de Protection CSRF (MOYEN)

**Catégorie OWASP :** A01:2021 - Broken Access Control  
**Sévérité :** Moyenne (CVSS 5.0)

**Description :**  
Aucun token CSRF n'est implémenté pour les opérations sensibles (mutations). Le cookie de session avec `sameSite: "lax"` offre une protection partielle mais insuffisante.

**Impact :**
- Attaques CSRF possibles sur les mutations (POST, PATCH, DELETE)
- Modification/suppression de données sans consentement

**Recommandation :**
```typescript
// Implémenter des tokens CSRF pour les mutations critiques
import { randomBytes } from "crypto";

export function generateCSRFToken(): string {
  return randomBytes(32).toString("hex");
}

// Ajouter le token dans les cookies et vérifier dans les mutations
export async function validateCSRF(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get("csrf_token")?.value;
  const headerToken = request.headers.get("X-CSRF-Token");
  return csrfToken === headerToken;
}
```

**Priorité de correction :** Moyenne (2-3 semaines)

---

### 8. Logging Insuffisant (MOYEN)

**Catégorie OWASP :** A09:2021 - Security Logging and Monitoring Failures  
**Sévérité :** Moyenne (CVSS 4.5)

**Description :**  
Les actions sensibles (connexions, modifications de permissions, accès aux données) ne sont pas systématiquement loguées, rendant difficile la détection d'intrusions.

**Actions non loguées :**
- Tentatives de connexion échouées
- Modifications de permissions utilisateur
- Accès aux données sensibles (factures, projets)
- Actions administratives

**Recommandation :**
```typescript
// Implémenter un système de logging structuré
import { createLogger } from "@/lib/logger";

const securityLogger = createLogger("security");

export async function logSecurityEvent(
  event: string,
  userId: string,
  details: Record<string, unknown>
) {
  await securityLogger.info({
    event,
    userId,
    timestamp: new Date().toISOString(),
    ipAddress: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
    ...details,
  });
}
```

**Priorité de correction :** Moyenne (2-3 semaines)

---

### 9. Exposition d'Informations dans les Erreurs (FAIBLE)

**Catégorie OWASP :** A04:2021 - Insecure Design  
**Sévérité :** Faible (CVSS 3.5)

**Description :**  
Les messages d'erreur exposent parfois des détails techniques (stack traces) en production.

**Exemple :**
```typescript
console.error("Error fetching contacts:", error);
return NextResponse.json(
  { error: "Failed to fetch contacts" },
  { status: 500 }
);
```

**Recommandation :**
```typescript
// En production, logger les détails mais retourner un message générique
if (process.env.NODE_ENV === "production") {
  // Logger les détails côté serveur (Sentry, etc.)
  logger.error("Error fetching contacts", { error, userId: auth.id });
  return NextResponse.json(
    { error: "Une erreur est survenue. Veuillez réessayer." },
    { status: 500 }
  );
} else {
  // En développement, afficher les détails
  return NextResponse.json(
    { error: error.message, stack: error.stack },
    { status: 500 }
  );
}
```

**Priorité de correction :** Faible (1 semaine)

---

### 10. Absence de Validation d'Email Renforcée (FAIBLE)

**Catégorie OWASP :** A07:2021 - Identification and Authentication Failures  
**Sévérité :** Faible (CVSS 3.0)

**Description :**  
L'authentification Google restreint les domaines `@nukleo.com` et `@nukleo.ca`, mais cette vérification pourrait être contournée si la configuration OAuth est modifiée.

**Recommandation :**
```typescript
// Ajouter une vérification côté serveur après l'authentification OAuth
const ALLOWED_DOMAINS = ["@nukleo.com", "@nukleo.ca"];

export function validateEmailDomain(email: string): boolean {
  return ALLOWED_DOMAINS.some(domain => email.endsWith(domain));
}

// Vérifier après l'authentification Google
const googleUser = await getGoogleUserInfo(accessToken);
if (!validateEmailDomain(googleUser.email)) {
  throw new Error("Domaine email non autorisé");
}
```

**Priorité de correction :** Faible (1 semaine)

---

### 11. Absence de Scan Antivirus sur les Uploads (FAIBLE)

**Catégorie OWASP :** A04:2021 - Insecure Design  
**Sévérité :** Faible (CVSS 3.0)

**Description :**  
Les fichiers uploadés ne sont pas scannés pour détecter les malwares avant stockage sur S3.

**Recommandation :**
```typescript
// Intégrer un service de scan antivirus
import { scanFile } from "@/lib/virus-scanner";

export async function POST(request: NextRequest) {
  const file = formData.get("file") as File;
  
  // Scanner le fichier avant upload
  const scanResult = await scanFile(file);
  if (!scanResult.isClean) {
    return NextResponse.json(
      { error: "Fichier malveillant détecté" },
      { status: 400 }
    );
  }
  
  // Continuer avec l'upload
}
```

**Priorité de correction :** Faible (2-3 semaines)

---

### 12. Rate Limiting en Mémoire (Non Persistant) (FAIBLE)

**Catégorie OWASP :** A04:2021 - Insecure Design  
**Sévérité :** Faible (CVSS 3.0)

**Description :**  
Le système de rate limiting actuel utilise une Map en mémoire (`rateLimitStore`), ce qui signifie :
- Perte des compteurs lors d'un redémarrage
- Non fonctionnel en environnement multi-instances (scaling horizontal)
- Pas de persistance

**Code actuel :**
```typescript
// src/lib/rate-limit.ts
const rateLimitStore = new Map<string, RateLimitEntry>();
```

**Recommandation :**
```typescript
// Utiliser Redis pour le rate limiting distribué
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});
```

**Priorité de correction :** Faible (2-3 semaines)

---

## Points Positifs Identifiés

L'application présente de nombreuses bonnes pratiques de sécurité :

1. ✅ **Authentification systématique** - `requireAuth()` utilisé sur ~277 routes API
2. ✅ **Validation des entrées** - Zod implémenté et utilisé sur plusieurs routes
3. ✅ **Sanitisation XSS** - DOMPurify utilisé dans `SafeHTML.tsx` et certaines pages
4. ✅ **Headers de sécurité HTTP** - Configurés dans `next.config.ts` :
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block
   - Strict-Transport-Security
   - Content-Security-Policy
5. ✅ **Cookies de session sécurisés** - `httpOnly`, `secure` en production, `sameSite: "lax"`
6. ✅ **Hachage des tokens de session** - Utilisation de `randomBytes(32)`
7. ✅ **Validation du domaine email** - Restriction aux domaines autorisés
8. ✅ **Protection des super admins** - Logique empêchant la modification/suppression
9. ✅ **Utilisation de Prisma** - Protection native contre les injections SQL
10. ✅ **Système de rate limiting** - Existe mais sous-utilisé

---

## Plan de Remédiation Recommandé

### Phase 1 - Corrections Critiques (Semaine 1)

| Priorité | Vulnérabilité | Effort | Impact |
|----------|---------------|--------|--------|
| P0 | Rate limiting sur toutes les APIs critiques | 2-3 jours | Critique |
| P0 | Validation Zod sur toutes les routes POST/PATCH | 3-4 jours | Élevé |

### Phase 2 - Corrections Élevées (Semaine 2-3)

| Priorité | Vulnérabilité | Effort | Impact |
|----------|---------------|--------|--------|
| P1 | Sanitisation XSS complète (leo/page.tsx) | 1 jour | Élevé |
| P1 | Chiffrement tokens OAuth Google | 2 jours | Élevé |

### Phase 3 - Corrections Moyennes (Semaine 4-6)

| Priorité | Vulnérabilité | Effort | Impact |
|----------|---------------|--------|--------|
| P2 | Contrôle d'accès IDOR | 3-4 jours | Moyen |
| P2 | Réduction durée sessions + sliding window | 1 jour | Moyen |
| P2 | Protection CSRF | 2 jours | Moyen |
| P2 | Logging de sécurité | 2 jours | Moyen |

### Phase 4 - Améliorations (Semaine 7-8)

| Priorité | Vulnérabilité | Effort | Impact |
|----------|---------------|--------|--------|
| P3 | Messages d'erreur génériques | 0.5 jour | Faible |
| P3 | Validation domaine email renforcée | 0.5 jour | Faible |
| P3 | Scan antivirus uploads | 2 jours | Faible |
| P3 | Rate limiting Redis (distribué) | 1 jour | Faible |

---

## Conclusion

L'application Nukleo.HUB a fait des **progrès significatifs** en matière de sécurité depuis les audits précédents. Les vulnérabilités critiques identifiées précédemment (absence d'authentification, absence de validation) ont été largement corrigées.

**Points forts :**
- Authentification systématique sur la majorité des APIs
- Validation des entrées avec Zod (partiellement implémentée)
- Headers de sécurité HTTP configurés
- Sanitisation XSS avec DOMPurify (partiellement implémentée)

**Points à améliorer :**
- Rate limiting doit être appliqué sur toutes les APIs critiques
- Validation Zod doit être étendue à toutes les routes
- Chiffrement des tokens OAuth Google
- Contrôle d'accès IDOR sur les ressources

**Recommandation globale :**  
L'application est dans un état de sécurité **acceptable** pour la production, mais nécessite des améliorations pour atteindre un niveau de sécurité **robuste**. La priorité absolue est l'implémentation du rate limiting sur toutes les APIs critiques et l'extension de la validation Zod à toutes les routes.

Un audit de suivi est recommandé après l'implémentation des corrections de Phase 1 et Phase 2 pour valider l'efficacité des mesures prises.

---

## Annexes

### A. Outils Utilisés

- Analyse statique du code source
- Grep pour la recherche de patterns vulnérables
- Revue manuelle des fichiers critiques
- Analyse des dépendances npm

### B. Fichiers Analysés

- 296 fichiers route.ts (APIs)
- 1 fichier middleware.ts
- 1 fichier auth.ts
- 1 fichier api-auth.ts
- 1 fichier validations.ts
- 1 fichier schema.prisma
- 1 fichier next.config.ts
- Composants React (.tsx) pour XSS

### C. Références

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)
- [Zod Documentation](https://zod.dev/)

---

*Ce rapport est confidentiel et destiné uniquement à l'équipe Nukleo. La distribution non autorisée est interdite.*

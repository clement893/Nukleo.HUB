# Rapport d'Audit de Sécurité - Nukleo.HUB

**Date de l'audit :** 11 décembre 2024  
**Version de l'application :** Production (Railway)  
**Auteur :** Manus AI  
**Classification :** Confidentiel

---

## Résumé Exécutif

Cet audit de sécurité a été réalisé sur l'application Nukleo.HUB, une plateforme de gestion d'entreprise comprenant un CRM, une gestion de projets, des portails employés et clients, ainsi qu'un système d'administration. L'analyse a révélé **15 vulnérabilités** dont **3 critiques**, **5 élevées**, **4 moyennes** et **3 faibles**.

| Niveau de Risque | Nombre | Pourcentage |
|------------------|--------|-------------|
| **Critique** | 3 | 20% |
| **Élevé** | 5 | 33% |
| **Moyen** | 4 | 27% |
| **Faible** | 3 | 20% |
| **Total** | 15 | 100% |

La vulnérabilité la plus préoccupante concerne l'absence quasi-totale de vérification d'authentification sur les APIs internes. Sur 104 endpoints API identifiés, **seulement 1** implémente correctement la vérification d'authentification avec `getCurrentUser()`. Cette faille permet à un attaquant non authentifié d'accéder à l'ensemble des données de l'application.

---

## Méthodologie

L'audit a été conduit selon les standards OWASP Top 10 2021 et couvre les domaines suivants :

1. **Authentification et gestion des sessions** - Analyse du système OAuth Google et des cookies de session
2. **Contrôle d'accès** - Vérification des permissions sur les APIs et les ressources
3. **Validation des entrées** - Recherche d'injections SQL, XSS et autres attaques par injection
4. **Protection des données** - Analyse du stockage, du chiffrement et de l'exposition des données sensibles
5. **Configuration de sécurité** - Vérification des headers HTTP et de la configuration serveur

---

## Vulnérabilités Identifiées

### 1. Absence d'Authentification sur les APIs (CRITIQUE)

**Catégorie OWASP :** A01:2021 - Broken Access Control  
**Sévérité :** Critique (CVSS 9.8)

**Description :**  
Sur les 104 endpoints API analysés, **103 ne vérifient pas l'authentification** de l'utilisateur. Le middleware Next.js vérifie uniquement la présence d'un cookie de session mais ne valide pas son authenticité au niveau des APIs. Cela signifie qu'un attaquant peut accéder directement aux APIs sans être authentifié.

**APIs vulnérables (échantillon) :**

| Endpoint | Méthodes | Données exposées |
|----------|----------|------------------|
| `/api/contacts` | GET, POST | Tous les contacts |
| `/api/companies` | GET, POST, PUT, DELETE | Toutes les entreprises |
| `/api/employees` | GET, POST, PUT, DELETE | Tous les employés |
| `/api/projects` | GET, POST, PUT, DELETE | Tous les projets |
| `/api/opportunities` | GET, POST, PUT, DELETE | Pipeline commercial |
| `/api/admin/stats` | GET | Statistiques admin |
| `/api/admin/timesheets` | GET, POST | Feuilles de temps |
| `/api/admin/notifications` | GET, POST | Notifications système |

**Preuve de concept :**
```bash
# Accès sans authentification aux contacts
curl https://nukleohub-production.up.railway.app/api/contacts
# Retourne la liste complète des contacts
```

**Recommandation :**  
Implémenter une vérification d'authentification systématique sur toutes les APIs en utilisant `getCurrentUser()` :

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

---

### 2. Absence de Validation des Entrées (CRITIQUE)

**Catégorie OWASP :** A03:2021 - Injection  
**Sévérité :** Critique (CVSS 8.5)

**Description :**  
Aucune validation des entrées utilisateur n'est implémentée. Les données JSON reçues sont directement passées à Prisma sans validation préalable. Bien que Prisma protège contre les injections SQL classiques, l'absence de validation permet des attaques de type mass assignment et la création de données malformées.

**Exemple de code vulnérable :**
```typescript
// src/app/api/contacts/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const contact = await prisma.contact.create({
    data: body,  // Aucune validation !
  });
  return NextResponse.json(contact);
}
```

**Risques :**
- **Mass Assignment** : Un attaquant peut définir des champs non prévus (ex: `isAdmin: true`)
- **Données malformées** : Injection de caractères spéciaux dans les champs texte
- **Déni de service** : Envoi de payloads volumineux ou malformés

**Recommandation :**  
Implémenter Zod pour la validation des entrées :

```typescript
import { z } from "zod";

const contactSchema = z.object({
  fullName: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(255).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validated = contactSchema.parse(body);
  const contact = await prisma.contact.create({ data: validated });
  return NextResponse.json(contact);
}
```

---

### 3. Tokens de Portail Sans Expiration (CRITIQUE)

**Catégorie OWASP :** A07:2021 - Identification and Authentication Failures  
**Sévérité :** Critique (CVSS 8.0)

**Description :**  
Les tokens d'accès aux portails employés et clients sont générés avec `cuid()` et n'ont pas de date d'expiration. Une fois un token compromis, il reste valide indéfiniment.

**Schéma actuel :**
```prisma
model EmployeePortal {
  token       String   @unique @default(cuid())
  isActive    Boolean  @default(true)
  // Pas de champ expiresAt !
}

model ClientPortal {
  token       String    @unique
  // Pas de champ expiresAt !
}
```

**Recommandation :**  
Ajouter une date d'expiration et un mécanisme de rotation des tokens :

```prisma
model EmployeePortal {
  token       String   @unique @default(cuid())
  isActive    Boolean  @default(true)
  expiresAt   DateTime @default(dbgenerated("NOW() + INTERVAL '90 days'"))
  lastUsedAt  DateTime?
}
```

---

### 4. Vulnérabilités XSS Potentielles (ÉLEVÉ)

**Catégorie OWASP :** A03:2021 - Injection  
**Sévérité :** Élevée (CVSS 7.5)

**Description :**  
Trois instances de `dangerouslySetInnerHTML` ont été identifiées, permettant potentiellement des attaques XSS si le contenu n'est pas correctement sanitisé.

| Fichier | Ligne | Contexte |
|---------|-------|----------|
| `src/app/leo/page.tsx` | 268 | Messages du chat IA |
| `src/app/onboarding/page.tsx` | 255 | Contenu des politiques |
| `src/app/onboarding/page.tsx` | 414 | Contenu des étapes |

**Recommandation :**  
Utiliser une bibliothèque de sanitisation comme DOMPurify :

```typescript
import DOMPurify from "dompurify";

<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(content) 
}} />
```

---

### 5. APIs Admin Sans Vérification de Rôle (ÉLEVÉ)

**Catégorie OWASP :** A01:2021 - Broken Access Control  
**Sévérité :** Élevée (CVSS 7.5)

**Description :**  
Plusieurs APIs dans le dossier `/api/admin/` ne vérifient pas que l'utilisateur possède le rôle administrateur.

**APIs admin vulnérables :**

| Endpoint | Risque |
|----------|--------|
| `/api/admin/stats` | Exposition des statistiques |
| `/api/admin/logs` | Accès aux logs système |
| `/api/admin/settings` | Modification des paramètres |
| `/api/admin/employees` | Gestion des employés |
| `/api/admin/employee-access` | Gestion des accès |
| `/api/admin/timesheets` | Feuilles de temps |
| `/api/admin/notifications` | Notifications système |

**Recommandation :**  
Créer un middleware de vérification admin réutilisable :

```typescript
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !["admin", "super_admin"].includes(user.role)) {
    throw new Error("Accès refusé");
  }
  return user;
}
```

---

### 6. Absence de Rate Limiting (ÉLEVÉ)

**Catégorie OWASP :** A04:2021 - Insecure Design  
**Sévérité :** Élevée (CVSS 7.0)

**Description :**  
Aucun mécanisme de rate limiting n'est implémenté, exposant l'application aux attaques par force brute, au scraping de données et aux attaques DDoS au niveau applicatif.

**Endpoints à risque :**
- `/api/auth/google` - Tentatives de connexion
- `/api/contacts` - Scraping de données
- `/api/leo` - Abus de l'API LLM (coûts)

**Recommandation :**  
Implémenter un rate limiter avec `@upstash/ratelimit` :

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

---

### 7. Absence de Validation des Types de Fichiers (ÉLEVÉ)

**Catégorie OWASP :** A04:2021 - Insecure Design  
**Sévérité :** Élevée (CVSS 7.0)

**Description :**  
L'API d'upload de documents (`/api/documents`) accepte tous les types de fichiers sans validation. Un attaquant pourrait uploader des fichiers malveillants (scripts, exécutables).

**Code vulnérable :**
```typescript
// Aucune vérification du type MIME ou de l'extension
const file = formData.get("file") as File;
await s3Client.send(new PutObjectCommand({
  ContentType: file.type,  // Type fourni par le client !
}));
```

**Recommandation :**  
Valider le type MIME et l'extension côté serveur :

```typescript
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

if (!ALLOWED_TYPES.includes(file.type)) {
  return NextResponse.json({ error: "Type de fichier non autorisé" }, { status: 400 });
}
```

---

### 8. Absence de Headers de Sécurité HTTP (ÉLEVÉ)

**Catégorie OWASP :** A05:2021 - Security Misconfiguration  
**Sévérité :** Élevée (CVSS 6.5)

**Description :**  
La configuration Next.js ne définit aucun header de sécurité HTTP, exposant l'application à diverses attaques.

**Headers manquants :**

| Header | Protection |
|--------|------------|
| `Content-Security-Policy` | XSS, injection de contenu |
| `X-Frame-Options` | Clickjacking |
| `X-Content-Type-Options` | MIME sniffing |
| `Strict-Transport-Security` | Downgrade HTTPS |
| `Referrer-Policy` | Fuite d'informations |

**Recommandation :**  
Ajouter les headers dans `next.config.ts` :

```typescript
const nextConfig = {
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
      ],
    }];
  },
};
```

---

### 9. Sessions de Longue Durée (MOYEN)

**Catégorie OWASP :** A07:2021 - Identification and Authentication Failures  
**Sévérité :** Moyenne (CVSS 5.5)

**Description :**  
Les sessions utilisateur ont une durée de 30 jours sans mécanisme de renouvellement ou de détection d'activité suspecte.

```typescript
const SESSION_DURATION_DAYS = 30;
```

**Recommandation :**  
Réduire la durée des sessions à 7 jours et implémenter un mécanisme de sliding session.

---

### 10. Tokens OAuth Stockés en Clair (MOYEN)

**Catégorie OWASP :** A02:2021 - Cryptographic Failures  
**Sévérité :** Moyenne (CVSS 5.0)

**Description :**  
Les tokens OAuth Google (access_token et refresh_token) pour la synchronisation calendrier sont stockés en clair dans la base de données.

```prisma
model Employee {
  googleAccessToken     String?   @db.Text
  googleRefreshToken    String?   @db.Text
}
```

**Recommandation :**  
Chiffrer les tokens avant stockage avec une clé de chiffrement dédiée.

---

### 11. Absence de Protection CSRF (MOYEN)

**Catégorie OWASP :** A01:2021 - Broken Access Control  
**Sévérité :** Moyenne (CVSS 5.0)

**Description :**  
Aucun token CSRF n'est implémenté pour les opérations sensibles (mutations). Le cookie de session avec `sameSite: "lax"` offre une protection partielle mais insuffisante.

**Recommandation :**  
Implémenter des tokens CSRF pour les mutations critiques ou utiliser le pattern Double Submit Cookie.

---

### 12. Logging Insuffisant (MOYEN)

**Catégorie OWASP :** A09:2021 - Security Logging and Monitoring Failures  
**Sévérité :** Moyenne (CVSS 4.5)

**Description :**  
Les actions sensibles (connexions, modifications de permissions, accès aux données) ne sont pas systématiquement loguées, rendant difficile la détection d'intrusions.

**Recommandation :**  
Implémenter un système de logging structuré pour les événements de sécurité.

---

### 13. Exposition d'Informations dans les Erreurs (FAIBLE)

**Catégorie OWASP :** A04:2021 - Insecure Design  
**Sévérité :** Faible (CVSS 3.5)

**Description :**  
Les messages d'erreur exposent parfois des détails techniques (stack traces) en production.

**Recommandation :**  
Retourner des messages d'erreur génériques en production et logger les détails côté serveur.

---

### 14. Absence de Validation d'Email (FAIBLE)

**Catégorie OWASP :** A07:2021 - Identification and Authentication Failures  
**Sévérité :** Faible (CVSS 3.0)

**Description :**  
L'authentification Google restreint les domaines `@nukleo.com` mais cette vérification pourrait être contournée si la configuration OAuth est modifiée.

**Recommandation :**  
Ajouter une vérification côté serveur du domaine email après l'authentification OAuth.

---

### 15. Absence de Scan Antivirus sur les Uploads (FAIBLE)

**Catégorie OWASP :** A04:2021 - Insecure Design  
**Sévérité :** Faible (CVSS 3.0)

**Description :**  
Les fichiers uploadés ne sont pas scannés pour détecter les malwares avant stockage sur S3.

**Recommandation :**  
Intégrer un service de scan antivirus (ClamAV, VirusTotal API) pour les uploads.

---

## Plan de Remédiation

### Phase 1 - Corrections Critiques (Semaine 1-2)

| Priorité | Vulnérabilité | Effort | Impact |
|----------|---------------|--------|--------|
| P0 | Authentification sur toutes les APIs | 3-5 jours | Critique |
| P0 | Validation des entrées avec Zod | 2-3 jours | Critique |
| P0 | Expiration des tokens de portail | 1 jour | Critique |

### Phase 2 - Corrections Élevées (Semaine 3-4)

| Priorité | Vulnérabilité | Effort | Impact |
|----------|---------------|--------|--------|
| P1 | Sanitisation XSS | 1 jour | Élevé |
| P1 | Vérification rôle admin | 1 jour | Élevé |
| P1 | Rate limiting | 2 jours | Élevé |
| P1 | Validation types de fichiers | 1 jour | Élevé |
| P1 | Headers de sécurité HTTP | 0.5 jour | Élevé |

### Phase 3 - Corrections Moyennes (Semaine 5-6)

| Priorité | Vulnérabilité | Effort | Impact |
|----------|---------------|--------|--------|
| P2 | Réduction durée sessions | 0.5 jour | Moyen |
| P2 | Chiffrement tokens OAuth | 1 jour | Moyen |
| P2 | Protection CSRF | 1 jour | Moyen |
| P2 | Logging de sécurité | 2 jours | Moyen |

### Phase 4 - Améliorations (Semaine 7-8)

| Priorité | Vulnérabilité | Effort | Impact |
|----------|---------------|--------|--------|
| P3 | Messages d'erreur génériques | 0.5 jour | Faible |
| P3 | Validation domaine email | 0.5 jour | Faible |
| P3 | Scan antivirus uploads | 2 jours | Faible |

---

## Conclusion

L'application Nukleo.HUB présente des vulnérabilités de sécurité significatives, principalement liées à l'absence de contrôles d'accès sur les APIs. La correction prioritaire de l'authentification sur toutes les APIs est **impérative** avant toute mise en production avec des données sensibles.

L'architecture de l'application (Next.js + Prisma) offre une base solide pour implémenter les corrections recommandées. L'utilisation de Prisma protège naturellement contre les injections SQL, et le système d'authentification OAuth Google est correctement implémenté au niveau du flux de connexion.

Un audit de suivi est recommandé après l'implémentation des corrections de Phase 1 et Phase 2 pour valider l'efficacité des mesures prises.

---

## Annexes

### A. Outils Utilisés

- Analyse statique du code source
- Grep pour la recherche de patterns vulnérables
- Revue manuelle des fichiers critiques
- Test des endpoints API

### B. Fichiers Analysés

- 104 fichiers route.ts (APIs)
- 1 fichier middleware.ts
- 1 fichier auth.ts
- 1 fichier schema.prisma
- 1 fichier next.config.ts
- Composants React (.tsx) pour XSS

### C. Références

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)

---

*Ce rapport est confidentiel et destiné uniquement à l'équipe Nukleo. La distribution non autorisée est interdite.*

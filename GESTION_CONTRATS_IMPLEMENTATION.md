# Implémentation : Gestion Centralisée des Contrats

## Vue d'ensemble

Système complet de gestion des contrats avec templates, suivi des échéances, signatures électroniques et gestion des fournisseurs/sous-traitants.

## Fonctionnalités implémentées

### 1. Modèles de base de données (Prisma)

#### `Supplier` (Fournisseurs et sous-traitants)
- Gestion des fournisseurs, sous-traitants et partenaires
- Informations de contact complètes
- Numéro de TVA/SIRET
- Statut actif/inactif

#### `ContractTemplate` (Templates de contrats)
- Templates réutilisables par catégorie
- Variables dynamiques ({{CLIENT_NAME}}, {{DATE}}, etc.)
- Contenu HTML/Markdown
- Statut actif/inactif

#### `Contract` (Contrats)
- Numéro de contrat unique (CONTRACT-YYYY-NNNN)
- Liens avec Company (clients) et Supplier
- Dates : début, fin, renouvellement, deadline signature
- Statuts : draft, pending_signature, active, expired, terminated, cancelled
- Montants et conditions de paiement
- Contenu et termes du contrat
- Gestion des signatures (client, fournisseur, agence)
- Notifications d'échéance configurables

#### `ContractSignature` (Signatures électroniques)
- Signatures par type de signataire
- Données de signature (SVG/base64)
- Métadonnées (IP, user agent, timestamp)
- Méthodes : draw, type, upload

#### `ContractRenewal` (Renouvellements)
- Historique des renouvellements
- Dates et changements
- Statut d'approbation

#### `ContractAmendment` (Amendements)
- Modifications aux contrats existants
- Signatures spécifiques aux amendements
- Statut d'approbation

### 2. APIs créées

#### `/api/admin/contracts`
- **GET** : Liste des contrats avec filtres (statut, catégorie, recherche)
- **POST** : Créer un nouveau contrat avec génération automatique du numéro

#### `/api/admin/contracts/[id]`
- **GET** : Détails complets d'un contrat (avec signatures, renouvellements, amendements)
- **PUT** : Mettre à jour un contrat
- **DELETE** : Supprimer un contrat

#### `/api/admin/contracts/[id]/signature`
- **POST** : Ajouter une signature électronique à un contrat

#### `/api/admin/contracts/expiring`
- **GET** : Liste des contrats expirant bientôt (paramètre `days`)

#### `/api/admin/contract-templates`
- **GET** : Liste des templates avec filtres
- **POST** : Créer un nouveau template

#### `/api/admin/suppliers`
- **GET** : Liste des fournisseurs avec filtres
- **POST** : Créer un nouveau fournisseur

### 3. Interface utilisateur (Admin)

#### Page principale `/admin/contracts`
- Liste des contrats avec filtres (statut, catégorie, recherche)
- Affichage des informations clés (numéro, parties, dates, montants)
- Indicateurs visuels pour contrats expirant bientôt
- Statut des signatures (client, fournisseur, agence)
- Actions : signer, télécharger, modifier, supprimer
- Intégration du composant `SignaturePad` pour signatures électroniques

#### Page `/admin/contracts/templates`
- Liste des templates de contrats
- Filtres par catégorie
- Actions : créer, modifier, dupliquer, supprimer
- Compteur de contrats créés avec chaque template

#### Page `/admin/contracts/suppliers`
- Liste des fournisseurs et sous-traitants
- Filtres par type (fournisseur, sous-traitant, partenaire)
- Informations de contact complètes
- Compteur de contrats par fournisseur

### 4. Système de notifications d'échéances

#### `contract-notifications.ts`
- Fonction `checkContractExpirations()` : Vérifie les contrats expirant dans les 90 prochains jours
- Rappels configurables (par défaut : 90, 60, 30 jours)
- Mise à jour automatique de `lastReminderSent`
- Prévention des doublons (fenêtre de 7 jours)

### 5. Fonctionnalités clés

#### Templates avec variables
- Remplacement automatique des variables lors de la création
- Variables disponibles :
  - `{{CONTRACT_NUMBER}}` : Numéro du contrat
  - `{{DATE}}` : Date actuelle
  - `{{YEAR}}` : Année actuelle
  - `{{CLIENT_NAME}}` : Nom du client (si companyId)
  - `{{CLIENT_ADDRESS}}` : Adresse du client
  - `{{CLIENT_EMAIL}}` : Email du client
  - `{{SUPPLIER_NAME}}` : Nom du fournisseur (si supplierId)
  - `{{SUPPLIER_ADDRESS}}` : Adresse du fournisseur
  - `{{SUPPLIER_EMAIL}}` : Email du fournisseur

#### Signatures électroniques
- Réutilisation du composant `SignaturePad` (déjà créé pour les approbations)
- Support multi-signatures (client, fournisseur, agence)
- Passage automatique à "active" quand toutes les signatures sont présentes
- Métadonnées complètes pour traçabilité légale

#### Gestion des échéances
- Calcul automatique des jours jusqu'à expiration
- Alertes visuelles pour contrats expirant bientôt
- API dédiée pour récupérer les contrats expirants
- Système de notifications prêt à être intégré

## Fichiers créés/modifiés

### Nouveaux fichiers
- `src/app/api/admin/contracts/route.ts` - API principale contrats
- `src/app/api/admin/contracts/[id]/route.ts` - API CRUD contrat individuel
- `src/app/api/admin/contracts/[id]/signature/route.ts` - API signatures
- `src/app/api/admin/contracts/expiring/route.ts` - API contrats expirants
- `src/app/api/admin/contract-templates/route.ts` - API templates
- `src/app/api/admin/suppliers/route.ts` - API fournisseurs
- `src/app/admin/contracts/page.tsx` - Page principale contrats
- `src/app/admin/contracts/templates/page.tsx` - Page templates
- `src/app/admin/contracts/suppliers/page.tsx` - Page fournisseurs
- `src/lib/contract-notifications.ts` - Système de notifications

### Fichiers modifiés
- `prisma/schema.prisma` - Ajout des modèles de contrats

## Utilisation

### Pour les administrateurs

1. **Créer un template** :
   - Aller dans `/admin/contracts/templates`
   - Créer un nouveau template avec variables
   - Activer le template

2. **Créer un contrat** :
   - Aller dans `/admin/contracts`
   - Cliquer sur "Nouveau contrat"
   - Sélectionner un template (optionnel)
   - Remplir les informations
   - Les variables seront remplacées automatiquement

3. **Signer un contrat** :
   - Ouvrir un contrat en attente de signature
   - Cliquer sur l'icône de signature
   - Signer avec le composant SignaturePad
   - La signature est enregistrée avec métadonnées

4. **Gérer les fournisseurs** :
   - Aller dans `/admin/contracts/suppliers`
   - Ajouter/modifier/supprimer des fournisseurs
   - Les fournisseurs apparaissent dans la création de contrats

5. **Surveiller les échéances** :
   - Les contrats expirant bientôt sont marqués visuellement
   - Utiliser `/api/admin/contracts/expiring?days=30` pour récupérer la liste

## Prochaines étapes recommandées

1. **Cron job** : Automatiser la vérification des échéances quotidienne
2. **Notifications email** : Envoyer des emails pour les échéances
3. **Génération PDF** : Générer des PDFs des contrats signés
4. **Workflow d'approbation** : Intégrer avec le système d'approbation existant
5. **Renouvellements automatiques** : Proposer le renouvellement automatique
6. **Amendements** : Interface complète pour créer et signer des amendements
7. **Recherche avancée** : Filtres supplémentaires et recherche full-text
8. **Export** : Export Excel/CSV des contrats
9. **Dashboard** : Statistiques et graphiques sur les contrats
10. **Intégration calendrier** : Ajouter les échéances au calendrier

## Migration Prisma

Pour appliquer les changements à la base de données :

```bash
npx prisma migrate dev --name add_contract_management
```

Ou en production :

```bash
npx prisma migrate deploy
```

## Impact

✅ **Gestion centralisée** : Tous les contrats au même endroit
✅ **Templates réutilisables** : Gain de temps pour création de contrats
✅ **Signatures électroniques** : Traçabilité légale complète
✅ **Suivi des échéances** : Plus de contrats oubliés
✅ **Gestion fournisseurs** : Base de données centralisée
✅ **Notifications** : Système prêt pour alertes automatiques

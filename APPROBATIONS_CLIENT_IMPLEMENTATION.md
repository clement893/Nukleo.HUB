# Implémentation : Gestion des Approbations Client

## Vue d'ensemble

Système complet de workflow d'approbation structuré avec signatures électroniques pour le portail client, permettant de gérer les approbations de livrables de manière professionnelle et traçable.

## Fonctionnalités implémentées

### 1. Modèles de base de données (Prisma)

#### `ApprovalWorkflow`
- Gestion des workflows d'approbation par livrable
- Types de workflow : `simple`, `multi_step`, `parallel`
- Statut : `pending`, `in_progress`, `approved`, `rejected`, `cancelled`
- Suivi de l'étape courante

#### `ApprovalStep`
- Étapes du workflow avec ordre séquentiel
- Types d'approbateurs : `client`, `employee`, `specific_user`
- Statut par étape : `pending`, `approved`, `rejected`, `skipped`
- Commentaires et timestamps d'approbation

#### `ApprovalSignature`
- Signatures électroniques liées aux workflows
- Méthodes : `draw` (dessin), `type` (texte), `upload` (fichier)
- Stockage des données de signature (SVG/base64)
- Métadonnées : IP, user agent, timestamp

#### `ApprovalHistory`
- Historique complet des actions sur les workflows
- Actions : `approve`, `reject`, `request_revision`, `comment`, `signature_added`
- Traçabilité complète avec acteur, timestamp, commentaires

#### `DeliverableVersion`
- Versioning des livrables avec approbations
- Chaque version peut avoir son propre workflow
- Changelog et statut par version

### 2. APIs créées

#### `/api/portal/[token]/deliverables/[id]/approval`
- **GET** : Récupérer le workflow d'approbation d'un livrable
- **POST** : Créer ou mettre à jour un workflow d'approbation
- **PATCH** : 
  - Approuver/rejeter une étape (`approve_step`, `reject_step`, `request_revision`)
  - Ajouter une signature électronique (`add_signature`)

#### `/api/portal/[token]/deliverables/[id]/versions`
- **GET** : Récupérer toutes les versions d'un livrable
- **POST** : Créer une nouvelle version avec workflow automatique

### 3. Interface utilisateur (Portail Client)

#### Composant `SignaturePad`
- Zone de signature avec canvas HTML5
- Support souris et tactile
- Export en PNG (base64)
- Interface intuitive avec boutons effacer/enregistrer

#### Modal de livrable amélioré
- **Affichage du workflow** : Visualisation des étapes avec statuts
- **Actions par étape** : Approuver, rejeter, demander révision
- **Signatures électroniques** : Ajout de signatures par étape ou globale
- **Historique** : Timeline des actions et commentaires
- **Versions** : Liste des versions avec statuts d'approbation
- **Fallback simple** : Système d'approbation simple si pas de workflow

### 4. Fonctionnalités clés

#### Workflow structuré
- Étapes séquentielles avec validation
- Passage automatique à l'étape suivante après approbation
- Finalisation automatique du livrable quand toutes les étapes sont approuvées

#### Signatures électroniques
- Signature par dessin (canvas)
- Stockage sécurisé avec métadonnées
- Affichage des signatures dans l'historique
- Support multi-signatures

#### Versioning
- Création automatique de nouvelles versions
- Workflow indépendant par version
- Changelog pour chaque version
- Statut d'approbation par version

#### Historique et traçabilité
- Enregistrement de toutes les actions
- Commentaires contextuels
- Timestamps précis
- Identification des acteurs

## Fichiers créés/modifiés

### Nouveaux fichiers
- `src/components/SignaturePad.tsx` - Composant de signature électronique
- `src/app/api/portal/[token]/deliverables/[id]/approval/route.ts` - API workflow
- `src/app/api/portal/[token]/deliverables/[id]/versions/route.ts` - API versions

### Fichiers modifiés
- `prisma/schema.prisma` - Ajout des modèles d'approbation
- `src/app/portal/[token]/page.tsx` - Interface workflow dans le portail
- `src/app/api/portal/[token]/deliverables/route.ts` - Remplacement console.error par logger

## Utilisation

### Pour les clients (Portail)

1. **Accéder à un livrable** : Cliquer sur un livrable dans l'onglet "Livrables"
2. **Voir le workflow** : Le workflow d'approbation s'affiche automatiquement
3. **Approuver une étape** :
   - Ajouter un commentaire (optionnel)
   - Cliquer sur "Approuver"
   - Optionnellement ajouter une signature
4. **Demander une révision** : Utiliser le bouton "Révision" avec commentaires
5. **Rejeter** : Utiliser le bouton "Rejeter" avec commentaires obligatoires

### Pour les administrateurs (à venir)

Les APIs permettent de créer des workflows personnalisés via :
- POST `/api/portal/[token]/deliverables/[id]/approval` avec configuration des étapes

## Prochaines étapes recommandées

1. **Interface admin** : Créer une interface pour configurer les workflows
2. **Notifications** : Notifier les clients quand une étape est prête
3. **Email de signature** : Envoyer des liens de signature par email
4. **PDF de signature** : Générer des PDFs avec signatures intégrées
5. **Approbations parallèles** : Implémenter le workflow `parallel`
6. **Délais d'approbation** : Ajouter des deadlines avec alertes
7. **Rappels automatiques** : Envoyer des rappels pour approbations en attente

## Migration Prisma

Pour appliquer les changements à la base de données :

```bash
npx prisma migrate dev --name add_approval_workflow
```

Ou en production :

```bash
npx prisma migrate deploy
```

## Impact

✅ **Résout le problème** : Retards dus aux approbations non structurées
✅ **Traçabilité complète** : Historique de toutes les approbations
✅ **Signatures légales** : Signatures électroniques avec métadonnées
✅ **Workflow professionnel** : Processus structuré et clair
✅ **Versioning** : Gestion des révisions avec approbations

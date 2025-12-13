# Système de Workflow de Révision Structuré

## Vue d'ensemble

Ce système implémente un workflow de révision structuré complet pour les livrables clients, incluant :
- **Workflow de révision structuré** : Gestion des processus de révision avec étapes définies
- **Approbation multi-niveaux** : Système hiérarchique d'approbation avec plusieurs niveaux
- **Versioning de fichiers avec commentaires** : Suivi des versions avec commentaires détaillés
- **Checklist qualité** : Vérification systématique de la qualité des livrables

## Modèles de données

### RevisionWorkflow
Gère le workflow de révision pour une version de livrable.
- `workflowType`: Type de workflow (structured, simple, parallel)
- `currentLevel`: Niveau actuel dans le processus d'approbation
- `status`: État du workflow (draft, in_review, revision_requested, approved, rejected)
- `revisionRound`: Numéro du round de révision actuel

### ApprovalLevel
Représente un niveau d'approbation dans le workflow multi-niveaux.
- `levelNumber`: Ordre hiérarchique (1, 2, 3...)
- `approverType`: Type d'approbateur (client, employee, manager, director, specific_user)
- `minApprovers` / `maxApprovers`: Nombre d'approbateurs requis
- `canDelegate`: Possibilité de déléguer l'approbation
- `deadline`: Date limite pour cette approbation

### LevelApprover
Gère les approbateurs individuels pour un niveau.
- `status`: État de l'approbation (pending, approved, rejected, delegated)
- `delegatedTo`: Personne à qui l'approbation a été déléguée

### VersionComment
Commentaires sur les versions de fichiers.
- `commentType`: Type de commentaire (general, revision_request, approval_note, quality_issue)
- `fileReference`: Référence à une partie spécifique du fichier
- `parentCommentId`: Pour les réponses aux commentaires (threading)
- `isResolved`: Indique si le commentaire a été résolu

### QualityChecklist
Checklist de qualité pour un workflow.
- `overallScore`: Score global (0-100)
- `status`: État de la checklist (pending, in_progress, passed, failed)

### QualityCheck
Item individuel de la checklist qualité.
- `category`: Catégorie (design, content, technical, accessibility, performance, legal, other)
- `criteria`: Critères de vérification
- `status`: État (pending, passed, failed, n_a)
- `score`: Score pour cet item (0-100)
- `evidence`: Preuves (screenshots, fichiers, etc.)

## APIs

### POST `/api/admin/deliverables/[id]/revision-workflow`
Crée un workflow de révision structuré pour un livrable.

**Body:**
```json
{
  "workflowType": "structured",
  "levels": [
    {
      "levelNumber": 1,
      "name": "Révision initiale",
      "approverType": "client",
      "approverName": "John Doe",
      "isRequired": true,
      "minApprovers": 1,
      "deadline": "2024-12-31T23:59:59Z"
    }
  ],
  "checklistTemplateId": "optional-template-id"
}
```

### POST `/api/admin/deliverables/[id]/revision-workflow/levels/[levelId]`
Approuve, rejette ou demande une révision pour un niveau.

**Body:**
```json
{
  "action": "approve", // approve, reject, request_revision
  "comments": "Commentaires optionnels",
  "delegatedTo": "Nom si délégation"
}
```

### GET `/api/admin/deliverables/[id]/versions/[versionId]/comments`
Récupère tous les commentaires d'une version.

### POST `/api/admin/deliverables/[id]/versions/[versionId]/comments`
Crée un commentaire sur une version.

**Body:**
```json
{
  "commentType": "general",
  "content": "Commentaire",
  "fileReference": "Page 3, ligne 10",
  "parentCommentId": "optional-parent-id",
  "attachments": ["url1", "url2"]
}
```

### PATCH `/api/admin/deliverables/[id]/versions/[versionId]/comments`
Résout un commentaire.

**Body:**
```json
{
  "commentId": "comment-id",
  "resolved": true
}
```

### GET `/api/admin/deliverables/[id]/quality-checklist`
Récupère la checklist qualité d'un livrable.

### POST `/api/admin/deliverables/[id]/quality-checklist`
Met à jour un item de la checklist.

**Body:**
```json
{
  "checkId": "check-id",
  "status": "passed",
  "notes": "Notes optionnelles",
  "evidence": ["url1", "url2"],
  "score": 95
}
```

## Flux de travail

### 1. Création d'un workflow
1. Un admin crée un workflow de révision structuré pour un livrable
2. Définit les niveaux d'approbation avec leurs approbateurs
3. Optionnellement, ajoute une checklist qualité

### 2. Processus d'approbation multi-niveaux
1. Le workflow démarre au niveau 1
2. Les approbateurs du niveau 1 sont notifiés
3. Chaque approbateur peut :
   - Approuver le niveau
   - Rejeter le niveau
   - Demander une révision
   - Déléguer à quelqu'un d'autre (si autorisé)
4. Une fois le nombre minimum d'approbateurs requis atteint, le workflow passe au niveau suivant
5. Le processus continue jusqu'à ce que tous les niveaux soient approuvés

### 3. Rounds de révision
1. Si une révision est demandée, un nouveau round est créé
2. Le workflow revient au niveau 1
3. Les changements demandés sont documentés
4. Le processus recommence

### 4. Commentaires sur les versions
1. Les utilisateurs peuvent ajouter des commentaires sur une version
2. Les commentaires peuvent être liés à des parties spécifiques du fichier
3. Les commentaires peuvent avoir des réponses (threading)
4. Les commentaires peuvent être marqués comme résolus

### 5. Checklist qualité
1. La checklist qualité est vérifiée parallèlement au processus d'approbation
2. Chaque item peut être marqué comme passé, échoué ou non applicable
3. Des preuves peuvent être attachées à chaque item
4. Un score global est calculé automatiquement

## Prochaines étapes

- [ ] Créer l'interface utilisateur pour gérer les workflows
- [ ] Ajouter les notifications pour les approbateurs
- [ ] Implémenter les templates de checklist qualité
- [ ] Ajouter la visualisation des commentaires dans l'interface
- [ ] Créer un dashboard de suivi des workflows

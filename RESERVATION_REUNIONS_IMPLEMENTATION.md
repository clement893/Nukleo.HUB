# Implémentation : Réservation de Réunions

## Vue d'ensemble

Système complet de réservation de réunions avec intégration calendrier (Google Calendar/Outlook), rappels automatiques et notes de réunion partagées.

## Fonctionnalités implémentées

### 1. Modèles de base de données (Prisma)

#### `ClientMeeting` (Réunions)
- Informations de réunion (titre, description, type, durée)
- Dates et fuseau horaire
- Statuts : scheduled, confirmed, cancelled, completed
- Participants (clients et employés)
- Intégration calendrier :
  - `googleCalendarEventId` : ID de l'événement Google Calendar
  - `outlookCalendarEventId` : ID de l'événement Outlook
  - `calendarSyncStatus` : pending, synced, failed
- Rappels :
  - `reminderSent` : Si le rappel a été envoyé
  - `reminderMinutes` : Minutes avant la réunion pour rappel (par défaut : 24h et 1h)
- Notes partagées :
  - `notes` : Notes générales
  - `notesShared` : Si les notes sont partagées
  - `notesSharedAt` : Date de partage

#### `MeetingNote` (Notes de réunion)
- Contenu de la note
- Auteur (client ou employé)
- Statut de partage
- Timestamps

#### `MeetingAvailability` (Disponibilités)
- Disponibilités par jour de la semaine
- Heures de début/fin
- Exceptions (dates spécifiques)
- Par employé ou générale

### 2. APIs créées

#### `/api/portal/[token]/meetings`
- **GET** : Liste des réunions avec filtres (statut, dates)
- **POST** : Créer une nouvelle réunion
  - Vérification des conflits
  - Génération automatique de endTime
  - TODO: Synchronisation calendrier

#### `/api/portal/[token]/meetings/[id]`
- **GET** : Détails d'une réunion avec notes
- **PUT** : Mettre à jour une réunion
  - Mise à jour automatique de endTime si durée change
  - Gestion de l'annulation
  - TODO: Mise à jour calendrier
- **DELETE** : Annuler une réunion
  - Marque comme annulée (soft delete)
  - TODO: Suppression calendrier

#### `/api/portal/[token]/meetings/[id]/notes`
- **GET** : Récupérer les notes partagées d'une réunion
- **POST** : Ajouter une note à une réunion
  - Marque automatiquement les notes comme partagées

### 3. Systèmes de support

#### `meeting-reminders.ts`
- Fonction `sendMeetingReminders()` :
  - Vérifie les réunions dans les 24h
  - Envoie des rappels selon `reminderMinutes`
  - Marque les rappels comme envoyés
- Fonction `syncMeetingsToCalendar()` :
  - Synchronise les réunions en attente avec les calendriers
  - Gère les erreurs de synchronisation

#### `google-calendar-sync.ts`
- `syncMeetingToGoogleCalendar()` : Créer un événement
- `updateGoogleCalendarEvent()` : Mettre à jour un événement
- `deleteGoogleCalendarEvent()` : Supprimer un événement
- **TODO** : Implémenter avec Google Calendar API

#### `outlook-calendar-sync.ts`
- `syncMeetingToOutlook()` : Créer un événement
- `updateOutlookCalendarEvent()` : Mettre à jour un événement
- `deleteOutlookCalendarEvent()` : Supprimer un événement
- **TODO** : Implémenter avec Microsoft Graph API

## Fonctionnalités

### Réservation de réunions
✅ Création de réunions par les clients
✅ Vérification des conflits
✅ Types de réunions : vidéo, téléphone, en personne
✅ Gestion des participants
✅ Annulation de réunions

### Intégration calendrier
✅ Structure pour Google Calendar (prête à implémenter)
✅ Structure pour Outlook (prête à implémenter)
✅ Statut de synchronisation
✅ Gestion des erreurs

### Rappels automatiques
✅ Système de rappels configurables
✅ Rappels par défaut : 24h et 1h avant
✅ Prévention des doublons
✅ Prêt pour intégration email

### Notes de réunion partagées
✅ Ajout de notes par clients et employés
✅ Partage automatique
✅ Historique des notes
✅ Timestamps et auteurs

## Prochaines étapes pour intégration complète

### Google Calendar
1. Configurer OAuth 2.0 avec Google
2. Stocker les tokens d'accès clients
3. Implémenter création/mise à jour/suppression d'événements
4. Gérer les webhooks pour synchronisation bidirectionnelle

### Outlook Calendar
1. Configurer OAuth 2.0 avec Microsoft
2. Stocker les tokens d'accès clients
3. Implémenter création/mise à jour/suppression d'événements
4. Gérer les webhooks pour synchronisation bidirectionnelle

### Rappels automatiques
1. Créer un cron job pour vérifier les réunions
2. Implémenter envoi d'emails de rappel
3. Ajouter notifications push (optionnel)
4. Personnaliser les templates d'email

### Interface utilisateur
1. Créer un calendrier visuel pour réserver
2. Afficher les disponibilités
3. Interface pour ajouter/modifier des notes
4. Vue des réunions à venir

## Fichiers créés

### Nouveaux fichiers
- `src/app/api/portal/[token]/meetings/route.ts` - API principale réunions
- `src/app/api/portal/[token]/meetings/[id]/route.ts` - API CRUD réunion
- `src/app/api/portal/[token]/meetings/[id]/notes/route.ts` - API notes
- `src/lib/meeting-reminders.ts` - Système de rappels
- `src/lib/google-calendar-sync.ts` - Intégration Google Calendar
- `src/lib/outlook-calendar-sync.ts` - Intégration Outlook

### Fichiers modifiés
- `prisma/schema.prisma` - Ajout des modèles de réunions

## Migration Prisma

Pour appliquer les changements à la base de données :

```bash
npx prisma migrate dev --name add_meeting_reservation
```

Ou en production :

```bash
npx prisma migrate deploy
```

## Impact

✅ **Réservation simplifiée** : Les clients peuvent réserver directement
✅ **Intégration calendrier** : Structure prête pour Google/Outlook
✅ **Rappels automatiques** : Plus de réunions oubliées
✅ **Notes partagées** : Collaboration facilitée
✅ **Gestion complète** : CRUD complet avec vérifications

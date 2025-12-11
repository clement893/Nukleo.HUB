# Nukleo Hub - TODO

## Page d'accueil - Centre de commande
- [x] Navigation latérale permanente avec logo et menu
- [x] Barre de recherche universelle (⌘K)
- [x] Widget indicateurs clés (opportunités, pipeline, revenus, conversion)
- [x] Widget répartition pipeline (graphique)
- [x] Widget activité récente
- [x] Widget nouveaux contacts
- [x] Widget échéances
- [x] Widget agenda (aperçu semaine)
- [ ] Mode personnalisation (glisser-déposer widgets)
- [x] Thème sombre moderne
- [x] Profil utilisateur dans la sidebar

## Espaces (à développer ultérieurement)
- [ ] Espace Commercial (Pipeline Kanban)
- [ ] Espace Clients (Organisations)
- [ ] Espace Contacts (Réseau)
- [ ] Espace Projets (Mandats)
- [ ] Espace Équipes (Départements)
- [ ] Espace Agenda (Calendrier)

## Pipeline de vente (Kanban)
- [x] Schéma de base de données pour les opportunités
- [x] Page pipeline Kanban avec colonnes par étape
- [x] Cartes d'opportunités avec informations clés
- [x] Import des données CSV
- [x] Filtres par région, segment, responsable

## Page Contacts
- [x] Schéma de base de données pour les contacts
- [x] API REST pour les contacts (GET, POST, PATCH, DELETE)
- [x] Page contacts avec liste et vue grille
- [x] Filtres par région, domaine d'emploi, cercles
- [x] Recherche par nom, entreprise, poste
- [ ] Fiche contact détaillée
- [x] Import des données CSV

## Page Projets
- [x] Schéma de base de données pour les projets
- [x] API REST pour les projets (GET, POST, PATCH, DELETE)
- [x] Page projets avec liste et vue grille
- [x] Filtres par statut, type, département, année
- [x] Recherche par nom, client
- [x] Import des données CSV (115 projets)

## Corrections
- [x] Corriger l'import Sidebar dans la page contacts

## Pipeline - Modale de modification
- [x] Modale de modification d'opportunité au clic sur une carte
- [x] Formulaire avec tous les champs de l'opportunité
- [x] Sauvegarde et mise à jour en temps réel

## Liaison Contact-Opportunité
- [x] Sélecteur de contact avec recherche dans la modale opportunité
- [x] Relation contact-opportunité dans le schéma de base de données
- [x] Affichage du contact lié dans les cartes Kanban

## Page Entreprises
- [x] Schéma de base de données pour les entreprises
- [x] API REST pour les entreprises (GET, POST, PATCH, DELETE)
- [x] Page entreprises avec vue grille et liste
- [x] Filtres par type, industrie, région
- [x] Recherche par nom, site web
- [x] Affichage des informations clés (logo, description, contacts, réseaux sociaux)
- [x] Import des données CSV (244 entreprises importées)

## Automatisation Favicons
- [x] API route pour récupérer les favicons via Google Favicon API
- [x] Script pour mettre à jour les logos des entreprises depuis leurs sites web (218 logos mis à jour)
- [x] Affichage des favicons comme logos d'entreprises

## Tableau de bord Commercial
- [x] API pour les statistiques (total opportunités, pipeline, montant gagné, taux conversion)
- [x] 4 cartes de statistiques principales
- [x] Graphique de répartition par étape avec montants
- [x] Liste des opportunités récentes
- [x] Actualisation en temps réel (auto-refresh 30s)

## Page d'accueil - Vraies données
- [x] API pour les données de la page d'accueil (KPI, activité, contacts, échéances)
- [x] Mise à jour de la page d'accueil avec les vraies données de la base

## Espace Équipes (Départements)
- [x] Schéma de base de données (Employee, Task avec zones)
- [x] 3 départements : Lab, Bureau, Studio
- [x] 4 zones par département : Current, Shelf, Storage, Dock
- [x] Gestion des employés par département
- [x] Chaque employé = 1 seule tâche en cours (Current)
- [x] Tâches liées aux projets existants
- [x] Drag & drop entre les zones
- [x] Modales d'ajout/modification employés et tâches

## Module Événements et Calendrier
- [x] Schéma de base de données pour les événements
- [x] API REST pour les événements (GET, POST, PATCH, DELETE)
- [x] Vue calendrier mensuelle
- [x] Vue calendrier hebdomadaire (vue liste)
- [x] Vue liste des événements
- [x] Types d'événements (réunion, échéance, rappel, appel, autre)
- [x] Modale d'ajout/modification d'événement
- [x] Liaison avec contacts, opportunités, projets (préparé dans le schéma)

## Calendrier - Vues additionnelles
- [x] Vue Semaine avec grille horaire
- [x] Vue Jour avec créneaux horaires détaillés

## Bugs
- [x] Page Entreprises : débordement horizontal (ne respecte pas l'écran)

## Refonte page Équipes - UX/UI
- [x] Hiérarchie visuelle : Current dominant (50%), autres zones en panneau
- [x] Employé au centre : colonnes par employé avec leur tâche
- [x] Flux de production : barre visuelle Shelf → Current → Dock
- [x] Indicateurs de santé : capacité, vélocité, alertes par département
- [x] Micro-interactions : animations drag & drop, feedback visuel
- [x] Avatars améliorés : photos/avatars stylisés avec statut

## Fiches détaillées
- [x] Fiche Contact détaillée (page dédiée)
- [x] Fiche Organisation avec onglets (Équipe, Opportunités, Mandats, Documents, Historique)
- [x] Page détaillée Projet avec onglets (Détails, Équipe, Tâches, Discussion, Historique)

## Export et Import
- [x] Export CSV contacts
- [x] Export CSV opportunités
- [x] Export CSV organisations
- [ ] Upload photos de profil contacts

## Enrichissement intelligent
- [x] Analyse automatique du site web d'une organisation
- [x] Extraction description, industrie, insights
- [x] Récupération logo automatique

## Gestion documentaire
- [x] Upload fichiers par organisation
- [x] Liste des documents attachés
- [x] Téléchargement des documents

## Historique et traçabilité
- [x] Timeline des activités sur chaque entité
- [x] Notes et commentaires
- [x] Horodatage des modifications

## Conversion Opportunité → Projet
- [x] Bouton de conversion dans la fiche opportunité
- [x] Transfert automatique des informations
- [x] Lien maintenu entre opportunité et projet

## Page détaillée Projet améliorée
- [x] Schéma et API pour les milestones (grandes tâches)
- [x] Affichage des milestones dans la page projet
- [x] Création/modification de milestones
- [x] Progression visuelle des milestones

## Gestion des tâches dans la page projet
- [x] Modale de détails des tâches
- [x] Formulaire de création de tâche depuis la page projet
- [x] Bouton "Envoyer vers Équipes" (ajoute la tâche dans le Shelf du département)
- [x] Sélection du département cible

## Suivi d'avancement des tâches
- [x] Champ status (todo, in_progress, done) dans le schéma
- [x] Affichage du statut avec badge coloré
- [x] Changement de statut en un clic
- [x] Formulaire de modification de tâche
- [ ] Historique des changements de statut

## Bugs
- [x] Bouton "Créer" dans le formulaire de création de tâche ne fonctionne pas (API GET manquait le filtre projectId)

## Mode clair/sombre
- [x] Créer ThemeProvider avec contexte React
- [x] Ajouter bouton de toggle dans la sidebar
- [x] Définir les variables CSS pour les deux modes
- [x] Persister le choix dans localStorage

## Timeline dans les projets
- [x] Améliorer l'onglet Historique avec une vraie timeline visuelle
- [x] Afficher les événements chronologiquement
- [x] Icônes et couleurs par type d'événement

## Section Témoignages
- [x] Créer le modèle Testimonial dans Prisma
- [x] Créer l'API CRUD pour les témoignages
- [x] Créer la page Témoignages dans Réseau
- [x] Importer les données du CSV (29 témoignages importés)
- [x] Ajouter le lien dans la navigation

## Onglet Timeline projet
- [x] Ajouter onglet Timeline dans les tabs
- [x] Frise chronologique avec tâches et milestones par date
- [x] Affichage visuel des deadlines et progression

## Bugs
- [ ] Bouton Enregistrer ne fonctionne pas dans le formulaire de modification de tâche

## Page gestion des employés
- [x] Créer la page /teams/employees
- [x] Liste des employés avec filtres par département
- [x] Formulaire d'ajout/modification d'employé
- [x] Attribution aux départements (Lab, Bureau, Studio)
- [x] Ajouter le lien dans la navigation

## Module calcul de charge
- [x] API pour calculer la charge par employé et département
- [x] Page de visualisation de la charge à venir
- [x] Graphiques de répartition par département
- [x] Timeline de charge par semaine/mois
- [x] Indicateurs de surcharge/sous-charge

## Bugs
- [x] Pages Employés et Charge de travail passent sous le menu sidebar

## Capacité et heures
- [x] Ajouter champ capacité (heures/semaine) aux employés
- [x] Ajouter champ heures estimées aux tâches
- [x] Mettre à jour le formulaire employé
- [x] Mettre à jour le formulaire tâche
- [x] Recalculer la charge en heures au lieu de points

## Photos des employés
- [x] Ajouter champ photoUrl au schéma Employee (déjà existant)
- [x] Créer API d'upload de photos
- [x] Ajouter composant d'upload dans le formulaire employé
- [x] Afficher les photos sur les cartes employés
- [x] Afficher les photos dans la page Charge de travail

## Bugs
- [x] La photo ne s'affiche pas quand on l'ajoute à un employé (configuré AWS S3)


## Flow Transformation Numérique
- [x] Créer la page /transformation avec le template de flow
- [x] Définir les phases du flow (Diagnostic, Stratégie, Design, Dev, IA, Formation, Déploiement, Suivi)
- [x] Ajouter la navigation dans la sidebar
- [x] Pousser vers GitHub


## Enrichissement Module Transformation
- [x] Schéma DB pour les phases de projet (ProjectPhase)
- [x] API CRUD pour les phases de projet
- [x] Interface de personnalisation des phases par projet
- [x] Générateur de devis basé sur les phases sélectionnées
- [x] Liaison template transformation aux projets existants
- [x] Pousser vers GitHub


## Time Tracking
- [x] Schéma DB pour les entrées de temps (TimeEntry)
- [x] API CRUD pour le time tracking
- [x] Bouton start/stop sur les tâches
- [x] Page employé avec logs de temps
- [x] Statistiques de temps par employé
- [x] Pousser vers GitHub


## Rapports de Facturation
- [x] API pour générer les rapports de facturation mensuels
- [x] Page de rapports avec filtres (mois, projet, employé)
- [x] Vue par projet avec détail des heures par employé
- [x] Vue par employé avec détail des heures par projet
- [x] Export CSV des rapports
- [x] Export PDF des rapports
- [x] Navigation dans la sidebar
- [x] Pousser vers GitHub


## Correctifs
- [x] Fix: clic sur le nom des employés pour accéder au profil

## Hub Communication Numérique
- [x] Schéma DB pour les clients communication (CommunicationClient)
- [x] Schéma DB pour les médias sociaux (SocialMediaAccount)
- [x] Schéma DB pour les infolettres (Newsletter)
- [x] Schéma DB pour les campagnes (Campaign)
- [x] Schéma DB pour les accès/liens (ClientAccess)
- [x] Schéma DB pour les communications client (ClientMessage)
- [x] APIs CRUD pour tous les modules
- [x] Page principale du Hub Communication
- [x] Module Médias Sociaux
- [x] Module Infolettres
- [x] Module Campagnes Numériques
- [x] Module Accès & Liens
- [x] Module Tâches Client
- [x] Module Communication Client
- [x] Navigation dans la sidebar
- [x] Pousser vers GitHub


## Onboarding Employés
- [x] Schéma DB pour les étapes d'onboarding (OnboardingStep)
- [x] Schéma DB pour les politiques internes (Policy)
- [x] Schéma DB pour le suivi de progression (OnboardingProgress)
- [x] APIs CRUD pour l'onboarding
- [x] Page d'onboarding avec étapes personnalisées par rôle
- [x] Présentation de la plateforme (tour guidé)
- [x] Affichage et validation des politiques internes
- [x] Page admin pour gérer les étapes et politiques
- [x] Pousser vers GitHub

## Chat IA
- [x] API pour le chat IA avec contexte Nukleo
- [x] Interface de chat flottante
- [x] Recherche dans les politiques et documentation
- [x] Pousser vers GitHub


## Leo - Assistant IA Nukleo
- [x] API pour Leo avec accès à toutes les données (projets, contacts, employés, tâches)
- [x] Page dédiée avec interface de chat complète
- [x] Contexte enrichi avec toutes les données Nukleo
- [x] Suggestions intelligentes et actions rapides
- [x] Navigation dans la sidebar
- [x] Pousser vers GitHub


## Gestion Documentaire
- [x] Schéma DB pour les documents (Document)
- [x] Schéma DB pour les liens document-tâche (TaskDocument)
- [x] API CRUD pour les documents
- [x] Hub de documents dans les projets
- [x] Attachement de documents aux tâches
- [x] Synchronisation automatique tâche -> projet
- [x] Upload de fichiers vers S3
- [x] Pousser vers GitHub


## Système de Tickets & Portail Client
- [x] Schéma DB pour les portails clients (ClientPortal avec token unique)
- [x] Schéma DB pour les tickets (Ticket)
- [x] API pour le portail client (accès public avec token)
- [x] API CRUD pour les tickets
- [x] Page portail client public (/portal/[token])
- [x] Affichage des projets du client
- [x] Formulaire de soumission de ticket
- [x] Historique des tickets et réponses
- [x] Page admin de gestion des tickets
- [x] Génération d'URL unique par client
- [x] Pousser vers GitHub


## Page Clients (Réseau)
- [x] Lier ClientPortal aux entreprises (companyId)
- [x] API pour récupérer les clients avec entreprise, projets, contacts
- [x] Page /reseau/clients avec liste des clients
- [x] Fiche client avec entreprise, projets associés, contacts liés
- [x] Liaison avec le portail client existant
- [x] Navigation dans le menu Réseau
- [x] Pousser vers GitHub

## Feuilles de Temps avec Approbation
- [x] Ajouter modèle WeeklyTimesheet avec statut d'approbation au schéma DB
- [x] Créer API pour récupérer les feuilles de temps par semaine
- [x] Créer API pour modifier les entrées de temps (si non approuvées)
- [x] Créer API admin pour approuver/rejeter les feuilles de temps
- [x] Page feuilles de temps dans le portail employé (vue par semaine)
- [x] Formulaire de modification des entrées de temps
- [x] Page admin pour consulter et approuver les feuilles de temps
- [x] Filtres par employé, semaine, statut dans l'admin
- [x] Pousser vers GitHub

## Notifications en Temps Réel - Portail Employé
- [x] Créer modèle EmployeeNotification dans le schéma DB
- [x] Créer API pour récupérer les notifications
- [x] Créer API pour marquer les notifications comme lues
- [x] Créer API pour créer des notifications (interne)
- [x] Composant cloche de notifications dans le header du portail
- [x] Panel de notifications avec liste et actions
- [x] Intégrer notifications aux feuilles de temps (approbation/rejet)
- [x] Intégrer notifications aux nouvelles tâches assignées
- [x] Badge de compteur de notifications non lues
- [x] Pousser vers GitHub

## Connexion Google OAuth
- [x] Ajouter modèle User/Session au schéma Prisma
- [x] Créer API /api/auth/login pour initier OAuth
- [x] Créer API /api/auth/login/callback pour le callback
- [x] Créer API /api/auth/me pour récupérer l'utilisateur connecté
- [x] Créer API /api/auth/logout pour la déconnexion
- [x] Page de connexion avec bouton Google
- [x] Afficher l'utilisateur connecté dans le Sidebar
- [x] Bouton de déconnexion dans le Sidebar
- [x] Pousser vers GitHub

## Système de Permissions Obligatoire
- [x] Configurer clement@nukleo.com comme super admin
- [x] Créer middleware de protection des routes
- [x] Créer page admin de gestion des utilisateurs
- [x] Ajouter gestion des rôles (super_admin, admin, user)
- [x] Protéger toutes les pages avec le middleware
- [x] Rediriger vers /login si non connecté
- [x] Pousser vers GitHub

## Système de Permissions Obligatoire
- [x] Configurer clement@nukleo.com comme super admin
- [x] Créer middleware de protection des routes
- [x] Créer page admin de gestion des utilisateurs
- [x] Ajouter gestion des rôles (super_admin, admin, user)
- [x] Protéger toutes les pages avec le middleware
- [x] Rediriger vers /login si non connecté
- [x] Pousser vers GitHub

## Invitations et Contrôle d'Accès Granulaire
- [x] Créer modèle Invitation dans le schéma DB
- [x] Créer modèle UserAccess pour les permissions granulaires
- [x] API pour envoyer des invitations par email
- [x] API pour accepter une invitation
- [x] API pour gérer les accès utilisateur (clients, projets, espaces)
- [x] Interface d'invitation dans l'admin
- [x] Interface de gestion des accès par utilisateur
- [x] Envoi d'email d'invitation avec lien
- [x] Pousser vers GitHub

## Amélioration Gestion des Accès - Sélection Spécifique
- [x] API pour récupérer la liste des clients (existante)
- [x] API pour récupérer la liste des projets (existante)
- [x] Sélecteur de clients spécifiques dans le modal
- [x] Sélecteur de projets spécifiques dans le modal
- [x] Pousser vers GitHub

## Bug Fix - Menu latéral disparaît
- [x] Corriger le menu qui disparaît sur /admin/users
- [x] Pousser vers GitHub

## Suppression des Portails Clients
- [ ] Ajouter API DELETE pour les portails clients
- [ ] Ajouter bouton de suppression dans l'interface
- [ ] Pousser vers GitHub

## Centre de Notifications Complet
- [x] Ajouter modèle NotificationPreferences au schéma DB
- [x] API pour gérer les préférences de notifications
- [x] Page centre de notifications dans le portail employé
- [x] Page paramètres de notifications dans le portail employé
- [x] Page admin de gestion des notifications
- [x] Pousser vers GitHub

## Hub de Communication - Agence du Futur
- [ ] Analyser la structure actuelle du Hub de Comm
- [ ] Créer modèles DB : ContentCalendar, CommunicationBrief, Strategy, Campaign
- [ ] API calendrier éditorial (CRUD + vue mensuelle)
- [ ] API briefs de projets de communication
- [ ] API stratégies de communication
- [ ] API campagnes et analytics
- [ ] Interface Dashboard Hub de Comm
- [ ] Interface Calendrier Éditorial
- [ ] Interface Briefs de Projets
- [ ] Interface Stratégies
- [ ] Interface Campagnes
- [ ] Interface Analytics et Reporting
- [ ] Pousser vers GitHub

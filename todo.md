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

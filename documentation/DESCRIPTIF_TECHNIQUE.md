# Descriptif Complet de l'Application Anistour Fleet Management

## 1. Introduction
L'application **Anistour** est une plateforme de gestion de flotte automobile conçue spécifiquement pour les besoins de transport en Algérie. Elle permet de piloter la rentabilité, d'assurer le suivi technique (entretiens) et de sécuriser les flux financiers entre les agences et le siège.

## 2. Architecture Technique
- **Frontend** : React.js avec TypeScript pour une interface robuste et typée.
- **Styling** : Tailwind CSS pour un design moderne, sombre (dark mode) et premium ("Rich Aesthetics").
- **State Management** : Zustand pour une gestion d'état fluide et réactive.
- **Base de Données** : Supabase (PostgreSQL) assurant la persistance des données et l'authentification.
- **Temps Réel** : Utilisation des "Supabase Realtime Subscriptions" pour synchroniser instantanément les modifications entre tous les postes PC.
- **Stockage** : Supabase Storage pour les photos de preuves et signatures.

## 3. Fonctionnalités Principales

### A. Dashboard Décisionnel (Admin Only)
- **Live Profit** : Affichage en temps réel de la recette du jour, des dépenses engagées et du cash global disponible.
- **Indicateurs Clés (KPI)** : Revenus totaux, charges globales, bénéfice net et bénéfice mensuel moyen.
- **Alertes Critiques** : Système de notification clignotante pour les véhicules approchant d'une échéance kilométrique (vidange, entretien).

### B. Gestion de Flotte & BI (Business Intelligence)
- **Fiches Véhicules** : Suivi complet (immatriculation, type, prix d'achat, simulateur de prix de vente).
- **Analyse KM (Nouveau)** : Graphiques linéaires comparant l'intensité d'utilisation des véhicules par mois pour détecter les surexploitations.
- **Calcul de Rentabilité** : Algorithme calculant la marge d'exploitation nette moins la perte de valeur (amortissement) pour chaque véhicule.

### C. Gestion Documentaire (GED)
- Stockage numérique des papiers (Assurance, Carte Grise, Vignette).
- Système d'alertes visuelles (Vert/Orange/Rouge) selon la date d'expiration des documents.

### D. Contrôle Financier & Registre
- **Journal des Opérations** : Registre complet de toutes les entrées/sorties avec filtres avancés (Date, Véhicule, Type).
- **Validation Admin** : Toutes les saisies des agents sont mises en "Attente" et doivent être validées/modifiées par l'Admin avant d'impacter les caisses.

### E. Sécurité & Archivage
- **Signatures Numériques** : Capture de la signature manuscrite sur écran pour chaque opération financière.
- **Backup Local** : Exportation de l'intégralité de la base de données au format JSON (incluant images et signatures) pour conservation hors-ligne.
- **Purge Intelligente** : Capacité de vider le Cloud pour maintenir la rapidité tout en gardant les données archivées localement.

## 4. Réalisation
L'application a été réalisée selon une méthodologie agile, en privilégiant l'expérience utilisateur (UX) sur mobile et PC. Le design utilise un code couleur strict :
- **Rouge/Noir** : Identité visuelle Anistour.
- **Emeraude** : Flux positifs (Recettes).
- **Ambre** : Éléments en attente ou alertes modérées.

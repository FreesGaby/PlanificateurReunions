-- Script SQL d'initialisation pour la base de données du projet

-- Suppression des tables existantes pour éviter les conflits
DROP TABLE IF EXISTS utilisateurs CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS organisateurs CASCADE;
DROP TABLE IF EXISTS reunions CASCADE;
DROP TABLE IF EXISTS propositions CASCADE;
DROP TABLE IF EXISTS reponses CASCADE;

-- Création des tables

-- ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'participant';
CREATE TABLE IF NOT EXISTS utilisateurs (
    id SERIAL PRIMARY KEY, 
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('organisateur', 'participant'))
);

-- Table pour les organisateurs
CREATE TABLE organisateurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL, 
    role VARCHAR(20) NOT NULL CHECK (role IN ('organisateur', 'participant'))
);

-- Table pour les participants
CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    inscrit BOOLEAN DEFAULT FALSE
);

-- Table pour les réunions
CREATE TABLE reunions (
    id SERIAL PRIMARY KEY,
    organisateur_id INTEGER REFERENCES organisateurs(id) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les propositions de créneaux
CREATE TABLE propositions (
    id SERIAL PRIMARY KEY,
    reunion_id INTEGER REFERENCES reunions(id) ON DELETE CASCADE,
    date_debut TIMESTAMP NOT NULL,
    date_fin TIMESTAMP NOT NULL
);

-- Table pour les réponses des participants aux propositions
CREATE TABLE reponses (
    id SERIAL PRIMARY KEY,
    proposition_id INTEGER REFERENCES propositions(id) ON DELETE CASCADE,
    participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
    disponible BOOLEAN NOT NULL
);

-- Insertion de données initiales pour une démonstration immédiate

-- Organisateur
INSERT INTO organisateurs (nom, email, mot_de_passe, role)
VALUES ('Imbert Gabriel', 'imbertgabriel1@gmail.com', 'disney20005', 'organisateur');

-- Participants (un inscrit et un non inscrit)
INSERT INTO participants (nom, email, inscrit)
VALUES
('Bob Martin', 'bob.martin@example.com', TRUE),
(NULL, 'charlie.anonyme@example.com', FALSE);

-- Réunion
INSERT INTO reunions (organisateur_id, titre, description)
VALUES (1, 'Réunion Projet Web', 'Discussion initiale sur le projet');

-- Propositions de créneaux
INSERT INTO propositions (reunion_id, date_debut, date_fin)
VALUES 
(1, '2025-03-01 10:00', '2025-03-01 11:00'),
(1, '2025-03-02 14:00', '2025-03-02 15:00');

-- Réponses des participants
INSERT INTO reponses (proposition_id, participant_id, disponible)
VALUES
(1, 1, TRUE),
(2, 1, FALSE),
(1, 2, TRUE),
(2, 2, TRUE);
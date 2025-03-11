// Importer les modules nécessaires
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const port = 4001;

function requireRole(role) {
    return (req, res, next) => {
        if (!req.session.user || req.session.user.role !== role) return res.status(403).send("Accès refusé");
        next();
    }
}

app.use(express.static(__dirname));

// Configurer la connexion à PostgreSQL
const pool = new Pool({
    user: 'postgres',                       // Remplacer par l'utilisateur PostgreSQL
    host: 'localhost',
    database: 'planificateur_reunions',
    password: 'motdepasse',                 // Remplacer par le mot de passe PostgreSQL
    port: 5432
});

pool.query("SELECT current_database(), current_schema();").then(result => {
    console.log("📌 Base et schéma utilisés :", result.rows);
}).catch(err => console.error("❌ Erreur de connexion :", err));


// Middleware pour parser les requêtes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configurer les sessions
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // true en prod avec HTTPS
}));

// Route pour l'inscription
app.post('/inscription', async (req, res) => {
    const { nom, email, mot_de_passe, role } = req.body;

    console.log("Données reçues :", req.body);
    console.log("Mot de passe reçu :", mot_de_passe);

    // Vérification du rôle
    if (!['organisateur', 'participant'].includes(role)) {
        return res.status(400).send('Rôle invalide.');
    }

    // Vérification de la validité du mot de passe
    const regexMotDePasse = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!regexMotDePasse.test(mot_de_passe)) {
        return res.status(400).send("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.");
    }

    try {

        const schemaCheck = await pool.query("SELECT current_schema();");
        console.log("📌 Schéma actuel utilisé par PostgreSQL :", schemaCheck.rows[0].current_schema);

        const tableExists = await pool.query("SELECT * FROM information_schema.tables WHERE table_name = 'organisateurs';");
        console.log("📌 La table 'organisateurs' existe-t-elle dans information_schema.tables ? :", tableExists.rows.length > 0);

        const tableExistsPgClass = await pool.query("SELECT relname FROM pg_class WHERE relname = 'organisateurs';");
        console.log("📌 La table 'organisateurs' existe-t-elle dans pg_class ? :", tableExistsPgClass.rows.length > 0);

        // Vérifier si l'utilisateur existe déjà
        await pool.query("SET search_path TO public;");
        const existUser = await pool.query('SELECT * FROM organisateurs WHERE email = $1', [email]);
        if (existUser.rows.length > 0) return res.status(400).send('Email déjà utillisé');

        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        await pool.query("SET search_path TO public;");
        const testTables = await pool.query("SELECT * FROM organisateurs LIMIT 1;");
        console.log("Test accès à la table organisateurs :", testTables.rows);

        // Insérer l'utilisateur
        await pool.query("SET search_path TO public;");
        await pool.query('INSERT INTO public.organisateurs (nom, email, mot_de_passe, role) VALUES ($1, $2, $3, $4)', [nom, email, hashedPassword, role]);
        res.redirect('/connexion');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur serveur');
    }
});

// Route pour la connexion
app.post('/connexion', async (req, res) => {
    const { email, mot_de_passe } = req.body;

    try {
        // Chercher l'utilisateur dans la BDD
        await pool.query("SET search_path TO public;");
        const user = await pool.query('SELECT * FROM organisateurs WHERE email = $1', [email]);

        if (user.rows.length === 0) return res.status(400).send('Email ou mot de passe incorrect');

        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(mot_de_passe, user.rows[0].mot_de_passe);
        if (!validPassword) return res.status(400).send('Email ou mot de passe incorrect');

        // Stocker l'utilisateur dans la session
        req.session.user = { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role  };
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur serveur');
    }
});

// Route pour déconnexion
app.get('/deconnexion', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Erreur lors de la déconnexion');
        }
        res.redirect('/connexion');
    });
});

app.get('/profil', (req, res) => {
    if (!req.session.user) return res.status(401).send('Non connecté');
    res.json(req.session.user);
});

app.get('/creer-reunion', requireRole('organisateur'), (req, res) => {
    res.send('Page de création de réunion');
});

// Démarrer le serveur
app.listen(port, () => {
    console.log('Serveur démarré sur http://localhost:${port}');
});
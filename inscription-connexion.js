// Importer les modules nécessaires
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const port = 4001;

app.use(express.static(__dirname));

// Configurer la connexion à PostgreSQL
const pool = new Pool({
    user: 'postgres',                       // Remplacer par l'utilisateur PostgreSQL
    host: 'localhost',
    database: 'planificateur_reunions',
    password: 'motdepasse',                 // Remplacer par le mot de passe PostgreSQL
    port: 5432
});

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
    const { nom, email, mot_de_passe } = req.body;

    try {
        // Vérifier si l'utilisateur existe déjà
        const existUser = await pool.query('SELECT * FROM organisateurs WHERE email = $1', [email]);
        if (existUser.rows.length > 0) return res.status(400).send('Email déjà utillisé');

        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        // Insérer l'utilisateur
        await pool.query('INSERT INTO organisateurs (nom, email, mot_de_passe) VALUES ($1, $2, $3)', [nom, email, hashedPassword]);
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
        const user = await pool.query('SELECT * FROM organisateurs WHERE email = $1', [email]);

        if (user.rows.length === 0) return res.status(400).send('Email ou mot de passe incorrect');

        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(mot_de_passe, user.rows[0].mot_de_passe);
        if (!validPassword) return res.status(400).send('Email ou mot de passe incorrect');

        // Stocker l'utilisateur dans la session
        req.session.user = { id: user.rows[0].id, email: user.rows[0].email };
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

// Démarrer le serveur
app.listen(port, () => {
    console.log('Serveur démarré sur http://localhost:${port}');
});
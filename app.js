const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

app.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});
Pour l'instant, pour tester, on peut simplement ouvrir les trois fichiers html sur le navigateur. 
Pour lancer app.js : 
- Faire node app.js dans le terminal
- Aller sur localhost:3000 dans le navigateur

Pour que la base de données marche, effectuer les commandes suivantes depuis le dossier racine du projet : 
- initdb /usr/local/var/postgres
- pg_ctl -D /usr/local/var/postgres start
- createuser -s postgres
- psql -U postgres -d planificateur_reunions -f sql/init.sql
(Les deux premières commandes peuvent échouer en fonction des appareils, ce n'est pas un problème, on peut effectuer les deux commandes suivantes)
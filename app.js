const ldap = require('ldap');
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const USER_MAIL = 'anaka-admin-test@cacom.fr'
const USER_PASSWORD = 'anakatest'

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});


server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);

  const client = ldap.createClient({
    url: 'ldap://10.10.10.10:389'
  });

  client.bind(USER_MAIL, USER_PASSWORD, (err, res) => {
    if (err) {
      console.log('Error during LDAP bind : ', err)
    }

    const opts = {
      // on recupere des trucs quand le sub est 'sub' ou 'one'. Avec le scope par défault ('base'), la recherche ne renvoit aucun résultat
      scope: 'sub',
      // ici faut liser les attributs qu'on souhaite récupéré. Si on omet ce champ, on recupere tout
      attributes: ['mail'],
      // on peut requeter un user en particulier de cette maniere par exemple :
      // filter: '(mail=c.meunier@cacom.fr)'
      // mais je comprend pas pourquoi je trouve pas d'user quand je filtre sur le mail dont on se sert pour se logger... C'est des logs particulier qui correspondent pas a un user en base ?
      filter: '(mail=c.meunier@cacom.fr)'
    }

    client.search('ou=Clichy, ou=Utilisateurs, DC=cacom, DC=fr', opts, (err, res) => {
      res.on('searchEntry', function(entry) {
        console.log(entry.object);
      });
      res.on('searchReference', function(referral) {
        console.log('referral: ' + referral.uris.join());
      });
      res.on('error', function(err) {
        console.error('error: ' + err.message);
      });
      res.on('end', function(result) {
        console.log('status: ' + result.status);
      });
    });
  })
});

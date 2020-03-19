const ldap = require('ldap');
const http = require('http');
const fetch = require('node-fetch');

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

  // =================== Test utilisation LDAP CACOM =========================

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

  // ===================== Test authent Cloudflow ==============================

  fetch('http://ptitniko.freeboxos.fr:9090/portal.cgi', {
    method: 'POST',
    body: JSON.stringify({
      method: 'auth.create_session',
      user_name: 'admin',
      user_pass: 'im3dsAYT3PeNDp9',
    })
  }).then(res => {
    res.json().then(json => {
      // ce json contient la sessionId qu'il faudra envoyer au front ou stocker dans un cookie httpOnly
      console.log('SUCCESS :', json)
    })
  }).catch(e => {
    console.log('ERROR :', err)
  })

  // C'est tout simple. Juste a voir la question de la synchro du LDAP entre cloudflow et cacom.
  // Chaque requete venant du front, si elle doit taper sur cloudflow, devra contenir le sessionId.

  // Faudra tester, quand on envoi un sessionId expiré, quel est la réponse de Cloudflow. Faudra a ce moment là se réauthentifié :
  // On a pas envie que l'user rerentre ses logs a chaque fois que le sessionId de cloudflow expire. L'ideal serait donc d'authentifié l'utilisateur
  // avec un token jwt contenant son username et son password : si cloudflow dit que la session est expiré, l'api aurait deja toutes les infos pour le
  // réauthentifié auprès de cloudflow. Il faudra aussi a ce moment là mettre à jour le sessionId stocké en front, via websocket probablement ?

  // sessionId datant de 2020/03/19 à 18h53 : 5e6ba3e8dbb1c6374d0d2de721B7322CBE1007CEF60C8423AEA0277A1584683625
  // sessionId expire au bout de 12h donc on pourra tester demain matin
});

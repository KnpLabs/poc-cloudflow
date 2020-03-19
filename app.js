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
      scope: 'sub',
      attributes: ['dn', 'sn', 'cn']
    }

    client.search('ou=Clichy, ou=Utilisateurs, DC=cacom, DC=fr', opts, (err, res) => {
      res.on('searchEntry', function(entry) {
        console.log('entry: ' + JSON.stringify(entry.object));
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

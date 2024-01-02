const session = require('express-session');
const Keycloak = require('keycloak-connect');

app.use(session({
  secret: 'Cy5NXaZEkQaXm7TjI6Uq1CBTmNz6ainJ',
  resave: false,
  saveUninitialized: true,
  store: new session.MemoryStore()
}));

const keycloak = new Keycloak({ store: session.MemoryStore() }, {
  'realm': 'patient-keycloak',
  'bearer-only': true,
  'auth-server-url': 'https://keycloak.app.cloud.cbh.kth.se/realms/patient-keycloak',
  'ssl-required': 'external',
  'resource': 'spring-auth',
  'credentials': {
    'secret': 'Cy5NXaZEkQaXm7TjI6Uq1CBTmNz6ainJ'
  }
});

app.use(keycloak.middleware());

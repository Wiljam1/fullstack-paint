const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://keycloak.app.cloud.cbh.kth.se/realms/patient-keycloak/protocol/openid-connect/certs`
});

function getKey(header, callback){
  client.getSigningKey(header.kid, function(err, key) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Authorization header missing or invalid');
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, getKey, {}, (err, decoded) => {
    if (err) {
      return res.status(403).send('Failed to authenticate token');
    }

    const roles = decoded.realm_access?.roles; 
    if (!roles || !roles.includes('doctor')) {
        return res.status(403).send('Access denied: insufficient role');
    }

    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;

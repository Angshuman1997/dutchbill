const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = {
  type: process.env.FBSA_TYPE,
  project_id: process.env.FBSA_PROJECT_ID,
  private_key_id: process.env.FBSA_PRIVATE_KEY_ID,
  private_key: process.env.FBSA_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FBSA_CLIENT_EMAIL,
  client_id: process.env.FBSA_CLIENT_ID,
  auth_uri: process.env.FBSA_AUTH_URI,
  token_uri: process.env.FBSA_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FBSA_PROV_CERT_URL,
  client_x509_cert_url: `${process.env.FBSA_CLIENT_CERT_URL}${process.env.FBSA_CLIENT_EMAIL}`
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;

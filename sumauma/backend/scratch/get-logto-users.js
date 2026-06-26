const axios = require('axios');
require('dotenv').config();

async function getLogtoUsers() {
  const endpoint = process.env.LOGTO_ENDPOINT;
  const clientId = process.env.LOGTO_M2M_CLIENT_ID;
  const clientSecret = process.env.LOGTO_M2M_CLIENT_SECRET;

  console.log('--- Config ---');
  console.log('Endpoint:', endpoint);
  console.log('ClientID:', clientId);

  try {
    const tokenRes = await axios.post(
      `${endpoint}/oidc/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'all',
        resource: `${endpoint}/api`,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const token = tokenRes.data.access_token;
    console.log('Token obtained!');

    console.log('--- Listing Users ---');
    // Tentamos primeiro sem params de paginação para evitar erro 400
    const usersRes = await axios.get(`${endpoint}/api/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`Success! Found ${usersRes.data.length} users:`);
    for (const u of usersRes.data) {
      console.log(`- ID: ${u.id} | Email: ${u.primaryEmail || u.email || 'N/A'} | Username: ${u.username || 'N/A'} | Name: ${u.name || 'N/A'}`);
    }

  } catch (err) {
    console.error('--- ERROR ---');
    console.error('Status:', err.response?.status);
    console.error('Data:', JSON.stringify(err.response?.data, null, 2));
    console.error('Message:', err.message);
  }
}

getLogtoUsers();

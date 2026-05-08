const axios = require('axios');
require('dotenv').config();

async function testLogto() {
  const endpoint = process.env.LOGTO_ENDPOINT;
  const clientId = process.env.LOGTO_M2M_CLIENT_ID;
  const clientSecret = process.env.LOGTO_M2M_CLIENT_SECRET;

  console.log('--- Config ---');
  console.log('Endpoint:', endpoint);
  console.log('ClientID:', clientId);
  console.log('--- Fetching Token ---');

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
    console.log('Token obtained! Length:', token.length);

    console.log('--- Listing Users (pageSize=200) ---');
    const usersRes = await axios.get(`${endpoint}/api/users?page_size=200`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Success! Users found:', usersRes.data.length);
    console.log('First user:', usersRes.data[0]?.username || usersRes.data[0]?.primaryEmail);

  } catch (err) {
    console.error('--- ERROR ---');
    console.error('Status:', err.response?.status);
    console.error('Data:', JSON.stringify(err.response?.data, null, 2));
    console.error('Message:', err.message);
  }
}

testLogto();

/**
 * lib/domo.js
 *
 * Server-side helper that:
 *  1. Obtains an OAuth access token from Domo using Client ID + Secret (from .env)
 *  2. Exchanges it for a short-lived programmatic embed token for a given embed ID
 *  3. Attaches a Client_Name filter so users only see their own data
 *     PLUS rows where Client_Name = 'Peer Group'
 *
 * This file runs only on the server (inside API routes / getServerSideProps).
 * The Client Secret is NEVER sent to the browser.
 */

const fetch = require("node-fetch");

const DOMO_INSTANCE = process.env.DOMO_INSTANCE;     // e.g. richeymay.domo.com
const CLIENT_ID     = process.env.DOMO_CLIENT_ID;
const CLIENT_SECRET = process.env.DOMO_CLIENT_SECRET;

/**
 * Step 1 – get a short-lived OAuth access token from Domo.
 */
async function getDomoAccessToken() {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const res = await fetch(
    `https://${DOMO_INSTANCE}/oauth/token?grant_type=client_credentials&scope=dashboard`,
    {
      method: "GET",
      headers: {
        Authorization: "Basic " + credentials,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Domo OAuth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Step 2 – exchange the OAuth token for a programmatic embed token.
 *
 * @param {string} embedId  - The Domo embed ID (e.g. "D842k")
 * @param {string} company  - The client's company name (must match Client_Name in Domo)
 * @returns {{ token: string, embedUrl: string }}
 */
async function getEmbedToken(embedId, company) {
  const accessToken = await getDomoAccessToken();

  // Show rows where Client_Name = company OR Client_Name = 'Peer Group'
  const filters = [
    {
      column: "Client_Name",
      operator: "IN",
      values: [company, "Peer Group"],
    },
  ];

  const body = {
    sessionLength: 1440, // minutes the token is valid (24 h max)
    authorizations: [
      {
        token: embedId,
        permissions: ["READ"],
        filters: filters,
      },
    ],
  };

  const res = await fetch(
    `https://${DOMO_INSTANCE}/api/content/v1/embed/auth`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Domo embed token failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  return {
    token: data.authentication,  // the embed token
    embedUrl: `https://${DOMO_INSTANCE}/embed/pages/${embedId}`,
  };
}

module.exports = { getEmbedToken };

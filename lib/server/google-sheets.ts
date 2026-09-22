import { createSign } from 'crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

function getServiceAccount() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  if (!clientEmail || !privateKey) throw new Error('Google Sheets no está configurado.');
  return { clientEmail, privateKey };
}

function base64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

async function getAccessToken() {
  const { clientEmail, privateKey } = getServiceAccount();
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claim = base64Url(JSON.stringify({ iss: clientEmail, scope: SHEETS_SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${claim}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(privateKey, 'base64url')}`;
  const response = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  if (!response.ok) throw new Error('Google rechazó las credenciales de la cuenta de servicio.');
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('Google no devolvió un token de acceso.');
  return data.access_token;
}

export function extractSpreadsheetId(value: string) {
  const match = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? value.trim();
}

export async function readSalesSheet(spreadsheetId: string) {
  const token = await getAccessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/A1:H`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error('No se pudo leer la hoja. Compartila con el email de GOOGLE_CLIENT_EMAIL.');
  const data = (await response.json()) as { values?: string[][] };
  return data.values ?? [];
}

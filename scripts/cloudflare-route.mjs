import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.cloudflare.local', quiet: true });

const apply = process.argv.includes('--apply');
const token = process.env.CLOUDFLARE_API_TOKEN;
const hostname = process.env.CLOUDFLARE_HOSTNAME?.trim().toLowerCase();
if (!token || !hostname || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(hostname)) {
  throw new Error('Set CLOUDFLARE_API_TOKEN and a full CLOUDFLARE_HOSTNAME in .env.cloudflare.local');
}

const connectorToken = (await readFile(join(homedir(), 'Library/Application Support/com.cloudflare.cloudflared/token'), 'utf8')).trim();
const connector = JSON.parse(Buffer.from(connectorToken, 'base64url').toString('utf8'));
const accountId = connector.a;
const tunnelId = connector.t;
if (!/^[a-f0-9]{32}$/.test(accountId) || !/^[a-f0-9-]{36}$/.test(tunnelId)) throw new Error('Cannot read Cloudflare account/tunnel ID from local connector token');

async function api(path, options = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(`Cloudflare API ${response.status}: ${data.errors?.map(error => error.message).join('; ') || 'request failed'}`);
  return data.result;
}

const suffixes = hostname.split('.').slice(1);
let zone;
for (let index = 0; index < suffixes.length - 1; index++) {
  const name = suffixes.slice(index).join('.');
  const found = await api(`/zones?name=${encodeURIComponent(name)}&per_page=50`);
  zone = found.find(candidate => candidate.name.toLowerCase() === name && candidate.account?.id === accountId);
  if (zone) break;
}
if (!zone) throw new Error(`No Cloudflare zone in this account matches ${hostname}`);

const configPath = `/accounts/${accountId}/cfd_tunnel/${tunnelId}/configurations`;
const configuration = await api(configPath);
const ingress = [...(configuration.config?.ingress || [])];
const service = process.env.CLOUDFLARE_ORIGIN_URL || 'http://host.docker.internal:8002';
const existingRule = ingress.find(rule => rule.hostname?.toLowerCase() === hostname);
if (existingRule && existingRule.service !== service) throw new Error(`${hostname} already routes to ${existingRule.service}; refusing to replace it`);

const dnsPath = `/zones/${zone.id}/dns_records`;
const existingDns = await api(`${dnsPath}?name=${encodeURIComponent(hostname)}&per_page=100`);
const target = `${tunnelId}.cfargotunnel.com`;
if (existingDns.some(record => record.type !== 'CNAME' || record.content.toLowerCase() !== target || !record.proxied)) {
  throw new Error(`${hostname} already has a different DNS record; refusing to replace it`);
}

console.log(`Tunnel connector: ${tunnelId}`);
console.log(`Hostname: ${hostname}`);
console.log(`Origin: ${service}`);
console.log(`Ingress: ${existingRule ? 'already configured' : 'will add'}`);
console.log(`DNS: ${existingDns.length ? 'already configured' : 'will add proxied CNAME'}`);
if (!apply) {
  console.log('Dry run only. Re-run with --apply to publish the route.');
  process.exit(0);
}

if (!existingRule) {
  const newRule = { hostname, service };
  const fallbackIndex = ingress.findIndex(rule => !rule.hostname);
  if (fallbackIndex === -1) ingress.push(newRule, { service: 'http_status:404' });
  else ingress.splice(fallbackIndex, 0, newRule);
  await api(configPath, { method: 'PUT', body: JSON.stringify({ config: { ...(configuration.config || {}), ingress } }) });
  console.log('Ingress route published.');
}
if (!existingDns.length) {
  await api(dnsPath, { method: 'POST', body: JSON.stringify({ type: 'CNAME', name: hostname, content: target, proxied: true }) });
  console.log('DNS record published.');
}

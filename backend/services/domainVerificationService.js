import crypto from 'crypto';
import dns from 'dns/promises';

export const cleanDomain = (rawDomain) => {
  if (!rawDomain) return '';
  return rawDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
};

export const generateVerificationToken = () => {
  return `bridge-verify-${crypto.randomBytes(16).toString('hex')}`;
};

/**
 * Attempt verification via GoDaddy API if keys are provided,
 * otherwise fall back to native DNS TXT record resolution.
 */
export const checkDomainTxtRecord = async (domain, expectedToken) => {
  const apiKey = process.env.GODADDY_API_KEY;
  const apiSecret = process.env.GODADDY_API_SECRET;
  const isProduction = process.env.GODADDY_ENV === 'production';
  const baseUrl = isProduction
    ? 'https://api.godaddy.com'
    : 'https://api.ote-godaddy.com';

  // Strategy 1: GoDaddy API check if credentials exist
  if (apiKey && apiSecret) {
    try {
      const response = await fetch(`${baseUrl}/v1/domains/${domain}/records/TXT`, {
        method: 'GET',
        headers: {
          Authorization: `sso-key ${apiKey}:${apiSecret}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const records = await response.json();
        const matched = records.some((r) => r.data && r.data.includes(expectedToken));
        if (matched) {
          return { verified: true, source: 'godaddy_api' };
        }
      }
    } catch (err) {
      console.warn('GoDaddy API lookup error, falling back to DNS resolution:', err.message);
    }
  }

  // Strategy 2: Native DNS TXT resolution fallback
  try {
    const txtRecords = await dns.resolveTxt(domain);
    const flatRecords = txtRecords.map((chunk) => chunk.join(''));
    const matched = flatRecords.some((val) => val.includes(expectedToken));

    if (matched) {
      return { verified: true, source: 'dns_txt' };
    }

    return {
      verified: false,
      reason: `Expected TXT record containing "${expectedToken}" was not found on ${domain}.`,
    };
  } catch (err) {
    return {
      verified: false,
      reason: `DNS lookup failed for ${domain}: ${err.code || err.message}`,
    };
  }
};
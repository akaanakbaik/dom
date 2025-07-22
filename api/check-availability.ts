import type { VercelRequest, VercelResponse } from '@vercel/node';

const BLOCKED_SUBDOMAINS = [
  "admin", "api", "cdn", "ns1", "ns2", "mail", "ftp", 
  "cpanel", "webmail", "webdisk", "server", "localhost"
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method tidak diizinkan'
    });
  }

  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama subdomain diperlukan'
      });
    }

    // Check if subdomain is blocked
    if (BLOCKED_SUBDOMAINS.includes(name.toLowerCase())) {
      return res.status(200).json({
        success: true,
        available: false,
        reason: 'BLOCKED_SUBDOMAIN',
        message: 'Nama subdomain ini dilarang'
      });
    }

    // Validate subdomain name format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(name)) {
      return res.status(200).json({
        success: true,
        available: false,
        reason: 'INVALID_FORMAT',
        message: 'Nama subdomain tidak valid. Gunakan huruf kecil, angka, dan tanda hubung saja.'
      });
    }

    // For this public API, we'll assume availability since we don't have persistent storage
    return res.status(200).json({
      success: true,
      available: true,
      reason: null,
      message: 'Subdomain tersedia'
    });

  } catch (error) {
    console.error('Error in availability check:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal'
    });
  }
}
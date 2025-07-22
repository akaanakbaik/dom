import type { VercelRequest, VercelResponse } from '@vercel/node';

// Cloudflare API integration
async function createCloudflareRecord(name: string, type: string, target: string): Promise<string | null> {
  const cfToken = process.env.CF_API_TOKEN;
  const cfZoneId = process.env.CF_ZONE_ID;
  
  if (!cfToken || !cfZoneId) {
    console.error("Cloudflare credentials not configured");
    return null;
  }

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        name: `${name}.domku.my.id`,
        content: target,
        proxied: false,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      return data.result.id;
    } else {
      console.error('Cloudflare API error:', data.errors);
      return null;
    }
  } catch (error) {
    console.error('Cloudflare API request failed:', error);
    return null;
  }
}

// Blocked subdomains list
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
    const { name, type, target } = req.body;

    // Validation
    if (!name || !type || !target) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap'
      });
    }

    // Check if subdomain is blocked
    if (BLOCKED_SUBDOMAINS.includes(name.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Nama subdomain ini dilarang'
      });
    }

    // Validate subdomain name format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: 'Nama subdomain tidak valid. Gunakan huruf kecil, angka, dan tanda hubung saja.'
      });
    }

    // Validate DNS record type
    if (!['A', 'CNAME', 'AAAA'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipe DNS tidak valid'
      });
    }

    // Create Cloudflare record
    const cfRecordId = await createCloudflareRecord(name, type, target);
    
    if (!cfRecordId) {
      return res.status(500).json({
        success: false,
        message: 'Gagal membuat DNS record di Cloudflare'
      });
    }

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Subdomain berhasil dibuat',
      data: {
        id: Date.now(), // Simple ID for API response
        name: `${name}.domku.my.id`,
        type,
        target,
        status: 'active',
        created: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in API:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal'
    });
  }
}
// Client-side utilities for Cloudflare integration
// Note: Actual API calls are handled on the server side for security

export interface CloudflareRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  proxied: boolean;
  ttl: number;
  created_on: string;
  modified_on: string;
}

export interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{
    code: number;
    message: string;
  }>;
  messages: string[];
  result: T;
}

// DNS record types supported by Domku
export const SUPPORTED_RECORD_TYPES = ["A", "CNAME", "AAAA"] as const;
export type RecordType = typeof SUPPORTED_RECORD_TYPES[number];

// Validation helpers
export const validateIPv4 = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};

export const validateIPv6 = (ip: string): boolean => {
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip) || ip === "::1";
};

export const validateDomain = (domain: string): boolean => {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain);
};

export const validateRecordTarget = (type: RecordType, target: string): boolean => {
  switch (type) {
    case "A":
      return validateIPv4(target);
    case "AAAA":
      return validateIPv6(target);
    case "CNAME":
      return validateDomain(target);
    default:
      return false;
  }
};

// Helper to get target placeholder based on record type
export const getTargetPlaceholder = (type: RecordType): string => {
  switch (type) {
    case "A":
      return "192.168.1.1";
    case "AAAA":
      return "2001:db8::1";
    case "CNAME":
      return "example.com";
    default:
      return "";
  }
};

// Helper to get target description
export const getTargetDescription = (type: RecordType): string => {
  switch (type) {
    case "A":
      return "Alamat IPv4 (contoh: 192.168.1.1)";
    case "AAAA":
      return "Alamat IPv6 (contoh: 2001:db8::1)";
    case "CNAME":
      return "Nama domain (contoh: example.com)";
    default:
      return "Target untuk record DNS";
  }
};

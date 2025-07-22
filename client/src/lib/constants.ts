// Blocked subdomain names for security
export const BLOCKED_SUBDOMAINS = [
  "admin",
  "api", 
  "cdn",
  "ns1",
  "ns2", 
  "mail",
  "ftp",
  "cpanel",
  "webmail",
  "webdisk", 
  "server",
  "localhost",
  "www",
  "root",
  "test",
  "staging",
  "dev",
  "development",
  "prod",
  "production",
  "backup",
  "database",
  "db",
  "mysql",
  "postgres",
  "redis",
  "cache",
  "ssl",
  "secure",
  "private",
  "internal",
  "intranet",
  "vpn",
  "ssh",
  "ftp",
  "sftp",
  "git",
  "svn",
  "support",
  "help",
  "status",
  "monitor",
  "log",
  "logs",
  "auth",
  "oauth",
  "sso",
  "ldap",
  "ad",
  "dns",
  "mx",
  "smtp",
  "pop",
  "imap",
  "webdav",
  "caldav",
  "carddav"
] as const;

// Maximum subdomains per IP/session
export const MAX_SUBDOMAINS_PER_SESSION = 5;

// Supported DNS record types
export const SUPPORTED_RECORD_TYPES = [
  { value: "A", label: "A Record", description: "IPv4 address mapping" },
  { value: "CNAME", label: "CNAME Record", description: "Canonical name alias" },
  { value: "AAAA", label: "AAAA Record", description: "IPv6 address mapping" }
] as const;

// Validation patterns
export const SUBDOMAIN_NAME_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
export const IPV4_PATTERN = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
export const IPV6_PATTERN = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
export const DOMAIN_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// API endpoints
export const API_ENDPOINTS = {
  CREATE_SUBDOMAIN: "/api/create",
  LIST_SUBDOMAINS: "/api/subdomains",
  CHECK_AVAILABILITY: "/api/check-availability",
  UPDATE_SUBDOMAIN: (id: number) => `/api/subdomains/${id}`,
  DELETE_SUBDOMAIN: (id: number) => `/api/subdomains/${id}`,
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  SUBDOMAIN_EXISTS: "SUBDOMAIN_EXISTS",
  FORBIDDEN_SUBDOMAIN: "FORBIDDEN_SUBDOMAIN",
  SUBDOMAIN_NOT_FOUND: "SUBDOMAIN_NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  CLOUDFLARE_ERROR: "CLOUDFLARE_ERROR",
  MISSING_CONFIG: "MISSING_CONFIG",
} as const;

// Status options for subdomains
export const SUBDOMAIN_STATUS = {
  ACTIVE: "active",
  PENDING: "pending", 
  INACTIVE: "inactive",
  ERROR: "error"
} as const;

// Default values
export const DEFAULT_VALUES = {
  RECORD_TYPE: "A" as const,
  SUBDOMAIN_TTL: 1, // Auto/Cloudflare managed
  PROXIED: false, // Always false as per requirements
} as const;

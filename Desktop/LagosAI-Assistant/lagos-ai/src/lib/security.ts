// Input sanitization and validation utilities

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 10000) // Limit length
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

export function validatePhone(phone: string): boolean {
  // Basic phone validation - accepts international formats
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/\s+/g, ''))
}

export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .slice(0, 255) // Limit length
}

export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

export function isValidFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes
}

// SQL injection prevention (additional layer)
export function sanitizeSqlInput(input: string): string {
  return input.replace(/['";\\]/g, '') // Remove potentially dangerous characters
}

// XSS prevention for HTML content
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Audit logging
export interface AuditLogEntry {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  metadata?: Record<string, any>
}

export class AuditLogger {
  private static instance: AuditLogger
  private logs: AuditLogEntry[] = []

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  log(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date()
    }

    this.logs.push(logEntry)

    // In production, you would send this to a logging service
    console.log('[AUDIT]', JSON.stringify(logEntry, null, 2))

    // Keep only last 1000 entries in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000)
    }
  }

  getLogs(limit: number = 100): AuditLogEntry[] {
    return this.logs.slice(-limit)
  }
}
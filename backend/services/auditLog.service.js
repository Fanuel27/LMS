const prisma = require('../config/db');

class AuditLogService {
  /**
   * Log an action to the audit logs asynchronously.
   * Never blocks or fails the main request if logging fails.
   */
  async log({ userId, action, entityType, entityId, description, metadata, req }) {
    // Fire and forget
    setImmediate(async () => {
      try {
        let ipAddress = null;
        let userAgent = null;

        if (req) {
          ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'];
          userAgent = req.headers['user-agent'];
        }

        await prisma.auditLog.create({
          data: {
            userId: userId || null,
            action,
            entityType,
            entityId: entityId || null,
            description,
            metadata: metadata || null,
            ipAddress,
            userAgent,
          },
        });
      } catch (error) {
        console.error('AuditLogService Error: Failed to write audit log.', {
          action,
          entityType,
          error: error.message,
        });
      }
    });
  }
}

module.exports = new AuditLogService();

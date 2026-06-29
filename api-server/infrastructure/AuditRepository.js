// COMPONENT: Audit Repository [Component: pg]
// PURPOSE: Records complaint lifecycle and authentication events with timestamps and user IDs (NFR09, NFR10)

class AuditRepository {
  constructor(dbPool) {
    this.dbPool = dbPool; // pg pool injected via constructor (DIP)
  }

  // writes an audit event - payload is optional JSON e.g. old/new status or cross-tenant attempt details
  async logEvent(complaintId, userId, eventType, payload) {
    await this.dbPool.query(
      `INSERT INTO audit_logs (complaint_id, user_id, event_type, payload)
       VALUES ($1, $2, $3, $4)`,
      [
        complaintId || null, // complaint_id is nullable for auth events e.g. AUTH_FAILED
        userId,
        eventType,
        payload ? JSON.stringify(payload) : null
      ]
    );
  }
}

module.exports = AuditRepository;
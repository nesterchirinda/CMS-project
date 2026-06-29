// COMPONENT: Complaint Repository [Component: pg]
// PURPOSE: Implements IComplaintRepository - handles all complaint data access with tenant-scoped SQL (ADR-04, ADR-06)

const IComplaintRepository = require('../application/IComplaintRepository');


// extends IComplaintRepository interface - concrete implementation lives in infrastructure layer (DIP)
class ComplaintRepository extends IComplaintRepository {
  constructor(dbPool) {
    super();
    this.dbPool = dbPool;  // pg pool injected via constructor (DIP)
  }

  // US001 - inserts a new complaint, status defaults to 'Submitted' at DB level
  async saveComplaint(complaint) {
    const result = await this.dbPool.query(
      `INSERT INTO complaints
         (tenant_id, consumer_id, category, title, complaint_description, complaint_status)
       VALUES ($1, $2, $3, $4, $5, 'Submitted')
       RETURNING *`,
      [
        complaint.tenantId,
        complaint.consumerId,
        complaint.category,
        complaint.title,
        complaint.complaintDescription
      ]
    );
    return result.rows[0];
  }


  // US002 - returns complaints for a specific consumer, scoped to tenant 
  async findByConsumerId(userId, tenantId) {
    const result = await this.dbPool.query(
      `SELECT * FROM complaints WHERE consumer_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [userId, tenantId]
    );
    return result.rows;
  }

  // US002 - tenant_id filter on every query enforces row-level multi-tenancy isolation (ADR-04)
  async findById(id, tenantId) {
    const result = await this.dbPool.query(
      `SELECT * FROM complaints WHERE complaint_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null; // return null if not found so controller can return 404
  }


  // returns all complaints for a tenant with assigned agent name via LEFT JOIN - used by agents, managers and admins
  async findByTenantId(tenantId) {
    const result = await this.dbPool.query(
      `SELECT c.*, u.first_name || ' ' || u.last_name AS assigned_agent_name
      FROM complaints c
      LEFT JOIN users u ON u.user_id = c.assigned_agent_id
      WHERE c.tenant_id = $1 ORDER BY c.created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  // US006 - updates assigned_agent_id and timestamps the change
  async update(complaint) {
    const result = await this.dbPool.query(
      `UPDATE complaints
       SET assigned_agent_id = $1, updated_at = NOW()
       WHERE complaint_id = $2
       RETURNING *`,
      [complaint.assigned_agent_id, complaint.complaint_id]
    );
    return result.rows[0];
  }
}

module.exports = ComplaintRepository;

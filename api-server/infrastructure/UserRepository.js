// COMPONENT: User Repository [Component: pg]
// PURPOSE: Handles all user data access including authentication lookups and support person queries

class UserRepository {
  constructor(dbPool) {
    this.dbPool = dbPool; // pg pool injected via constructor (DIP)
  }

  // fetches user and tenant logo in one query - used by UserController for login (US login)
  async findByEmail(email) {
    const result = await this.dbPool.query(
      `SELECT u.user_id, u.tenant_id, u.first_name, u.last_name,
              u.role_type, u.email, u.password_hash, u.is_active, t.logo
       FROM users u
       JOIN tenants t ON t.tenant_id = u.tenant_id
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }


  // used by ComplaintService to fetch consumer email for notifications after complaint submission
  async findById(userId) {
    const result = await this.dbPool.query(
      `SELECT user_id, tenant_id, role_type, email, first_name, last_name
       FROM users WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  
  // US006 - returns only active support persons for the agent's tenant to prevent cross-tenant assignment
  async findSupportPersonsByTenant(tenantId) {
    const result = await this.dbPool.query(
      `SELECT user_id, first_name, last_name, email
       FROM users
       WHERE tenant_id = $1 AND role_type = 'Support Person' AND is_active = TRUE`,
      [tenantId]
    );
    return result.rows;
  }
}

module.exports = UserRepository;

// COMPONENT: User Controller [Component: Express.js]
// PURPOSE: Handles authentication and support person lookup endpoints (ADR-05, NFR01)

const bcrypt = require('bcryptjs'); // used to compare submitted password against stored hash
const jwt = require('jsonwebtoken'); // used to sign JWT on successful login


// userRepository and auditRepository injected via constructor (DIP)
class UserController {
  constructor(userRepository, auditRepository) {
    this.userRepository = userRepository;
    this.auditRepository = auditRepository;
  }

  // US006 - return support persons for the agent's tenant to populate assignment dropdown
  async getSupportPersons(req, res) {
    try {
      const persons = await this.userRepository.findSupportPersonsByTenant(req.user.tenantId);
      return res.status(200).json(persons);
    } catch (err) {
      console.error('getSupportPersons error:', err);
      return res.status(500).json({ error: 'An error occurred. Please try again later.' });
    }
  }


  async login(req, res) {
    const { email, password } = req.body;

    // validate required fields before hitting the repository
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // check account is active before proceeding with password comparison
      if (!user.is_active) {
        return res.status(401).json({ error: 'Account is inactive' });
      }

      const match = await bcrypt.compare(password, user.password_hash);

      if (!match) {
        // log failed attempt for security audit trail (NFR09)
        await this.auditRepository.logEvent(null, user.user_id, 'AUTH_FAILED', null);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      await this.auditRepository.logEvent(null, user.user_id, 'AUTH_SUCCESS', null);

      // sign JWT with userId, tenantId and role - tenantId scopes all requests (ADR-04)
      const token = jwt.sign(
        { userId: user.user_id, tenantId: user.tenant_id, role: user.role_type },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.status(200).json({
        token,
        user: {
          userId: user.user_id,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role_type,
          tenantId: user.tenant_id,
          logo: user.logo // tenant logo returned for correct branding
        }
      });
    } catch (err) {
      console.error('login error:', err);
      return res.status(500).json({ error: 'An error occurred. Please try again later.' });
    }
  }
}

module.exports = UserController;
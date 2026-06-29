// Composition Root
// PURPOSE: Wires all concrete dependencies and starts the Express server - only place in the codebase where 'new' is called on infrastructure classes (DIP, Clean Architcure)

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// dependencies
const { Pool } = require('pg');
const ComplaintRepository = require('./infrastructure/ComplaintRepository');
const UserRepository = require('./infrastructure/UserRepository');
const AuditRepository = require('./infrastructure/AuditRepository');
const EmailNotificationStrategy = require('./infrastructure/EmailNotificationStrategy');
const NotificationService = require('./application/NotificationService');
const ComplaintService = require('./application/ComplaintService');
const ComplaintController = require('./adapters/ComplaintController');
const UserController = require('./adapters/UserController');
const createApp = require('./app');


// create pg connection pool using Supabase connection string from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Supabase SSL
});


// instantiate repositories with pool - infrastructure layer
const complaintRepository = new ComplaintRepository(pool);
const userRepository = new UserRepository(pool);
const auditRepository = new AuditRepository(pool);


// instantiate notification strategy and inject into service - Strategy Pattern (Gamma et al. 1994)
const emailStrategy = new EmailNotificationStrategy();
const notificationService = new NotificationService(emailStrategy);


// instantiate application service with all required dependencies
const complaintService = new ComplaintService(
  complaintRepository,
  userRepository,
  auditRepository,
  notificationService
);


// instantiate controllers with their service dependencies - adapter layer
const complaintController = new ComplaintController(complaintService);
const userController = new UserController(userRepository, auditRepository);


// wire controllers into Express app and start server
const app = createApp(complaintController, userController);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CMS API Server running on port ${PORT}`);
});
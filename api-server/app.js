// PURPOSE: Express app factory: configures middleware, static file serving, and API routes

// dependencies
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const { authMiddleware, rbacMiddleware } = require('./adapters/AuthMiddleware');


// controllers injected as abstractions & concrete dependencies are wired in index.js (DIP)
function createApp(complaintController, userController) {
  const app = express();

  // Security headers to prevent clickjacking and MIME sniffing attacks (NFR01)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff'); // stops browser guessing content type
    res.setHeader('X-Frame-Options', 'DENY'); // prevent app being embedded in an iframe
    next();
  });

  app.use(morgan('dev')); // HTTP request logger for debugging
  app.use(express.json()); // parse incoming JSON request bodies

  // Serve static frontend files from web-application folder
  app.use(express.static(path.join(__dirname, '../web-application')));

  // Auth routes
  app.post('/api/auth/login', (req, res) => userController.login(req, res));

  // User utility routes
  app.get(
    '/api/users/support-persons',
    authMiddleware,
    rbacMiddleware(['Agent']),  // only agents can fetch support persons to assign complaints 
    (req, res) => userController.getSupportPersons(req, res)
  );

  // Complaint routes - RBAC permission matrix
  app.post(
    '/api/complaints',
    authMiddleware,
    rbacMiddleware(['Consumer', 'Agent']), // consumers submit their own, agents log on behalf of caller
    (req, res) => complaintController.submitComplaint(req, res)
  );

  app.get(
    '/api/complaints',
    authMiddleware,
    rbacMiddleware(['Agent', 'Manager', 'Admin']), // ensures consumers cannot view all complaints
    (req, res) => complaintController.getComplaints(req, res)
  );

  app.get(
    '/api/my-complaints',
    authMiddleware,
    rbacMiddleware(['Consumer']),  // defined before /:id to prevent NaN route clash issue
    (req, res) => complaintController.getMyComplaints(req, res)
  );

  app.get(
    '/api/complaints/:id',
    authMiddleware,
    rbacMiddleware(['Consumer', 'Agent']), 
    (req, res) => complaintController.getComplaintById(req, res)
  );

  app.patch(
    '/api/complaints/:id/assign',
    authMiddleware,
    rbacMiddleware(['Agent']),  // ensure only agents can assign complaints to support persons (US006)
    (req, res) => complaintController.assignComplaint(req, res)
  );

  return app;
}

module.exports = createApp;

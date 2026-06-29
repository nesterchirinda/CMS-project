// COMPONENT: Complaint Controller [Component: Express.js]
// PURPOSE: Routes complaint HTTP requests to ComplaintService and returns responses (US001, US002, US006)

class ComplaintController {

  // complaintService injected via constructor, controller never instantiates dependencies directly (DIP)
  constructor(complaintService) {
    this.complaintService = complaintService;
  }


  // US001 - consumer or agent submits a new complaint
  async submitComplaint(req, res) {
    const { title, category, complaint_description} = req.body;

    // validate required fields before hitting the service layer
    if (!title || !category || !complaint_description) {
      return res.status(400).json({ error: 'Title, category and description are required'});
    }

    try {
      const complaint = await this.complaintService.submitComplaint(
        { title, category, complaint_description},
        req.user.tenantId, // tenantId from JWT scopes complaint to correct tenant (ADR-04)
        req.user.userId
      );
      return res.status(201).json(complaint); // 201 Created on success
    } catch (err) {
      // catch unexpected errors from the service layer without exposing internals to the client
      console.error('submitComplaint error:', err);
      return res.status(500).json({ error: 'An error occurred. Please try again later.'});
    }
  }


  // US002 - fetch a single complaint by ID, scoped to tenant
  async getComplaintById(req, res) {
    try {
      const complaint = await this.complaintService.getComplaintById(
        parseInt(req.params.id, 10), // parse string param to integer
        req.user.tenantId
      );
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found'});
      }
      return res.status(200).json(complaint);
    } catch (err) {
      console.error('getComplaintById error:', err);
      return res.status(500).json({ error: 'An error occurred. Please try again later.'});
    }
  }

  
  // US002 - consumer views only their own complaints
  async getMyComplaints(req, res) {
    try {
      const complaints = await this.complaintService.getMyComplaints(
        req.user.userId,
        req.user.tenantId
      );
      return res.status(200).json(complaints);
    } catch (err) {
    
      console.error('getMyComplaints error:', err);
      return res.status(500).json({ error: 'An error occurred. Please try again later.'});
    }
  }

  
  // agents, managers and admins view all complaints for their tenant
  async getComplaints(req, res) {
    try {
      const complaints = await this.complaintService.getComplaintsByTenant(req.user.tenantId);
      return res.status(200).json(complaints);
    } catch (err) {
      console.error('getComplaints error:', err);
      return res.status(500).json({ error: 'An error occurred. Please try again later.'});
    }
  }


  // US006- agent assigns a complaint to a support person
  async assignComplaint(req, res) {
    const { supportPersonId } = req.body;

    // check supportPersonId is present before proceeding
    if (!supportPersonId) {
      return res.status(400).json({ error: 'supportPersonId is required'});
    }

    try {
      // handles tenant validation and cross-tenant prevention logic
      const result = await this.complaintService.assignComplaint(
        parseInt(req.params.id, 10),
        parseInt(supportPersonId, 10),
        req.user.userId,
        req.user.tenantId
      );

      // return { error, status } for business rule violations e.g cross-tenant assignment
      if (result.error) {
        return res.status(result.status).json({ error: result.error});
      }
      return res.status(200).json(result.data);
    } catch (err) {
      console.error('assignComplaint error:', err);
      return res.status(500).json({ error: 'An error occurred. Please try again later.'});
    }
  }
}

module.exports = ComplaintController;

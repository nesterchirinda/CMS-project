// COMPONENT: Complaint Service [Component: Node.js]
// PURPOSE: Encapsulates core business logic for the complaint lifecycle and tenant isolation (US001, US002, US006)

// all dependencies injected via constructor, service never imports concrete implementations directly (DIP)
class ComplaintService {
  constructor(complaintRepo, userRepo, auditRepo, notificationService) {
    this.complaintRepo = complaintRepo;
    this.userRepo = userRepo;
    this.auditRepo = auditRepo;
    this.notificationService = notificationService;
  }

  
  // US001 - persists complaint, logs audit event and notifies consumer
  async submitComplaint(complaintData, tenantId, userId) {
    const complaint = await this.complaintRepo.saveComplaint({
      tenantId,
      consumerId: userId,
      category: complaintData.category,
      title: complaintData.title,
      complaintDescription: complaintData.complaint_description
    });

    // write audit event to satisfy governance and traceability requirements (NFR09, NFR10)
    await this.auditRepo.logEvent(complaint.complaint_id, userId, 'COMPLAINT_SUBMITTED', null);

    const consumer = await this.userRepo.findById(userId);
    await this.notificationService.notifyConsumer(
      consumer ? consumer.email : null,
      'Complaint submitted successfully'
    );

    return complaint;
  }


  // US002 - return a single tenant scoped complaint to prevent cross-tenant access (ADR-04)
  async getComplaintById(id, tenantId) {
    return this.complaintRepo.findById(id, tenantId);
  }


  // US002 - return only complaints belonging to the logged in consumer
  async getMyComplaints(userId, tenantId) {
    return this.complaintRepo.findByConsumerId(userId, tenantId);
  }


  // return all complaints for a tenant, used by agents, managers and admins
  async getComplaintsByTenant(tenantId) {
    return this.complaintRepo.findByTenantId(tenantId);
  }


  // US006 - assign complaint to a support person with tenant and role validation
  async assignComplaint(complaintId, supportPersonId, agentUserId, tenantId) {
    const complaint = await this.complaintRepo.findById(complaintId, tenantId);
    if (!complaint) {
      return { error: 'Complaint not found', status: 404 };
    }

    const supportPerson = await this.userRepo.findById(supportPersonId);
    if (!supportPerson) {
      return { error: 'Support person not found', status: 400 };
    }

    // block cross-tenant assignment and log the attempt for audit trail (ADR-04, NFR09)
    if (supportPerson.tenant_id !== tenantId) {
      await this.auditRepo.logEvent(complaintId, agentUserId, 'COMPLAINT_ASSIGNED', {
        attempted_assignee: supportPersonId,
        reason: 'cross-tenant'
      });
      return { error: 'Cannot assign to user from different tenant', status: 403 };
    }

    // enforce role check - only Support Persons can be assigned complaints
    if (supportPerson.role_type !== 'Support Person') {
      return { error: 'User is not a Support Person', status: 400 };
    }

    const updated = await this.complaintRepo.update({
      complaint_id: complaintId,
      assigned_agent_id: supportPersonId
    });

    await this.auditRepo.logEvent(complaintId, agentUserId, 'COMPLAINT_ASSIGNED', null);

    // notify the support person that a complaint has been assigned to them
    await this.notificationService.notifyConsumer(
      supportPerson.email,
      'You have been assigned a complaint'
    );

    return { data: updated };
  }
}

module.exports = ComplaintService;

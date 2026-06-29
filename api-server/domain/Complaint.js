// COMPONENT: Complaint [Component: Node.js] 
// PURPOSE: Main domain entity representing a complaint - innermost layer, no dependencies on infrastructure or frameworks (Clean Architecture)

class Complaint {
  // maps all complaint fields from DB row to a domain object
  constructor({
    id,
    tenantId,
    consumerId,
    assignedAgentId,
    complaintStatus,
    category,
    title,
    complaintDescription,
    createdAt,
    resolvedAt,
    updatedAt}) 
    
    { this.id = id;
      this.tenantId = tenantId;
      this.consumerId = consumerId;
      this.assignedAgentId = assignedAgentId;
      this.complaintStatus = complaintStatus;
      this.category = category;
      this.title = title;
      this.complaintDescription = complaintDescription;
      this.createdAt = createdAt;
      this.resolvedAt = resolvedAt;
      this.updatedAt = updatedAt;
    }

  // updates complaint status and time stamps the change
  updateStatus(newStatus) {
    this.complaintStatus = newStatus;
    this.updatedAt = new Date();
  }

  // assigns complaint to a user and time stamps the change
  assignTo(userId) {
    this.assignedAgentId = userId;
    this.updatedAt = new Date();
  }
}

module.exports = Complaint;
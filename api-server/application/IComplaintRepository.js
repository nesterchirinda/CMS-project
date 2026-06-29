// COMPONENT: IComplaintRepository [Component: Node.js] 
// PURPOSE: Interface contract for complaint data access - enforces DIP so ComplaintService depends on abstraction not implementation (Martin, 2018)

class IComplaintRepository {
  async saveComplaint(complaint) {
    throw new Error('saveComplaint() must be implemented by a concrete repository.');
  }

  async findById(id, tenantId) {
    throw new Error('findById() must be implemented by a concrete repository.');
  }

  async findByConsumerId(userId, tenantId) {
    throw new Error('findByConsumerId() must be implemented by a concrete repository.');
  }

  async findByTenantId(tenantId) {
    throw new Error('findByTenantId() must be implemented by a concrete repository.');
  }

  async update(complaint) {
    throw new Error('update() must be implemented by a concrete repository.');
  }
}

module.exports = IComplaintRepository;
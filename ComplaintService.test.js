// PURPOSE: Unit test for ComplaintService.submitComplaint using Jest (ADR-07)
// Pattern: Arrange, Act, Assert (AAA) - mock dependencies injected via constructor (DIP)

const ComplaintService = require('./api-server/application/ComplaintService');

test('should successfully submit a complaint and trigger audit log', async () => {

  // ARRANGE: mock dependencies so no real database is needed (DIP)
   // initialise mock repositories and notification service
   // inject mocks into ComplaintService via constructor
  const mockComplaintRepo = {
    saveComplaint: jest.fn().mockResolvedValue({
      complaint_id: 1,
      complaint_status: 'Submitted',
      title: 'Lost my debit card'
    })
  };
  const mockUserRepo = {
    findById: jest.fn().mockResolvedValue({
      email: 'n.chirinda@natwest.com'
    })
  };
  const mockAuditRepo = {
    logEvent: jest.fn()
  };
  const mockNotificationService = {
    notifyConsumer: jest.fn()
  };

  const complaintService = new ComplaintService(
    mockComplaintRepo,
    mockUserRepo,
    mockAuditRepo,
    mockNotificationService
  );

  const complaintData = {
    title: 'Lost my debit card',
    category: 'Card Services',
    complaint_description: 'Testing'
  };


  // ACT: call the method under testing
    // invoke submitComplaint with mock data
  const result = await complaintService.submitComplaint(complaintData, 1, 1);


  // ASSERT: verify complaint saved, audit event logged, and correct status returned
    // check saveComplaint was called with correct tenant and consumer IDs
    // check audit log was triggered (NFR10)
    // check returned status matches expected value
  expect(mockComplaintRepo.saveComplaint).toHaveBeenCalledWith(
    expect.objectContaining({ tenantId: 1, consumerId: 1 })
  );
  expect(mockAuditRepo.logEvent).toHaveBeenCalledWith(1, 1, 'COMPLAINT_SUBMITTED', null); // NFR10
  expect(result.complaint_status).toBe('Submitted');
});
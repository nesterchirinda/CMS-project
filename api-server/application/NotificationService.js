// COMPONENT: Notification Service [Component: Node.js]
// PURPOSE: GoF Strategy Pattern Context - delegates notification dispatch to injected INotificationStrategy

class NotificationService {
  // strategy injected via constructor, allowing email or SMS to be swapped without modifying this class (DIP)
  constructor(strategy) {
    this.strategy = strategy;
  }

  // allows strategy to be swapped at runtime e.g. switching from email to SMS
  setStrategy(strategy) {
    this.strategy = strategy;
  }

  // delegates to whichever concrete strategy is currently injected
  async notifyConsumer(consumer, content) {
    return this.strategy.notifyConsumer(consumer, content);
  }
}

module.exports = NotificationService;

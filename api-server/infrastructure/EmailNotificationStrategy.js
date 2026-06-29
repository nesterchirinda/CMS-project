// COMPONENT: Email Notification Strategy [Component: Node.js]
// PURPOSE: Concrete implementation of INotificationStrategy for email delivery (Strategy Pattern)

const INotificationStrategy = require('../application/INotificationStrategy');

class EmailNotificationStrategy extends INotificationStrategy {
  // logs to console in PoC - in production this would call an SMTP service e.g. SendGrid
  async notifyConsumer(consumer, content) {
    console.log(`EMAIL sent to ${consumer}: ${content}`);
  }
}

module.exports = EmailNotificationStrategy;

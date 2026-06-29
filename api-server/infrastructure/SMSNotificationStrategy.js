// COMPONENT: SMS Notification Strategy [Component: Node.js] 
// PURPOSE: Concrete implementation of INotificationStrategy for SMS delivery (Strategy Pattern)

const INotificationStrategy = require('../application/INotificationStrategy');

class SMSNotificationStrategy extends INotificationStrategy {
  // logs to console in PoC - in production this would call an SMS gateway
  async notifyConsumer(consumer, content) {
    console.log(`SMS sent to ${consumer}: ${content}`);
  }
}

module.exports = SMSNotificationStrategy;
// COMPONENT: INotificationStrategy [Component: Node.js]
// PURPOSE: Interface Contract for notification strategies - concrete strategies (Email, SMS) must implement notifyConsumer() (Strategy Pattern)

class INotificationStrategy {
  async notifyConsumer(consumer, content) {
    throw new Error('notifyConsumer() must be implemented by a concrete strategy.');
  }
}

module.exports = INotificationStrategy;
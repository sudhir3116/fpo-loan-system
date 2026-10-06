class InAppNotificationProvider {
  constructor({ Notification }) {
    this.Notification = Notification;
    this.name = 'inapp';
  }

  async send({ userId, type, title, body, entityType, entityId, metadata }) {
    const doc = await this.Notification.create({
      user: userId,
      type,
      title,
      body,
      entityType: entityType || 'None',
      entityId,
      metadata: metadata || {},
    });
    return { provider: this.name, delivered: true, id: doc._id };
  }
}

class SmsProvider {
  constructor() {
    this.name = 'sms';
    this.configured = Boolean(process.env.SMS_API_KEY && process.env.SMS_SENDER_ID);
  }

  async send(payload) {
    if (!this.configured) {
      console.info('[SMSProvider] not configured — skipping delivery', payload?.type || '');
      return { provider: this.name, delivered: false, reason: 'not configured' };
    }
    // Real SMS integration would go here when credentials exist.
    console.info('[SMSProvider] configured but outbound adapter is not wired — not claiming delivery');
    return { provider: this.name, delivered: false, reason: 'adapter not wired' };
  }
}

class WhatsAppProvider {
  constructor() {
    this.name = 'whatsapp';
    this.configured = Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  }

  async send(payload) {
    if (!this.configured) {
      console.info('[WhatsAppProvider] not configured — skipping delivery', payload?.type || '');
      return { provider: this.name, delivered: false, reason: 'not configured' };
    }
    console.info('[WhatsAppProvider] configured but outbound adapter is not wired — not claiming delivery');
    return { provider: this.name, delivered: false, reason: 'adapter not wired' };
  }
}

class NotificationService {
  constructor({ Notification, providers }) {
    this.Notification = Notification;
    this.providers = providers;
  }

  async notify(payload) {
    if (!payload?.userId || !payload?.type || !payload?.title || !payload?.body) {
      return null;
    }
    const results = [];
    for (const provider of this.providers) {
      try {
        results.push(await provider.send(payload));
      } catch (err) {
        console.error(`[NotificationService] ${provider.name} failed:`, err.message);
      }
    }
    return results;
  }
}

let singleton;

const getNotificationService = () => {
  if (!singleton) {
    const Notification = require('../models/Notification');
    singleton = new NotificationService({
      Notification,
      providers: [
        new InAppNotificationProvider({ Notification }),
        new SmsProvider(),
        new WhatsAppProvider(),
      ],
    });
  }
  return singleton;
};

module.exports = {
  NotificationService,
  InAppNotificationProvider,
  SmsProvider,
  WhatsAppProvider,
  getNotificationService,
};

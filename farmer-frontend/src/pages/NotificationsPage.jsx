import React, { useState } from 'react';
import { Card, EmptyState } from '../components/UI';

const NotificationsPage = () => {
  // Placeholder notifications - can be replaced with actual API calls when backend supports it
  const [notifications] = useState([
    {
      id: 1,
      type: 'info',
      title: 'Loan Application Submitted',
      message: 'Your loan application has been successfully submitted. We will review it shortly.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: 2,
      type: 'warning',
      title: 'Pending Document',
      message: 'Please upload the missing land record document to proceed with verification.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      read: false,
    },
  ]);

  const getNotificationStyles = (type) => {
    const styles = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      error: 'bg-red-50 border-red-200 text-red-800',
    };
    return styles[type] || styles.info;
  };

  const getNotificationIcon = (type) => {
    const icons = {
      info: 'ℹ️',
      success: '✓',
      warning: '⚠️',
      error: '✕',
    };
    return icons[type] || '📧';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-1">Stay updated with your loan application status</p>
      </div>

      {/* Notification Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Notification Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 font-medium">Loan Status Updates</p>
              <p className="text-gray-600 text-sm">Get notified about your loan application status</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
            <div>
              <p className="text-gray-900 font-medium">Document Requests</p>
              <p className="text-gray-600 text-sm">Get notified when documents are requested</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
            <div>
              <p className="text-gray-900 font-medium">Payment Reminders</p>
              <p className="text-gray-600 text-sm">Get reminded about upcoming EMI payments</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Recent Notifications</h2>
        
        {notifications.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              title="No notifications"
              message="You're all caught up! Check back later for updates."
              icon="📧"
            />
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-6 border-l-4 ${getNotificationStyles(notification.type)}`}
            >
              <div className="flex gap-4">
                <div className="text-2xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <p className="text-gray-700 mt-1">{notification.message}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">{formatTime(notification.timestamp)}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">About Notifications</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>✓ Notifications are currently in UI development</li>
          <li>✓ Backend notification system will be integrated soon</li>
          <li>✓ You'll receive updates via email and in-app notifications</li>
          <li>✓ Important updates about your loan application will be prioritized</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationsPage;

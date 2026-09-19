import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/UI';

const ProfilePage = () => {
  const { farmer } = useAuth();

  if (!farmer) {
    return <div>Loading...</div>;
  }

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">View your profile information</p>
      </div>

      {/* Profile Header Card */}
      <Card className="p-8 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-green-600 text-white flex items-center justify-center text-3xl font-bold">
            {farmer.name?.charAt(0)?.toUpperCase() || 'F'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{farmer.name}</h2>
            <p className="text-gray-600 mt-1">{farmer.email}</p>
            <p className="text-gray-600">Member since {formatDate(farmer.createdAt)}</p>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-gray-600 text-sm font-medium">Full Name</label>
            <p className="text-gray-900 text-lg font-semibold mt-2">{farmer.name}</p>
          </div>
          <div>
            <label className="text-gray-600 text-sm font-medium">Email Address</label>
            <p className="text-gray-900 text-lg font-semibold mt-2">{farmer.email}</p>
          </div>
          <div>
            <label className="text-gray-600 text-sm font-medium">Phone Number</label>
            <p className="text-gray-900 text-lg font-semibold mt-2">{farmer.phone || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-gray-600 text-sm font-medium">Farming Area</label>
            <p className="text-gray-900 text-lg font-semibold mt-2">{farmer.farmingArea} acres</p>
          </div>
        </div>
      </Card>

      {/* Location Information */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Location Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-gray-600 text-sm font-medium">Location</label>
            <p className="text-gray-900 text-lg font-semibold mt-2">{farmer.location || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-gray-600 text-sm font-medium">Role</label>
            <p className="text-gray-900 text-lg font-semibold mt-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {farmer.role || 'FARMER'}
              </span>
            </p>
          </div>
        </div>
      </Card>

      {/* Account Information */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-gray-600 text-sm font-medium">Account ID</label>
            <p className="text-gray-900 text-lg font-mono font-semibold mt-2">{farmer._id}</p>
          </div>
          <div>
            <label className="text-gray-600 text-sm font-medium">Member Since</label>
            <p className="text-gray-900 text-lg font-semibold mt-2">{formatDate(farmer.createdAt)}</p>
          </div>
        </div>
      </Card>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Profile Information</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>✓ Your profile information is securely stored</li>
          <li>✓ This information is used for loan processing and verification</li>
          <li>✓ Contact FPO office to update your profile details</li>
        </ul>
      </div>
    </div>
  );
};

export default ProfilePage;

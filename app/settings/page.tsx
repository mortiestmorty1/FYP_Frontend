'use client';
import withAuth from '../components/withAuth';

function SettingsPage() {
  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <form>
        {/* Settings form */}
        <div className="mb-4">
          <label className="block text-gray-700">Username</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded mt-1"
            defaultValue="john_doe" // This would be dynamically fetched in a real app
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            className="w-full p-2 border border-gray-300 rounded mt-1"
            defaultValue="john.doe@example.com"
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Save Changes
        </button>
      </form>
    </div>
  );
}

export default withAuth(SettingsPage); // Protect this page

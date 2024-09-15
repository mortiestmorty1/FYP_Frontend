'use client';
import { useState } from 'react';
import withAuth from '../components/withAuth';

function DBIntegrationPage() {
  const [dbName, setDbName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Call your backend API to integrate the database
    const response = await fetch('/api/database/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dbName, host, port, username, password }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log('Database integrated successfully', data);
    } else {
      console.error('Database integration failed', data);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <h2 className="text-2xl font-bold mb-4">Database Integration</h2>
      <form onSubmit={handleSubmit}>
        {/* Input fields for DB integration */}
        <div className="mb-4">
          <label className="block text-gray-700">Database Name</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded mt-1"
            value={dbName}
            onChange={(e) => setDbName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Host</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded mt-1"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Port</label>
          <input
            type="number"
            className="w-full p-2 border border-gray-300 rounded mt-1"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Username</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded mt-1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Password</label>
          <input
            type="password"
            className="w-full p-2 border border-gray-300 rounded mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Integrate Database
        </button>
      </form>
    </div>
  );
}

export default withAuth(DBIntegrationPage); // Protect this page

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import withAuth from '../components/withAuth';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Database {
  _id: string;
  dbName: string;
  host: string;
  port: number;
  username: string;
  password: string;
  isIntegrated: boolean;
}

function SettingsPage() {
  const [user, setUser] = useState({ username: '', email: '' });
  const [databases, setDatabases] = useState<Database[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch User Profile
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('http://localhost:3001/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        router.push('/login');
      }
    };

    // Fetch Databases
    const fetchDatabases = async () => {
      try {
        const response = await axios.get('http://localhost:3001/database/getAll', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDatabases(response.data.databases);
      } catch (error) {
        console.error('Failed to load databases:', error);
      }
    };

    fetchUserProfile();
    fetchDatabases();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await axios.put(
        'http://localhost:3001/user/profile',
        { username: user.username, email: user.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage('Failed to update profile.');
    }
  };

  // Handle Database Edit
  const handleEdit = async (id: string) => {
    const newDbName = prompt("Enter new database name:");
    if (newDbName) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.put(
          `http://localhost:3001/database/${id}`,
          { dbName: newDbName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDatabases(
          databases.map((db) => (db._id === id ? response.data.database : db))
        );
        alert('Database updated successfully!');
      } catch (error) {
        console.error('Failed to update database:', error);
      }
    }
  };

  // Handle Database Delete
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this database?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3001/database/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDatabases(databases.filter((db) => db._id !== id));
        alert('Database deleted successfully!');
      } catch (error) {
        console.error('Failed to delete database:', error);
      }
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#5942E9] to-[#42DFE9] p-8">
      <motion.div
        className="w-full max-w-6xl bg-white p-8 shadow-lg rounded-lg"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h2 className="text-4xl font-bold text-center mb-8 text-[#5942E9]">Settings</h2>

        {isLoading ? (
          <p>Loading user profile...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && <p className="text-center text-green-600">{message}</p>}

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Username</label>
              <input
                type="text"
                name="username"
                className="w-full p-3 border border-gray-300 rounded-lg text-[#5942E9]"
                value={user.username}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                className="w-full p-3 border border-gray-300 rounded-lg text-[#5942E9]"
                value={user.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#5942E9] text-white p-3 rounded-lg hover:bg-blue-700 transition-all duration-300"
            >
              Save Changes
            </button>
          </form>
        )}

        <h3 className="text-3xl font-bold mt-12 mb-6 text-[#5942E9]">Manage Databases</h3>
        {databases.length === 0 ? (
          <p className="text-center text-gray-500">No databases available</p>
        ) : (
          <div className="space-y-4">
            {databases.map((db) => (
              <div
                key={db._id}
                className="p-4 shadow-md rounded-md bg-gray-100 flex justify-between items-center"
              >
                <div
                  className="text-xl text-[#5942E9] cursor-pointer"
                  onClick={() => router.push(`/database/details/${db._id}`)}  // Navigate to DB details page
                >
                  {db.dbName}
                </div>
                <div className="space-x-4">
                  <button
                    onClick={() => handleEdit(db._id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(db._id)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <Link href="/chats">
        <button className="mt-6 text-white bg-[#42DFE9] hover:bg-blue-400 px-6 py-3 rounded-lg transition-all">
          Back to Chats
        </button>
      </Link>
    </div>
  );
}

export default withAuth(SettingsPage);

'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faDatabase } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import '@fortawesome/fontawesome-svg-core/styles.css';

// Dynamically load Lottie Player for animations
const Player = dynamic(() => import('@lottiefiles/react-lottie-player').then((mod) => mod.Player), {
  ssr: false,
});

export default function DBIntegrationModal({ showModal, closeModal }: { showModal: boolean; closeModal: () => void }) {
  const [dbName, setDbName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [existingDbs, setExistingDbs] = useState<any[]>([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [isNewDb, setIsNewDb] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [message, setMessage] = useState('');
  const [animationType, setAnimationType] = useState<'none' | 'success' | 'error'>('none');
  const router = useRouter();

  useEffect(() => {
    const fetchDbs = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/database/getAll', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data.databases)) {
          setExistingDbs(data.databases);
        } else {
          console.error('Failed to fetch databases:', data);
        }
      } catch (error) {
        console.error('Error fetching databases:', error);
      }
    };

    fetchDbs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/database/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dbName, host, port, username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        setAnimationType('success');
        setMessage('Database integrated successfully!');
        setShowAnimation(true);
        setTimeout(() => {
          setShowAnimation(false);
          closeModal();
          setDbName('');
          setHost('');
          setPort('');
          setUsername('');
          setPassword('');
        }, 3000);
      } else {
        setAnimationType('error');
        setMessage(data.message || 'Database integration failed.');
        setShowAnimation(true);
        setTimeout(() => {
          setShowAnimation(false);
        }, 3000);
      }
    } catch (error) {
      setAnimationType('error');
      setMessage('An error occurred while integrating the database.');
      setShowAnimation(true);
      setTimeout(() => {
        setShowAnimation(false);
      }, 3000);
    }
  };

  const handleConnect = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/database/connect/${selectedDb}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setAnimationType('success');
        setMessage('Connected to database successfully!');
        setShowAnimation(true);
        setTimeout(() => {
          setShowAnimation(false);
          closeModal();
        }, 3000);
      } else {
        setAnimationType('error');
        setMessage(data.message || 'Failed to connect to the database.');
        setShowAnimation(true);
        setTimeout(() => {
          setShowAnimation(false);
        }, 3000);
      }
    } catch (error) {
      setAnimationType('error');
      setMessage('An error occurred while connecting to the database.');
      setShowAnimation(true);
      setTimeout(() => {
        setShowAnimation(false);
      }, 3000);
    }
  };

  if (!showModal) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={closeModal}
    >
      <motion.div
        className="bg-white p-8 rounded-lg max-w-lg w-full relative shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#5942E9]">Database Integration</h2>
          <button onClick={closeModal} className="text-[#5942E9] hover:text-red-500">
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </button>
        </div>

        <div className="flex justify-between mb-6">
          <button
            onClick={() => setIsNewDb(false)}
            className={`w-1/2 py-2 text-lg font-semibold rounded-l-lg ${!isNewDb ? 'bg-gradient-to-r from-[#5942E9] to-[#42DFE9] text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            Select Existing Database
          </button>
          <button
            onClick={() => setIsNewDb(true)}
            className={`w-1/2 py-2 text-lg font-semibold rounded-r-lg ${isNewDb ? 'bg-gradient-to-r from-[#5942E9] to-[#42DFE9] text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            Add New Database
          </button>
        </div>

        {/* Display Database Selection Form */}
        {!isNewDb ? (
          <div>
            <label className="block text-gray-700 mb-2">Select Database</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg mb-4"
              value={selectedDb}
              onChange={(e) => setSelectedDb(e.target.value)}
            >
              <option value="">Select a database...</option>
              {existingDbs.map((db) => (
                <option key={db._id} value={db._id}>
                  {db.dbName}
                </option>
              ))}
            </select>
            <button
              onClick={handleConnect}
              disabled={!selectedDb}
              className="w-full bg-gradient-to-r from-[#5942E9] to-[#42DFE9] text-white p-2 rounded-lg shadow-lg mt-4"
            >
              Connect to Database
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* New Database Form Fields */}
            <div className="mb-4">
              <label className="block text-gray-700">Database Name</label>
              <input
                type="text"
                className="w-full p-2 py-3 border border-gray-300 rounded-md focus:border-[#5942E9] text-[#5942E9]"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Host</label>
              <input
                type="text"
                className="w-full p-2 py-3 border border-gray-300 rounded-md focus:border-[#5942E9] text-[#5942E9]"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Port</label>
              <input
                type="number"
                className="w-full p-2 py-3 border border-gray-300 rounded-md focus:border-[#5942E9] text-[#5942E9]"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Username</label>
              <input
                type="text"
                className="w-full p-2 py-3 border border-gray-300 rounded-md focus:border-[#5942E9] text-[#5942E9]"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Password</label>
              <input
                type="password"
                className="w-full p-2 py-3 border border-gray-300 rounded-md focus:border-[#5942E9] text-[#5942E9]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#5942E9] to-[#42DFE9] text-white p-3 rounded-lg shadow-lg"
            >
              <FontAwesomeIcon icon={faDatabase} className="mr-2" />
              Integrate Database
            </button>
          </form>
        )}

        {/* Animation Display */}
        {showAnimation && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
            {animationType === 'success' ? (
              <Player autoplay loop src="/assets/animations/DByes.json"  style={{ height: 100, width: 100 }} />
            ) : (
              <Player autoplay loop src="/assets/animations/DBno.json"  style={{ height: 100, width: 100 }} />
            )}
            <p className="text-white text-lg font-bold">{message}</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

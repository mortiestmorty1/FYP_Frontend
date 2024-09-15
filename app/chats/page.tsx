'use client';
import { useRouter } from 'next/navigation'; // Updated import from next/navigation
import { useEffect, useState } from 'react';

export default function ChatsPage() {
  const router = useRouter();

  useEffect(() => {
    const token = document.cookie.includes('token'); // Simple check for token

    if (!token) {
      router.push('/login'); // Redirect to login if not authenticated
    }
  }, [router]);

  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;

    // Add new message to the chat
    setMessages([...messages, input]);
    setInput(''); // Clear input field
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Chats</h2>

      {/* Chat messages */}
      <div className="bg-gray-100 p-4 rounded-lg mb-4 h-96 overflow-y-auto">
        {messages.map((message, idx) => (
          <div key={idx} className="mb-2">
            <p className="text-gray-700">{message}</p>
          </div>
        ))}
      </div>

      {/* Input field for new message */}
      <form onSubmit={handleSendMessage} className="flex">
        <input
          type="text"
          className="flex-grow p-2 border border-gray-300 rounded-l-lg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600"
        >
          Send
        </button>
      </form>
    </div>
  );
}

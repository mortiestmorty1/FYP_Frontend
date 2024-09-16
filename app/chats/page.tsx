'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import CollapsibleComponent from '../components/CollapsibleComponent';
import UserProfile from '../components/UserProfile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faChartLine, faPlus, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';

interface Message {
  id: number;
  text: string;
}

interface Chat {
  id: number;
  name: string;
  messages: Message[];
}

export default function ChatsPage() {
  const router = useRouter();

  useEffect(() => {
    const token = document.cookie.includes('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chats, setChats] = useState<Chat[]>([
    { id: 1, name: 'Chat 1', messages: [{ id: 1, text: 'Hello from Chat 1!' }] },
    { id: 2, name: 'Chat 2', messages: [{ id: 1, text: 'Hello from Chat 2!' }] },
  ]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [input, setInput] = useState('');

  // Select chat and set active chat ID
  const selectChat = (chatId: number) => {
    setActiveChatId(chatId);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '' || activeChatId === null) return;

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, { id: chat.messages.length + 1, text: input }] }
          : chat
      )
    );
    setInput('');
  };

  const handleCreateNewChat = () => {
    const newChatId = chats.length + 1;
    setChats([...chats, { id: newChatId, name: `Chat ${newChatId}`, messages: [] }]);
    setActiveChatId(newChatId);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Get the active chat by its ID
  const activeChat = chats.find((chat) => chat.id === activeChatId);

  return (
    <div className="flex h-screen">
      {/* Collapsible Sidebar */}
      <motion.div
        className={`bg-gray-100 h-full shadow-lg transition-all duration-500 relative ${isCollapsed ? 'w-0' : 'w-1/4'}`}
      >
        <div className="flex justify-between items-center p-4">
          <h2 className="font-bold text-lg">Chats</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateNewChat}
              className="bg-gradient-to-r from-purple-400 to-blue-500 text-white p-2 rounded-full shadow-lg hover:from-purple-500 hover:to-blue-600 transition-all duration-300"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>

            <button
              onClick={toggleCollapse}
              className="bg-gray-200 p-2 rounded-full shadow-lg hover:bg-gray-300"
            >
              <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <CollapsibleComponent title="Today" onToggleCollapse={toggleCollapse}>
            <div className="space-y-2 text-black">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  className="bg-white p-3 rounded-lg shadow-sm text-black w-full text-left hover:bg-blue-100"
                  onClick={() => selectChat(chat.id)}
                >
                  {chat.name}
                </button>
              ))}
            </div>
          </CollapsibleComponent>
        )}
      </motion.div>

      {/* Main Chat Area */}
      <div className={`flex-grow bg-gray-50 h-full p-4 flex flex-col justify-between transition-all duration-500 ${isCollapsed ? 'ml-0' : 'ml-4'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-grow flex flex-col justify-center items-center"
        >
          <ChatHeader />
          <div className="bg-white p-6 rounded-lg shadow-lg w-full h-full flex flex-col justify-center items-center">
            {activeChat ? (
              activeChat.messages.length === 0 ? (
                <p className="text-center text-black w-full text-lg">Start the conversation...</p>
              ) : (
                activeChat.messages.map((message) => (
                  <div key={message.id} className="bg-blue-100 p-2 rounded-lg w-full text-black">
                    {message.text}
                  </div>
                ))
              )
            ) : (
              <p className="text-center text-gray-500 w-full text-lg">Please select a chat to start</p>
            )}
          </div>
        </motion.div>

        {/* Chat Input with Mic and Chart icons */}
        <form onSubmit={handleSendMessage} className="flex items-center p-3 bg-white shadow-md rounded-lg fixed bottom-0 left-0 right-0 mx-4">
          <button type="button" className="p-2">
            <FontAwesomeIcon icon={faMicrophone} size="lg" className="text-gray-600" />
          </button>
          <input
            type="text"
            className="flex-grow p-3 border-none focus:outline-none text-black"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!activeChat} // Disable input if no chat is selected
          />
          <button type="submit" className="p-2" disabled={!activeChat}>
            <FontAwesomeIcon icon={faChartLine} size="lg" className="text-gray-600" />
          </button>
        </form>
      </div>
    </div>
  );
}

// Chat Header with user profile
function ChatHeader() {
  return (
    <div className="flex justify-between items-center mb-4 w-full">
      {/* Logo */}
      <Link href="/" passHref>
        <Image src="/assets/images/logo.png" alt="Logo" width={150} height={50} className="cursor-pointer" />
      </Link>

      {/* User Profile */}
      <UserProfile />
    </div>
  );
}

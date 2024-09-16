'use client'; // Ensure it's marked as a client-side component

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion'; // For animations
import { useRouter } from 'next/navigation';
import axios from 'axios';
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Fetch chats from the backend
  useEffect(() => {
    const token = document.cookie.includes('token');
    if (!token) {
      router.push('/login');
    }

    const fetchChats = async () => {
      try {
        console.log("Fetching chats...");
        const response = await axios.get('http://localhost:3001/chat'); // API to get chats
        console.log("Chats fetched successfully:", response.data);
        setChats(response.data);
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    fetchChats();
  }, [router]);

  const selectChat = (chatId: number) => {
    setActiveChatId(chatId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '' || activeChatId === null) return;

    try {
      // Send message to backend
      console.log(`Sending message: ${input} to chat ID: ${activeChatId}`);
      await axios.post('http://localhost:3001/chat/message', {
        chatId: activeChatId,
        text: input,
      });

      // Update local state
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, { id: chat.messages.length + 1, text: input }] }
            : chat
        )
      );
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCreateNewChat = async () => {
    console.log("Creating a new chat..."); // Log to check if the function is triggered

    try {
      const response = await axios.post('http://localhost:3001/chat/create', { title: `Chat ${chats.length + 1}` });

      console.log("New chat response:", response.data); // Log the response

      const newChat = response.data.chat;

      // Update the chats state immediately after the new chat is created
      setChats([...chats, newChat]);
      setActiveChatId(newChat.id); // Set the new chat as active
    } catch (error) {
      console.error('Error creating new chat:', error); // Log any error if the API request fails
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Handle voice recording
  const handleStartRecording = () => {
    console.log("Starting voice recording...");
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => setAudioBlob(e.data);
      mediaRecorder.start();
      setIsRecording(true);
    }).catch((error) => {
      console.error('Error accessing microphone:', error);
    });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleUploadVoice = async () => {
    console.log("Uploading voice recording...");
    if (audioBlob) {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');

      try {
        const response = await axios.post('http://localhost:3001/voice-to-text/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const transcribedText = response.data.transcription;
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === activeChatId
              ? { ...chat, messages: [...chat.messages, { id: chat.messages.length + 1, text: transcribedText }] }
              : chat
          )
        );
      } catch (error) {
        console.error('Error uploading voice:', error);
      }
    }
  };

  const activeChat = chats.find((chat) => chat.id === activeChatId);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <motion.div
        className={`bg-gray-100 h-full shadow-lg transition-all duration-500 relative ${isCollapsed ? 'w-0' : 'w-1/4'}`} // Re-added animation
      >
        {!isCollapsed && (
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
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
            </div>
          </div>
        )}
        {isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="bg-gray-200 p-2 absolute top-10 left-0 rounded-full shadow-lg hover:bg-gray-300 z-50"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        )}
        {!isCollapsed && (
          <CollapsibleComponent title="Today" onToggleCollapse={toggleCollapse}>
            <div className="space-y-2 text-black">
              {chats.length === 0 ? (
                <p className="text-center text-gray-500">No chats available</p>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    className="bg-white p-3 rounded-lg shadow-sm text-black w-full text-left hover:bg-blue-100"
                    onClick={() => selectChat(chat.id)}
                  >
                    {chat.name}
                  </button>
                ))
              )}
            </div>
          </CollapsibleComponent>
        )}
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-grow bg-gray-50 h-full p-4 flex flex-col justify-between transition-all duration-500">
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
        <div className="w-full p-4">
          <form
            onSubmit={handleSendMessage}
            className="w-full flex items-center p-2 bg-white shadow-md rounded-lg"
          >
            <button
              type="button"
              className="p-2"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
            >
              <FontAwesomeIcon
                icon={faMicrophone}
                size="lg"
                className={`text-gray-600 ${isRecording ? 'text-red-600' : ''}`}
              />
            </button>
            <input
              type="text"
              className="flex-grow p-3 border-none focus:outline-none text-black mx-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={!activeChat}
            />
            <button
              type="submit"
              className="p-2 ml-2"
              disabled={!activeChat || input.trim() === ''}
            >
              <FontAwesomeIcon icon={faChartLine} size="lg" className="text-gray-600" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Chat Header with user profile
function ChatHeader() {
  return (
    <div className="flex justify-between items-center mb-4 w-full">
      <Link href="/" passHref>
        <Image src="/assets/images/logo.png" alt="Logo" width={150} height={50} className="cursor-pointer" />
      </Link>
      <UserProfile />
    </div>
  );
}

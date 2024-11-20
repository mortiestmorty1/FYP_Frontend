'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion'; 
import { useRouter } from 'next/navigation';
import axios from 'axios';
import CollapsibleComponent from '../components/CollapsibleComponent';
import UserProfile from '../components/UserProfile';
import DBIntegrationModal from '../components/page'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import recordingAnimation from '/Users/shoaibahmed/Desktop/fyp_work/Final_year_project/frontend/public/assets/animations/recording.json';
import { faMicrophone, faChartLine, faPlus, faChevronLeft, faChevronRight, faDatabase } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Player = dynamic(() => import('@lottiefiles/react-lottie-player').then(mod => mod.Player), {
  ssr: false,
});

interface Message {
  id: number;
  text: string;
}

interface Chat {
  _id: number;
  title: string;
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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showDBModal, setShowDBModal] = useState(false); // State for modal visibility
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  // Fetch chats from the backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login'); // Redirect to login if no token is found
    }

    const fetchChats = async () => {
      try {
        console.log("Fetching chats...");
        const response = await axios.get('http://localhost:3001/chat', {
          headers: {
            Authorization: `Bearer ${token}`, // Pass token in headers
          },
        });
        console.log("Chats fetched successfully:", response.data);
        setChats(response.data);
      } catch (error) {
        console.error('Error fetching chats:', error);
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            router.push('/login'); // Redirect to login on unauthorized
          } else {
            console.error("Error:", error.message);
          }
        }
      }
    };

    fetchChats();
  }, [router]);

  const recordingOptions = {
    loop: true,
    autoplay: true,
    animationData: recordingAnimation,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };


  useEffect(() => {
    const initializeRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setAudioBlob(event.data);
          }
        };
        setMediaRecorder(recorder);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Please allow microphone access and reload the page.');
      }
    };
    initializeRecorder();
    return () => {
      mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorder?.stop();
      setIsRecording(false);

      audioStream?.getTracks().forEach((track) => track.stop());

      setTimeout(async () => {
        if (audioBlob) {
          setIsTranscribing(true);  // Start transcribing indication
          const formData = new FormData();
          formData.append('voiceFile', audioBlob, 'audio.webm');

          try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:3001/voice-to-text/upload', formData, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            });

            const rawTranscription = response.data?.data?.transcription;
            if (rawTranscription) {
              const meaningfulText = rawTranscription.replace(/\[.*?\]\s*/g, '').trim();
              setInput(meaningfulText);
            } else {
              alert('Transcription failed. Please try again.');
            }
          } catch (error) {
            console.error('Error uploading audio:', error);
            alert('Failed to upload audio.');
          } finally {
            setIsTranscribing(false);  // Stop transcribing indication
          }
        } else {
          alert('No audio recorded. Please try recording again.');
        }
      }, 500);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);

        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        setMediaRecorder(recorder);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setAudioBlob(new Blob([event.data], { type: event.data.type }));
          }
        };

        recorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Please allow microphone access and try again.');
      }
    }
  };

  const selectChat = (chatId: number) => {
    console.log("Selected chat ID:", chatId);
    setActiveChatId(chatId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Sending message: ${input} to chat ID: ${activeChatId}`);

    if (input.trim() === '' || activeChatId === null) {
      console.error("No active chat selected");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Send message to backend
      await axios.post(
        'http://localhost:3001/chat/message',
        { chatId: activeChatId, text: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state with new message
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === activeChatId
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
    console.log("Creating a new chat...");

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.post('http://localhost:3001/chat/create', 
        { title: `Chat ${chats.length + 1}`, messages: [] }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newChat = response.data.chat;
      setChats([...chats, newChat]);
      setActiveChatId(newChat.id);
    } catch (error) {
      console.error('Error creating new chat:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/login');
      }
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const activeChat = chats.find((chat) => chat._id === activeChatId);

  return (
    <div className="flex h-screen">
      <motion.div
        className={`bg-gray-100 h-full shadow-lg transition-all duration-500 relative ${isCollapsed ? 'w-0' : 'w-1/4'}`}
      >
        {!isCollapsed && (
          <div className="flex justify-between items-center p-4">
            <h2 className="font-bold text-lg text-[#5942E9]">Chats</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCreateNewChat}
                className="bg-gradient-to-r from-purple-400 to-blue-500 text-white p-2 rounded-full shadow-lg hover:from-purple-500 hover:to-blue-600 transition-all duration-300"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
              <button
                onClick={() => setShowDBModal(true)} // Trigger the database modal
                className="bg-gradient-to-r from-purple-400 to-blue-500 text-white p-2 rounded-full shadow-lg hover:from-purple-500 hover:to-blue-600 transition-all duration-300"
              >
                <FontAwesomeIcon icon={faDatabase} />
              </button>
              <button onClick={toggleCollapse} className="bg-gray-200 p-2 rounded-full shadow-lg hover:bg-gray-300">
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
            </div>
          </div>
        )}
        {isCollapsed && (
          <button onClick={toggleCollapse} className="bg-gray-200 p-2 absolute top-10 left-0 rounded-full shadow-lg hover:bg-gray-300 z-50">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        )}
        {!isCollapsed && (
          <CollapsibleComponent
          title="Today"
          onToggleCollapse={toggleCollapse}
          titleStyle={{ color: '#5942E9', fontWeight: 'bold' }} // Apply custom color and styles
          >
            <div className="space-y-2 text-black">
            {chats.length === 0 ? (
                <p className="text-center text-gray-500">No chats available</p>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat._id}  
                    className="bg-white p-3 rounded-lg shadow-sm text-black w-full text-left hover:bg-blue-100"
                    onClick={() => selectChat(chat._id)} 
                  >
                    {chat.title}
                  </button>
                ))
              )}
            </div>
          </CollapsibleComponent>
        )}
      </motion.div>

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
                  <div key={message.id} className="bg-blue-200 p-2 rounded-lg w-full text-black">
                    {message.text}
                  </div>
                ))
              )
            ) : (
              <p className="text-center text-gray-500 w-full text-lg">Please select a chat to start</p>
            )}
          </div>
        </motion.div>

        <div className="w-full p-4">
          <form onSubmit={handleSendMessage} className="w-full flex items-center p-2 bg-white shadow-md rounded-lg">
            <button type="button" className="relative p-2" onClick={toggleRecording}>
              {isRecording && (
                <div className="absolute -top-20 -right-10 ml-5">
                  <Player
                    autoplay
                    loop
                    src={recordingAnimation}
                    style={{ height: 100, width: 100 }}
                  />
                </div>
              )}
              <FontAwesomeIcon icon={faMicrophone} color={isRecording ? 'red' : 'black'} size="lg" />
            </button>
            <input
              type="text"
              className={`flex-grow p-3 border-none focus:outline-none mx-2 ${isTranscribing ? 'text-gray-400 animate-pulse' : 'text-black'}`}
              value={isTranscribing ? 'Transcribing...' : input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={!activeChat || isTranscribing}
            />
            <button type="submit" className="p-2 ml-2" disabled={!activeChat || input.trim() === ''}>
              <FontAwesomeIcon icon={faChartLine} size="lg" className="text-gray-600" />
            </button>
          </form>
        </div>
      </div>

      {/* Render the DBIntegrationPage as a modal */}
      {showDBModal && (
        <DBIntegrationModal showModal={showDBModal} closeModal={() => setShowDBModal(false)} />
      )}
    </div>
  );
}

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

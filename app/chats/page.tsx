'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion'; 
import { useRouter } from 'next/navigation';
import axios from 'axios';
import CollapsibleComponent from '../components/CollapsibleComponent';
import UserProfile from '../components/UserProfile';
import DBIntegrationModal from '../components/page'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import recordingAnimation from '/Users/shoaibahmed/Desktop/final-year/Final_year_project/frontend/public/assets/animations/recording.json';

import { faMicrophone, faChartLine, faPlus, faChevronLeft, faChevronRight, faDatabase,faSpinner } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { Inter, Sora } from 'next/font/google';


const Player = dynamic(() => import('@lottiefiles/react-lottie-player').then(mod => mod.Player), {
  ssr: false,
});

interface Message {
  id: number;
  text: string;
  createdAt: string;
  
}

interface Chat {
  _id: number;
  title: string;
  messages: Message[];
  isTitleLoading?: boolean;
}
interface CategorizedChats {
  today: Chat[];
  yesterday: Chat[];
  previous7Days: Chat[];
  older: Chat[];
}

const categorizeChats = (chats: Chat[]): CategorizedChats => {
  const today: Chat[] = [];
  const yesterday: Chat[] = [];
  const previous7Days: Chat[] = [];
  const older: Chat[] = [];

  chats.forEach((chat) => {
    if (chat.messages.length === 0) return; 
    const lastMessageDate = new Date(chat.messages[chat.messages.length - 1].createdAt);

    if (isToday(lastMessageDate)) {
      today.push(chat);
    } else if (isYesterday(lastMessageDate)) {
      yesterday.push(chat);
    } else if (isThisWeek(lastMessageDate)) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0); 
      const daysDiff = (startOfToday.getTime() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 1 && daysDiff <= 7) {
        previous7Days.push(chat);
      }
    } else {
      older.push(chat);
    }
  });

  
  const sortByDateDesc = (a: Chat, b: Chat) => {
    const dateA = new Date(a.messages[a.messages.length - 1].createdAt).getTime();
    const dateB = new Date(b.messages[b.messages.length - 1].createdAt).getTime();
    return dateB - dateA; 
  };

  return {
    today: today.sort(sortByDateDesc),
    yesterday: yesterday.sort(sortByDateDesc),
    previous7Days: previous7Days.sort(sortByDateDesc),
    older: older.sort(sortByDateDesc),
  };
};

// Initialize fonts
const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter'
});

const sora = Sora({ 
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sora'
});

export default function ChatsPage() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [categorizedChats, setCategorizedChats] = useState<CategorizedChats>({
    today: [],
    yesterday: [],
    previous7Days: [],
    older: [],
  });
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showDBModal, setShowDBModal] = useState(false); 
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isSending, setIsSending] = useState(false);
  

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchChats = async () => {
      try {
        const response = await axios.get('http://localhost:3001/chat', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setChats(response.data);
        setCategorizedChats(categorizeChats(response.data));
      } catch (error) {
        console.error('Error fetching chats:', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push('/login');
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
      console.log("Stopping recording...");
      if (mediaRecorder) {
      
        mediaRecorder.stop();
        setIsRecording(false);
  
       
        if (audioStream) {
          audioStream.getTracks().forEach((track) => track.stop());
          setAudioStream(null);
        }
  
        
        const finalizedBlob = await new Promise<Blob | null>((resolve) => {
          const chunks: Blob[] = [];
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };
  
          mediaRecorder.onstop = () => {
            if (chunks.length > 0) {
              const finalBlob = new Blob(chunks, { type: "audio/webm" });
              console.log("Recording finalized. Blob size:", finalBlob.size);
              resolve(finalBlob);
            } else {
              console.error("No audio data available.");
              resolve(null);
            }
          };
        });
  
       
        if (finalizedBlob) {
          setAudioBlob(finalizedBlob);
          console.log("Audio blob ready for transcription:", finalizedBlob);
  

          try {
            console.log("Uploading audio blob for transcription...");
            setIsTranscribing(true);
  
            const formData = new FormData();
            formData.append("voiceFile", finalizedBlob, "audio.webm");
  
            const token = localStorage.getItem("token");
            const response = await axios.post("http://localhost:3001/voice-to-text/upload", formData, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            });
  
            const rawTranscription = response.data?.data?.transcription;
            if (rawTranscription) {
              const meaningfulText = rawTranscription.replace(/\[.*?\]\s*/g, "").trim();
              setInput(meaningfulText); 
            } else {
              alert("Transcription failed. Please try again.");
            }
          } catch (error) {
            console.error("Error uploading audio:", error);
            alert("Failed to upload audio.");
          } finally {
            setIsTranscribing(false);
          }
        } else {
          alert("No audio recorded. Please try again.");
        }
      }
    } else {
      try {
        console.log("Starting recording...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
  
        const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
        const recorder = new MediaRecorder(stream, { mimeType });
        setMediaRecorder(recorder);
  
        recorder.start();
        setIsRecording(true);
        console.log("Recording started...");
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Please allow microphone access and try again.");
      }
    }
  };
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'; 
    textarea.style.height = `${textarea.scrollHeight}px`; 
  };
  
  
  const selectChat = (chatId: number) => {
    console.log("Selected chat ID:", chatId);
    setActiveChatId(chatId); 
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;
  
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    let chatId = activeChatId;
    setIsSending(true);
  
    try {
      if (!chatId) {
        const createChatResponse = await axios.post(
          'http://localhost:3001/chat/create',
          { title: 'New Chat', messages: [] },
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        const newChat = createChatResponse.data.chat;
        const updatedChats = [...chats, { ...newChat, isTitleLoading: true }];
        setChats(updatedChats);
        setCategorizedChats(categorizeChats(updatedChats));
        setActiveChatId(newChat._id);
        chatId = newChat._id;
      }
  
      // Set loading state before sending message
      const updatedChats = chats.map((chat) =>
        chat._id === chatId ? { ...chat, isTitleLoading: true } : chat
      );
      setChats(updatedChats);
      setCategorizedChats(categorizeChats(updatedChats));
  
      const messageResponse = await axios.post(
        'http://localhost:3001/chat/message',
        { chatId, text: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const updatedChat = messageResponse.data.chat;
  
      // Update chats with new message and maintain loading state if it's the first message
      const chatsWithNewMessage = chats.map((chat) =>
        chat._id === chatId ? { 
          ...chat, 
          messages: updatedChat.messages, 
          isTitleLoading: updatedChat.messages.length === 1 
        } : chat
      );
      setChats(chatsWithNewMessage);
      setCategorizedChats(categorizeChats(chatsWithNewMessage));
  
      // If this is the first message, wait for title generation
      if (updatedChat.messages.length === 1) {
        // Wait for a short time to show the loading state
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update the chat with the title from the response
        const finalChats = chatsWithNewMessage.map((chat) =>
          chat._id === chatId ? { 
            ...chat, 
            title: updatedChat.title,
            isTitleLoading: false 
          } : chat
        );
        setChats(finalChats);
        setCategorizedChats(categorizeChats(finalChats));
      } else {
        // If not the first message, remove loading state
        const finalChats = chatsWithNewMessage.map((chat) =>
          chat._id === chatId ? { ...chat, isTitleLoading: false } : chat
        );
        setChats(finalChats);
        setCategorizedChats(categorizeChats(finalChats));
      }
  
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      // If there's an error, make sure to remove loading state
      const errorChats = chats.map((chat) =>
        chat._id === chatId ? { ...chat, isTitleLoading: false } : chat
      );
      setChats(errorChats);
      setCategorizedChats(categorizeChats(errorChats));
    } finally {
      setIsSending(false);
    }
  };
  
  
  const handleCreateNewChat = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  
    try {
      const response = await axios.post(
        'http://localhost:3001/chat/create',
        { title: `Chat ${chats.length + 1}`, messages: [] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const newChat = { ...response.data.chat, isTitleLoading: true }; 
      const updatedChats = [...chats, newChat];
      setChats(updatedChats);
      setCategorizedChats(categorizeChats(updatedChats));
      setActiveChatId(newChat._id); 
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const activeChat = chats.find((chat) => chat._id === activeChatId);

  return (
    <div className={`flex h-screen ${inter.variable} ${sora.variable}`}>
     <motion.div
    className={`bg-gray-100 h-full shadow-lg transition-all duration-500 relative ${
      isCollapsed ? 'w-0' : 'w-1/4'
    }`}
  >
    {!isCollapsed && (
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="flex justify-between items-center p-4">
          <h2 className={`font-bold text-lg text-[#5942E9] font-sora`}>Chats</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateNewChat}
              className="bg-gradient-to-r from-purple-400 to-blue-500 text-white p-2 rounded-full shadow-lg hover:from-purple-500 hover:to-blue-600 transition-all duration-300"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <button
              onClick={() => setShowDBModal(true)}
              className="bg-gradient-to-r from-purple-400 to-blue-500 text-white p-2 rounded-full shadow-lg hover:from-purple-500 hover:to-blue-600 transition-all duration-300"
            >
              <FontAwesomeIcon icon={faDatabase} />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="bg-gray-200 p-2 rounded-full shadow-lg hover:bg-gray-300"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
          </div>
        </div>

        {/* Scrollable Chat List */}
        <div className="flex-grow overflow-y-auto p-4 space-y-6">
          {Object.entries(categorizedChats).map(([category, chats]) => (
            <div key={category} className="space-y-2">
              <h3 className={`text-[#5942E9] font-bold text-sm mb-3 font-sora px-2`}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h3>
              <div className="space-y-1">
                {chats.length === 0 ? (
                  <p className="text-center text-gray-500 font-inter text-sm px-2">No chats available</p>
                ) : (
                  chats.map((chat: Chat) => (
                    <button
                      key={chat._id}
                      className={`w-full text-left text-black px-3 py-2 rounded-md transition-all duration-300 ${
                        chat.isTitleLoading 
                          ? 'bg-gradient-to-r from-gray-100 to-gray-200' 
                          : 'hover:text-[#5942E9] hover:bg-gray-200'
                      } truncate flex items-center font-inter text-sm`}
                      onClick={() => !chat.isTitleLoading && selectChat(chat._id)}
                      disabled={chat.isTitleLoading}
                    >
                      {chat.isTitleLoading ? (
                        <span className="flex items-center gap-2 w-full">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-[#5942E9] rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-3 h-3 bg-[#5942E9] rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-3 h-3 bg-[#5942E9] rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-gray-500 text-sm animate-pulse">Generating Title...</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {chat.title || 'New Chat'}
                        </span>
                      )}
                    </button>                 
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    {isCollapsed && (
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-10 left-0 bg-gray-200 p-2 rounded-full shadow-lg hover:bg-gray-300 z-50"
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
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
                  <p className="text-center text-black w-full text-lg font-inter">Start the conversation...</p>
                ) : (
                  activeChat.messages.map((message) => (
                    <div key={message.id} className="bg-blue-200 p-2 rounded-lg w-full text-black font-inter">
                      {message.text}
                    </div>
                  ))
                )
              ) : (
                <p className="text-center text-gray-500 w-full text-lg font-inter">Please select a chat to start</p>
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
            <textarea
                className={`flex-grow p-3 border-none focus:outline-none mx-2 resize-none font-inter ${
                  isTranscribing ? 'text-gray-400 animate-pulse' : 'text-black'
                }`}
                value={isTranscribing ? 'Transcribing...' : input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResize(e.target);
                }}
                placeholder="Type a message..."
                disabled={!activeChat || isTranscribing || isSending}
                rows={1} 
              />
           <button
              type="submit"
              className={`p-2 ml-2 ${isSending ? 'cursor-not-allowed' : ''}`}
              disabled={isSending || !input.trim()}
            >
              {isSending ? (
                <FontAwesomeIcon icon={faSpinner} spin className="text-gray-500" />
              ) : (
                <FontAwesomeIcon icon={faChartLine} size="lg" className="text-gray-600" />
              )}
            </button>

          </form>
        </div>
      </div>
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
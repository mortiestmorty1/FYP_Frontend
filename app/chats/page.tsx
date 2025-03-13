'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion'; 
import { useRouter } from 'next/navigation';
import axios from 'axios';
import CollapsibleComponent from '../components/CollapsibleComponent';
import UserProfile from '../components/UserProfile';
import DBIntegrationModal from '../components/DBIntegrationModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import recordingAnimation from '/Users/shoaibahmed/Desktop/final-year/Final_year_project/frontend/public/assets/animations/recording.json';

import { faMicrophone, faChartLine, faPlus, faChevronLeft, faChevronRight, faDatabase,faSpinner, faUser, faRobot, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
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
  isQueryResult?: boolean;
  queryResults?: any[];
  _id?: string;
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

const categorizeChats = (chats: Chat[] | null | undefined): CategorizedChats => {
  if (!Array.isArray(chats)) {
    console.error("❌ categorizeChats received invalid data:", chats);
    return { today: [], yesterday: [], previous7Days: [], older: [] };
  }

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
      previous7Days.push(chat);
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
  const [connectedDbId, setConnectedDbId] = useState<string | null>(null);
  

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

  useEffect(() => {
    const fetchActiveDatabase = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/database/active', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.activeDatabase) {
          setConnectedDbId(response.data.activeDatabase._id);
        } else {
          setConnectedDbId(null);
        }
      } catch (error) {
        console.error('No active database found');
        setConnectedDbId(null);
      }
    };
    fetchActiveDatabase();
  }, []);

  const handleDatabaseConnectionChange = (dbId: string | null) => {
    setConnectedDbId(dbId);
  };

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
            // Convert the blob to a file with a proper name and type
            const audioFile = new File([finalizedBlob], "audio.webm", { type: "audio/webm" });
            formData.append("file", audioFile);  // Changed from "voiceFile" to "file" to match Flask API
  
            console.log("Sending request to server...");
            const response = await axios.post("http://localhost:5001/transcribe", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
                "Accept": "application/json",
              },
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
                console.log(`Upload progress: ${percentCompleted}%`);
              },
              timeout: 30000, // 30 second timeout
            });

            console.log("Server response:", response.data);
  
            if (response.data && response.data.transcription) {
              const meaningfulText = response.data.transcription.replace(/\[.*?\]\s*/g, "").trim();
              setInput(meaningfulText); 
            } else {
              console.error("Invalid response format:", response.data);
              alert("Transcription failed: Invalid response format");
            }
          } catch (error) {
            console.error("Error uploading audio:", error);
            if (axios.isAxiosError(error)) {
              if (error.code === 'ERR_NETWORK') {
                console.error("Network error - Make sure the Whisper API server is running on port 5001");
                alert("Could not connect to the transcription service. Please make sure the service is running.");
              } else {
                console.error("Axios error details:", {
                  status: error.response?.status,
                  data: error.response?.data,
                  headers: error.response?.headers
                });
                alert(`Failed to upload audio: ${error.response?.data?.message || error.message}`);
              }
            } else {
              alert("Failed to upload audio. Please try again.");
            }
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
        setChats((prevChats) => {
          const updatedChats = Array.isArray(prevChats) ? [...prevChats, { ...newChat, isTitleLoading: true }] : [newChat];
          setCategorizedChats(categorizeChats(updatedChats));
          return updatedChats;
        });
        setActiveChatId(newChat._id);
        chatId = newChat._id;
      }

      const isSQLQuery = /\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(input);

      if (isSQLQuery) {
        console.log('📌 SQL Query detected:', input);
        console.log('🔗 Connected DB ID:', connectedDbId);

        if (!connectedDbId) {
          const errorMessage = {
            id: Date.now(),
            text: '❌ Please connect to a database first using the database button in the sidebar.',
            createdAt: new Date().toISOString(),
            isQueryResult: true
          };

          setChats((prevChats) => {
            const updatedChats = Array.isArray(prevChats) ? 
              prevChats.map((chat) =>
                chat._id === chatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat
              ) : [];
            setCategorizedChats(categorizeChats(updatedChats));
            return updatedChats;
          });
          return;
        }

        try {
          console.log('🚀 Executing query on database:', connectedDbId);

          const queryResponse = await axios.post(
            `http://localhost:3001/database/query/${connectedDbId}`,
            { query: input.trim(), chatId },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          console.log('✅ Query response:', queryResponse.data);

          if (queryResponse.data.success && queryResponse.data.chat) {
            // Create a response message that includes both the success message and query results
            const responseMessage = {
              id: Date.now(),
              text: queryResponse.data.message || 'Query executed successfully',
              createdAt: new Date().toISOString(),
              isQueryResult: true,
              queryResults: queryResponse.data.queryResults
            };

            setChats((prevChats) => {
              const updatedChats = Array.isArray(prevChats) ? 
                prevChats.map((chat) =>
                  chat._id === queryResponse.data.chat._id ? {
                    ...queryResponse.data.chat,
                    messages: [...queryResponse.data.chat.messages, responseMessage]
                  } : chat
                ) : [queryResponse.data.chat];
              setCategorizedChats(categorizeChats(updatedChats));
              return updatedChats;
            });
            setInput('');
          } else {
            console.error("⚠️ Query execution failed:", queryResponse.data);
            throw new Error(queryResponse.data.message || 'Query execution failed');
          }
        } catch (error) {
          console.error('❌ Error executing query:', error);
          const errorMessage = {
            id: Date.now(),
            text: axios.isAxiosError(error) ? 
              `❌ Error executing query: ${error.response?.data?.message || error.message}` : 
              '❌ Error executing query',
            createdAt: new Date().toISOString(),
            isQueryResult: true
          };

          setChats((prevChats) => {
            const updatedChats = Array.isArray(prevChats) ? 
              prevChats.map((chat) =>
                chat._id === chatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat
              ) : [];
            setCategorizedChats(categorizeChats(updatedChats));
            return updatedChats;
          });
        }
      } else {
        // Handle normal text messages
        const messageResponse = await axios.post(
          'http://localhost:3001/chat/message',
          { chatId, text: input },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setChats((prevChats) => {
          const updatedChats = Array.isArray(prevChats) ? 
            prevChats.map((chat) =>
              chat._id === chatId ? { ...messageResponse.data.chat } : chat
            ) : [messageResponse.data.chat];
          setCategorizedChats(categorizeChats(updatedChats));
          return updatedChats;
        });
      }

      setInput('');
    } catch (error) {
      console.error('❌ Error sending message:', error);
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
    <div className={`flex h-screen ${inter.variable} ${sora.variable} bg-white`}>
      {/* Sidebar */}
      <motion.div
        className={`bg-gray-50 h-full transition-all duration-500 relative ${
          isCollapsed ? 'w-0' : 'w-64'
        }`}
      >
        {!isCollapsed && (
          <div className="flex flex-col h-full px-2">
            {/* Header Section */}
            <div className="flex justify-between items-center p-4">
              <h2 className={`font-bold text-lg text-[#5942E9] font-sora`}>Chats</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCreateNewChat}
                  className="bg-gradient-to-r from-[#5942E9] to-[#42DFE9] text-white p-2 rounded-full hover:opacity-90 transition-all duration-300"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
                <button
                  onClick={() => setShowDBModal(true)}
                  className="bg-gradient-to-r from-[#5942E9] to-[#42DFE9] text-white p-2 rounded-full hover:opacity-90 transition-all duration-300"
                >
                  <FontAwesomeIcon icon={faDatabase} />
                </button>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
              </div>
            </div>

            {/* Scrollable Chat List */}
            <div className="flex-grow overflow-y-auto">
              {Object.entries(categorizedChats).map(([category, chats]) => (
                <div key={category} className="mb-4">
                  <h3 className={`text-[#5942E9] font-bold text-sm px-4 py-2 font-sora`}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                  <div>
                    {chats.length === 0 ? (
                      <p className="text-center text-gray-500 font-inter text-sm px-4">No chats available</p>
                    ) : (
                      chats.map((chat: Chat) => (
                        <button
                          key={chat._id}
                          className={`w-full text-left px-4 py-3 mx-2 my-1 transition-all duration-300 ${
                            chat._id === activeChatId
                              ? 'bg-gradient-to-r from-[#5942E9] to-[#42DFE9] text-white rounded-xl'
                              : chat.isTitleLoading 
                                ? 'bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl' 
                                : 'hover:bg-gray-100 rounded-xl'
                          } truncate flex items-center font-inter text-sm`}
                          onClick={() => !chat.isTitleLoading && selectChat(chat._id)}
                          disabled={chat.isTitleLoading}
                        >
                          {chat.isTitleLoading ? (
                            <span className="flex items-center gap-2 w-full">
                              <div className="flex items-center space-x-2">
                                <div className="w-2.5 h-2.5 bg-[#42DFE9] rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2.5 h-2.5 bg-[#42DFE9] rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2.5 h-2.5 bg-[#42DFE9] rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: '300ms' }}></div>
                              </div>
                              <span className="text-gray-700 text-sm font-medium">Generating Title...</span>
                            </span>
                          ) : (
                            <span className="truncate">
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
            className="absolute top-4 -right-10 bg-gray-100 p-2 rounded-full hover:bg-gray-200"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        )}
      </motion.div>

      {/* Main Content */}
      <div className="flex-grow h-full flex flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-grow flex flex-col h-full overflow-hidden"
        >
          <div className="px-6 py-3 flex-shrink-0">
            <div className="max-w-[1200px] w-full mx-auto px-4">
              <ChatHeader />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {activeChat ? (
              activeChat.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <h2 className="text-2xl font-sora text-gray-700">Welcome to VoxAi SQL</h2>
                  <p className="text-gray-500 font-inter text-center max-w-md">
                    Start a conversation by typing your message or using voice input. I'll help you convert your natural language into SQL queries and provide you with the results.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col w-full pb-4">
                  {activeChat.messages.map((message, index) => (
                    <div 
                      key={message.id} 
                      className={`w-full py-6 ${
                        message.isQueryResult ? 'bg-white border-y border-gray-100' : 'bg-white'
                      }`}
                    >
                      <div className="max-w-3xl mx-auto px-4">
                        <div className={`flex items-start space-x-4 ${
                          message.isQueryResult ? '' : 'flex-row-reverse space-x-reverse'
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.isQueryResult ? 'bg-[#5942E9]' : 'bg-gray-300'
                          }`}>
                            {message.isQueryResult ? (
                              <FontAwesomeIcon icon={faRobot} className="text-white" />
                            ) : (
                              <FontAwesomeIcon icon={faUser} className="text-white" />
                            )}
                          </div>
                          <div className={`flex-1 space-y-2 ${
                            message.isQueryResult ? '' : 'text-right'
                          }`}>
                            <div className="text-sm font-sora text-gray-500">
                              {message.isQueryResult ? 'VoxAi SQL' : 'You'}
                            </div>
                            <div className={`prose prose-sm max-w-none ${
                              message.isQueryResult ? 'text-gray-700' : 'text-gray-800'
                            } font-inter leading-relaxed`}>
                              {message.text}
                            </div>
                            {message.isQueryResult && message.queryResults && message.queryResults.length > 0 && (
                              <div className="mt-4 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-[#5942E9] to-[#42DFE9]">
                                      <tr>
                                        {Object.keys(message.queryResults[0]).map((col, index) => (
                                          <th key={index} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {message.queryResults.map((row, rowIndex) => (
                                        <tr key={rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
                                          {Object.values(row).map((value, colIndex) => (
                                            <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                              {typeof value === 'string' && value.includes('T') ? 
                                                new Date(value).toLocaleString() : 
                                                String(value)}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                                  <p className="text-xs text-gray-500">
                                    Showing {message.queryResults.length} results
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <h2 className="text-2xl font-sora text-gray-700">Select a Chat</h2>
                <p className="text-gray-500 font-inter text-center max-w-md">
                  Choose a chat from the sidebar or create a new one to start a conversation.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Input Area */}
        <div className="w-full bg-white px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSendMessage} className="w-full">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-xl transition-colors duration-200">
                <button 
                  type="button" 
                  className="relative p-3 text-gray-400 hover:text-gray-600 transition-colors" 
                  onClick={toggleRecording}
                >
                  {isRecording && (
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2">
                      <Player
                        autoplay
                        loop
                        src={recordingAnimation}
                        style={{ height: '100px', width: '100px' }}
                      />
                    </div>
                  )}
                  <FontAwesomeIcon icon={faMicrophone} color={isRecording ? '#5942E9' : 'currentColor'} size="lg" />
                </button>
                <textarea
                  className={`flex-grow py-3 px-2 bg-transparent focus:outline-none resize-none font-inter text-gray-800 placeholder-gray-400 min-h-[24px] max-h-[200px] ${
                    isTranscribing ? 'text-gray-400 animate-pulse' : ''
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
                  className={`p-3 text-gray-400 hover:text-[#5942E9] transition-colors ${
                    isSending ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  disabled={isSending || !input.trim()}
                >
                  {isSending ? (
                    <FontAwesomeIcon icon={faSpinner} spin className="text-gray-400" />
                  ) : (
                    <FontAwesomeIcon icon={faPaperPlane} size="lg" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showDBModal && (
        <DBIntegrationModal 
          showModal={showDBModal} 
          closeModal={() => setShowDBModal(false)}
          onConnectionChange={handleDatabaseConnectionChange}
        />
      )}
    </div>
  );
}

function ChatHeader() {
  return (
    <div className="flex justify-between items-center w-full">
      <div className="pl-2">
        <Link href="/" passHref>
          <Image src="/assets/images/logo.png" alt="Logo" width={120} height={40} className="cursor-pointer" />
        </Link>
      </div>
      <div className="pr-2">
        <UserProfile />
      </div>
    </div>
  );
}
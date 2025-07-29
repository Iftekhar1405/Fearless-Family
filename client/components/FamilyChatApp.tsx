// import React, { useState, useEffect, useRef } from 'react';
// import { Send, Users, Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react';

// // Mock your hooks for demonstration - replace with actual imports
// const useWebSocketWithQuery = (userId, username) => {
//   const [isConnected, setIsConnected] = useState(false);
//   const [currentFamilyId, setCurrentFamilyId] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [typingUsers, setTypingUsers] = useState([]);
//   const [onlineUsers, setOnlineUsers] = useState([]);
//   const [isLoadingMessages, setIsLoadingMessages] = useState(false);

//   // Simulate connection after mount
//   useEffect(() => {
//     const timer = setTimeout(() => setIsConnected(true), 1000);
//     return () => clearTimeout(timer);
//   }, []);

//   // Mock methods
//   const joinFamily = async (familyId) => {
//     setCurrentFamilyId(familyId);
//     setIsLoadingMessages(true);
//     // Simulate loading
//     setTimeout(() => {
//       setMessages([
//         {
//           id: '1',
//           senderId: 'user1',
//           senderName: 'John Doe',
//           content: 'Hey everyone! 👋',
//           timestamp: new Date(Date.now() - 60000),
//           familyId
//         },
//         {
//           id: '2',
//           senderId: 'user2',
//           senderName: 'Jane Smith',
//           content: 'Hello! How is everyone doing?',
//           timestamp: new Date(Date.now() - 30000),
//           familyId
//         }
//       ]);
//       setOnlineUsers([
//         { socketId: 'socket1', username: 'John Doe' },
//         { socketId: 'socket2', username: 'Jane Smith' }
//       ]);
//       setIsLoadingMessages(false);
//     }, 1000);
//   };

//   const sendMessage = async (content) => {
//     const newMessage = {
//       id: Date.now().toString(),
//       senderId: userId,
//       senderName: username,
//       content,
//       timestamp: new Date(),
//       familyId: currentFamilyId
//     };
//     setMessages(prev => [...prev, newMessage]);
//   };

//   const sendTypingIndicator = (isTyping) => {
//     // Mock typing indicator
//   };

//   const leaveFamily = async () => {
//     setCurrentFamilyId(null);
//     setMessages([]);
//     setOnlineUsers([]);
//   };

//   return {
//     isConnected,
//     currentFamilyId,
//     messages,
//     typingUsers,
//     onlineUsers,
//     isLoadingMessages,
//     joinFamily,
//     sendMessage,
//     sendTypingIndicator,
//     leaveFamily,
//     isSendingMessage: false
//   };
// };

// const useFamilies = () => {
//   return {
//     data: [
//       { id: 'family1', name: 'Smith Family', memberCount: 5 },
//       { id: 'family2', name: 'Johnson Family', memberCount: 3 },
//       { id: 'family3', name: 'Brown Family', memberCount: 7 }
//     ],
//     isLoading: false,
//     error: null
//   };
// };

// // Main Chat Component
// const FamilyChatApp = () => {
//   const [userId] = useState('currentUser');
//   const [username] = useState('Current User');
//   const [selectedFamilyId, setSelectedFamilyId] = useState(null);
//   const [messageText, setMessageText] = useState('');
//   const [isTyping, setIsTyping] = useState(false);
  
//   const messagesEndRef = useRef(null);
//   const typingTimeoutRef = useRef(null);

//   // Use your custom hooks
//   const { data: families, isLoading: loadingFamilies } = useFamilies();
//   const {
//     isConnected,
//     currentFamilyId,
//     messages,
//     typingUsers,
//     onlineUsers,
//     isLoadingMessages,
//     joinFamily,
//     sendMessage,
//     sendTypingIndicator,
//     leaveFamily,
//     isSendingMessage
//   } = useWebSocketWithQuery(userId, username);

//   // Auto-scroll to bottom when new messages arrive
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   // Handle family selection
//   const handleFamilySelect = async (familyId) => {
//     if (currentFamilyId) {
//       await leaveFamily();
//     }
//     setSelectedFamilyId(familyId);
//     await joinFamily(familyId);
//   };

//   // Handle message sending
//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!messageText.trim() || !currentFamilyId || isSendingMessage) return;

//     await sendMessage(messageText.trim());
//     setMessageText('');
//     handleStopTyping();
//   };

//   // Handle typing indicators
//   const handleStartTyping = () => {
//     if (!isTyping) {
//       setIsTyping(true);
//       sendTypingIndicator(true);
//     }

//     // Clear existing timeout
//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current);
//     }

//     // Set new timeout to stop typing
//     typingTimeoutRef.current = setTimeout(() => {
//       handleStopTyping();
//     }, 2000);
//   };

//   const handleStopTyping = () => {
//     if (isTyping) {
//       setIsTyping(false);
//       sendTypingIndicator(false);
//     }
//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current);
//       typingTimeoutRef.current = null;
//     }
//   };

//   const handleInputChange = (e) => {
//     setMessageText(e.target.value);
//     if (e.target.value.trim()) {
//       handleStartTyping();
//     } else {
//       handleStopTyping();
//     }
//   };

//   // Format timestamp
//   const formatTime = (timestamp) => {
//     const date = new Date(timestamp);
//     const now = new Date();
//     const diffInHours = (now - date) / (1000 * 60 * 60);

//     if (diffInHours < 24) {
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     } else {
//       return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
//     }
//   };

//   return (
//     <div className="flex h-screen bg-gray-100">
//       {/* Family Selection Sidebar */}
//       <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//         <div className="p-4 border-b border-gray-200">
//           <h1 className="text-xl font-semibold text-gray-800">Family Chat</h1>
//           <div className="flex items-center mt-2">
//             {isConnected ? (
//               <><Wifi className="w-4 h-4 text-green-500 mr-2" /><span className="text-sm text-green-600">Connected</span></>
//             ) : (
//               <><WifiOff className="w-4 h-4 text-red-500 mr-2" /><span className="text-sm text-red-600">Disconnected</span></>
//             )}
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           {loadingFamilies ? (
//             <div className="flex items-center justify-center p-8">
//               <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
//             </div>
//           ) : (
//             <div className="p-4 space-y-2">
//               <h2 className="text-sm font-medium text-gray-600 mb-3">Your Families</h2>
//               {families?.map((family) => (
//                 <button
//                   key={family.id}
//                   onClick={() => handleFamilySelect(family.id)}
//                   className={`w-full text-left p-3 rounded-lg transition-colors ${
//                     currentFamilyId === family.id
//                       ? 'bg-blue-50 border border-blue-200'
//                       : 'hover:bg-gray-50 border border-transparent'
//                   }`}
//                 >
//                   <div className="font-medium text-gray-900">{family.name}</div>
//                   <div className="text-sm text-gray-500 flex items-center mt-1">
//                     <Users className="w-3 h-3 mr-1" />
//                     {family.memberCount} members
//                   </div>
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Online Users */}
//         {currentFamilyId && onlineUsers.length > 0 && (
//           <div className="p-4 border-t border-gray-200">
//             <h3 className="text-sm font-medium text-gray-600 mb-2">Online Now</h3>
//             <div className="space-y-1">
//               {onlineUsers.map((user, index) => (
//                 <div key={index} className="flex items-center text-sm">
//                   <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
//                   <span className="text-gray-700">{user.username || 'Anonymous'}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Chat Area */}
//       <div className="flex-1 flex flex-col">
//         {currentFamilyId ? (
//           <>
//             {/* Chat Header */}
//             <div className="bg-white border-b border-gray-200 p-4">
//               <h2 className="text-lg font-semibold text-gray-800">
//                 {families?.find(f => f.id === currentFamilyId)?.name || 'Family Chat'}
//               </h2>
//               <div className="text-sm text-gray-500">
//                 {onlineUsers.length} online
//               </div>
//             </div>

//             {/* Messages Area */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-4">
//               {isLoadingMessages ? (
//                 <div className="flex items-center justify-center h-full">
//                   <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
//                 </div>
//               ) : (
//                 <>
//                   {messages.map((message) => {
//                     const isOwnMessage = message.senderId === userId;
//                     return (
//                       <div
//                         key={message.id}
//                         className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
//                       >
//                         <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
//                           isOwnMessage
//                             ? 'bg-blue-500 text-white'
//                             : 'bg-white border border-gray-200 text-gray-800'
//                         }`}>
//                           {!isOwnMessage && (
//                             <div className="text-xs font-medium mb-1 text-gray-600">
//                               {message.senderName || 'Anonymous'}
//                             </div>
//                           )}
//                           <div className="break-words">{message.content}</div>
//                           <div className={`text-xs mt-1 ${
//                             isOwnMessage ? 'text-blue-100' : 'text-gray-500'
//                           }`}>
//                             {formatTime(message.timestamp)}
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}

//                   {/* Typing Indicators */}
//                   {typingUsers.length > 0 && (
//                     <div className="flex justify-start">
//                       <div className="bg-gray-100 px-4 py-2 rounded-lg">
//                         <div className="text-sm text-gray-600">
//                           {typingUsers.map(u => u.username || 'Someone').join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
//                         </div>
//                         <div className="flex space-x-1 mt-1">
//                           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                   <div ref={messagesEndRef} />
//                 </>
//               )}
//             </div>

//             {/* Message Input */}
//             <div className="bg-white border-t border-gray-200 p-4">
//               <div className="flex space-x-2">
//                 <input
//                   type="text"
//                   value={messageText}
//                   onChange={handleInputChange}
//                   onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
//                   placeholder="Type your message..."
//                   className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   disabled={!isConnected || isSendingMessage}
//                 />
//                 <button
//                   onClick={handleSendMessage}
//                   disabled={!messageText.trim() || !isConnected || isSendingMessage}
//                   className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//                 >
//                   {isSendingMessage ? (
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                   ) : (
//                     <Send className="w-4 h-4" />
//                   )}
//                 </button>
//               </div>
//             </div>
//           </>
//         ) : (
//           /* No Family Selected */
//           <div className="flex-1 flex items-center justify-center bg-gray-50">
//             <div className="text-center">
//               <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//               <h2 className="text-xl font-semibold text-gray-600 mb-2">Welcome to Family Chat</h2>
//               <p className="text-gray-500">Select a family from the sidebar to start chatting</p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default FamilyChatApp;
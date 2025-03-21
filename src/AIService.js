import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import aiIcon from './images/ai-icon.png'; // Adjust path if needed

const AIChat = ({ onClose, initialMessage }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState(null);
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isSendingRef = useRef(false); // Guard against multiple sends

  // Get username from localStorage
  const userName = localStorage.getItem('username') || 'User';

  // Enhanced text formatting with robust regex
  const formatText = (text) => {
    let cleanedText = text.replace(/undefined/g, '').trim();
    let parts = [cleanedText];
    const regexPatterns = [
      { pattern: /(\*\*\*[^\*]+\*\*\*)/g, style: 'font-bold italic', strip: /\*\*\*/g },
      { pattern: /(\*\*[^\*]+\*\*)/g, style: 'font-bold', strip: /\*\*/g },
      { pattern: /(\*[^\*]+\*)/g, style: 'italic', strip: /\*/g },
    ];

    regexPatterns.forEach(({ pattern, style, strip }) => {
      parts = parts.flatMap((part) => {
        if (typeof part !== 'string') return [part];
        return part.split(pattern).map((subPart, index) => {
          if (subPart.match(pattern)) {
            const content = subPart.replace(strip, '');
            return (
              <span key={index} className={`${style} text-blue-700`}>
                {content}
              </span>
            );
          }
          return subPart;
        });
      });
    });

    return parts.map((part, index) =>
      typeof part === 'string' ? (
        <span key={index} className="text-gray-700">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Typewriter effect for AI responses
  const Typewriter = ({ text, speed = 20 }) => {
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
      setDisplayText('');
      setIsTyping(true);
      let index = 0;
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayText((prev) => prev + text[index]);
          index++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, speed);
      return () => clearInterval(interval);
    }, [text, speed]);

    return (
      <span>
        {formatText(displayText)}
        {isTyping && <span className="animate-pulse text-blue-500 ml-1">✦</span>}
      </span>
    );
  };

  // Send message to backend with guard
  const sendMessage = useCallback(
    async (messageText, requestType = 'chat') => {
      if (isSendingRef.current) return; // Prevent multiple sends
      isSendingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found—please log in.');
        }

        const res = await axios.post(
          'http://localhost:8080/api/ai/chat',
          {
            message: messageText,
            requestType,
            username: userName,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        let aiResponse = res.data.response;
        if (!aiResponse || aiResponse.includes('undefined')) {
          aiResponse = `Hey ${userName}, I didn’t catch that—can you say more?`;
        }

        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: aiResponse, isNew: true, type: requestType },
        ]);
      } catch (error) {
        console.error('Send message error:', error.response?.data || error.message);
        let errorMessage = 'Failed to connect to AI, bro!';
        if (error.message === 'No token found—please log in.') {
          errorMessage = 'Please log in to continue chatting, bro!';
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (error.response && error.response.status === 401) {
          errorMessage = 'Your session expired—log in again, bro!';
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (error.response && error.response.status === 500) {
          errorMessage = 'Server error—try again later, bro!';
        }
        setError(errorMessage);
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: `Sorry, something broke, ${userName}!`, isNew: true, type: 'error' },
        ]);
      } finally {
        setLoading(false);
        isSendingRef.current = false; // Reset guard
      }
    },
    [userName]
  );

  // Fetch chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found—please log in.');
        }

        const res = await axios.get('http://localhost:8080/api/ai/chat', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const historyData = res.data || [];
        if (!Array.isArray(historyData)) {
          throw new Error('Invalid chat history format received from server');
        }

        const historyMessages = historyData.map((msg) => ({
          ...msg,
          isNew: false,
          sender: msg.sender || 'unknown',
          text: msg.text || 'No message content',
          type: msg.type || 'chat',
        }));
        setMessages(historyMessages);
      } catch (error) {
        console.error('Fetch history error:', error.response?.data || error.message);
        let errorMessage = 'Couldn’t load your chat history.';
        if (error.message === 'No token found—please log in.') {
          errorMessage = 'Please log in to see your chat history, bro!';
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (error.response && error.response.status === 401) {
          errorMessage = 'Your session expired—log in again, bro!';
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (error.response && error.response.status === 500) {
          errorMessage = 'Server error—try again later, bro!';
        }
        setError(errorMessage);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []);

  // Handle initial message with uniqueness check
  useEffect(() => {
    if (initialMessage && !loadingHistory) {
      const lastUserMsg = [...messages].reverse().find((msg) => msg.sender === 'user');
      if (!lastUserMsg || lastUserMsg.text !== initialMessage.text) {
        setMessages((prev) => [...prev, { ...initialMessage, isNew: false }]);
        sendMessage(initialMessage.text, 'chat');
      }
    }
  }, [initialMessage, loadingHistory, messages, sendMessage]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setIsClosing(true);
        setTimeout(onClose, 300);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle sending user input
  const handleSend = () => {
    if (!input.trim() || loading) return;
    const userMsg = { sender: 'user', text: input, isNew: false, type: 'chat' };
    setMessages((prev) => [...prev, userMsg]);
    sendMessage(input, 'chat');
    setInput('');
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    if (loading) return;
    const userMsg = { sender: 'user', text: suggestion, isNew: false, type: 'chat' };
    setMessages((prev) => [...prev, userMsg]);
    sendMessage(suggestion, 'chat');
  };

  // Mark all messages as not new after they’ve been displayed
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].isNew) {
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, isNew: false } : msg
          )
        );
      }, 2000);
    }
  }, [messages]);

  return (
    <div
      ref={chatRef}
      className={`fixed bottom-20 right-20 w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 transition-all duration-300 ${
        isClosing ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center p-4 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-t-2xl shadow-md">
        <img
          src={aiIcon}
          alt="AI"
          className="w-8 h-8 mr-3 transition-transform duration-300 hover:scale-110"
        />
        <span className="font-bold text-lg tracking-wide">CRM Assistant</span>
        <button
          onClick={() => {
            setIsClosing(true);
            setTimeout(onClose, 300);
          }}
          className="ml-auto p-1 text-white hover:bg-blue-600 rounded-full transition-colors duration-200"
        >
          <span className="material-icons-round">close</span>
        </button>
      </div>

      {/* Chat Area */}
      <div className="p-5 h-[450px] overflow-y-auto bg-gray-50 relative">
        {loadingHistory ? (
          <div className="flex justify-center py-6">
            <div className="flex space-x-2">
              <div
                className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: '0s' }}
              ></div>
              <div
                className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></div>
              <div
                className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.4s' }}
              ></div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-gray-500 text-center py-8 transition-all duration-300 hover:text-gray-700">
            Hey {userName}, I’m DopaBot—your CRM buddy! What’s up? 🚀
          </p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              } mb-4 transition-all duration-300 hover:scale-[1.02]`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-xl shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {msg.sender === 'ai' && msg.type === 'suggestion' && !msg.isNew ? (
                  <div className="flex flex-col space-y-2">
                    {msg.text.split('\n').map((suggestion, i) => (
                      suggestion.trim() && (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion.trim())}
                          className="bg-blue-100 text-blue-700 p-2 rounded hover:bg-blue-200 transition-colors duration-200"
                        >
                          {suggestion.trim()}
                        </button>
                      )
                    ))}
                  </div>
                ) : msg.sender === 'ai' && msg.isNew && !loading ? (
                  <Typewriter text={msg.text} />
                ) : (
                  formatText(msg.text)
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex space-x-2">
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                style={{ animationDelay: '0s' }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                style={{ animationDelay: '0.2s' }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                style={{ animationDelay: '0.4s' }}
              ></div>
            </div>
          </div>
        )}
        {error && (
          <p className="text-red-500 text-center py-2 animate-pulse">{error}</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl shadow-inner">
        <div className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask away, ${userName}!`}
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-200 hover:border-blue-400"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transform hover:scale-105 transition-all duration-200"
            disabled={loading}
          >
            <span className="material-icons-round">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export { AIChat };
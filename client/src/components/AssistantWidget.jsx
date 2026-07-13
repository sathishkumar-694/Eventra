import { useState, useEffect, useRef } from 'react';
import { HiOutlineChat, HiOutlineX, HiPaperAirplane } from 'react-icons/hi';
import { assistantAPI } from '../api/assistant.js';
import { isLoggedIn } from '../utils/auth.js';
import './AssistantWidget.css';

const AssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your Eventra Assistant. Ask me about your tickets, seat holds, waitlist queues, or how to host events!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const loggedIn = isLoggedIn();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  const handleSend = async (textToSend) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: trimmed }]);
    setLoading(true);

    try {
      const res = await assistantAPI.chat(trimmed);
      setMessages((prev) => [...prev, { sender: 'bot', text: res.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Sorry, I am unable to connect to the assistant server right now. Please try again later.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestClick = (suggestion) => {
    handleSend(suggestion);
  };

  const suggestions = loggedIn
    ? ['Show my bookings', 'Explain seat holds', 'Check waitlist status', 'How to host events']
    : ['Explain seat holds', 'How to host events', 'How do ticket refunds work'];

  return (
    <>
      <button
        className="assistant-fab"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Assistant"
      >
        {isOpen ? <HiOutlineX size={24} /> : <HiOutlineChat size={24} />}
      </button>

      {isOpen && (
        <div className="assistant-window">
          <div className="assistant-header">
            <span className="assistant-header-title">
              <HiOutlineChat size={18} />
              Eventra Assistant
            </span>
            <button
              className="assistant-header-close"
              onClick={() => setIsOpen(false)}
            >
              <HiOutlineX size={18} />
            </button>
          </div>

          <div className="assistant-messages">
            {messages.map((m, index) => (
              <div key={index} className={`assistant-message ${m.sender}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="assistant-message bot">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="assistant-suggestions">
            {suggestions.map((s, index) => (
              <button
                key={index}
                className="assistant-chip"
                onClick={() => handleSuggestClick(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <form
            className="assistant-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
          >
            <input
              type="text"
              className="assistant-input"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="assistant-send-btn"
              disabled={loading || !input.trim()}
            >
              <HiPaperAirplane size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AssistantWidget;

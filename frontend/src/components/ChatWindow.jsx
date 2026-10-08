import React, { useState, useEffect, useRef, useCallback } from 'react';
import chatApi from '../services/chatApi.js';
import { socketService } from '../services/socketService';

export default function ChatWindow({ connection, user, onClose }) {
  console.log('🔵🔵🔵 ChatWindow COMPONENT MOUNTED/RE-RENDERED 🔵🔵🔵', { 
    hasConnection: !!connection, 
    connectionId: connection?._id,
    hasUser: !!user,
    userId: user?._id
  });
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const currentUserId =
    JSON.parse(localStorage.getItem('bridge_user') || 'null')?._id ||
    user?._id ||
    '';

  // Debug: Log connection object
  useEffect(() => {
    console.log('[ChatWindow] Connection received:', connection);
    console.log('[ChatWindow] User:', user);
    if (!connection?._id) {
      console.error('[ChatWindow] ERROR: Connection missing _id!', connection);
      setError('Invalid connection object');
    }
  }, [connection]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, []);

  const fetchMessages = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        }

        const res = await chatApi.getMessages(connection._id, {
          page: pageNum,
          limit: 50,
        });

        const newMessages = res.data.messages || [];

        if (append) {
          setMessages((prev) => [
            ...newMessages,
            ...prev,
          ]);
        } else {
          setMessages(newMessages);
        }

        setHasMore(newMessages.length === 50);
        setPage(pageNum);
      } catch (err) {
        console.error('[ChatWindow] Failed to fetch messages:', err);
        if (pageNum === 1) {
          setError('Failed to load messages: ' + err.message);
        }
      } finally {
        if (pageNum === 1) {
          setLoading(false);
        }
      }
    },
    [connection._id]
  );

  useEffect(() => {
    fetchMessages(1, false);
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const token = localStorage.getItem('bridge_token');

    if (!token) {
      console.warn('[ChatWindow] No token found');
      return;
    }

    if (!connection?._id) {
      console.error('[ChatWindow] Cannot join chat: connection._id is missing');
      return;
    }

    console.log('[ChatWindow] Connecting socket for connection:', connection._id);
    socketService.connect(token);

    const handleNewMessage = (message) => {
      console.log('[ChatWindow] Received newMessage:', message);
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) {
          return prev;
        }
        const index = prev.findIndex(
          (m) => new Date(m.createdAt) > new Date(message.createdAt)
        );
        if (index === -1) {
          return [...prev, message];
        }
        return [
          ...prev.slice(0, index),
          message,
          ...prev.slice(index),
        ];
      });
    };

    const handleMessageNotification = (data) => {
      console.log('[ChatWindow] Received messageNotification:', data);
    };

    const handleMessagesRead = (data) => {
      console.log('[ChatWindow] Received messagesRead:', data);
    };

    const handleConnect = () => {
      console.log('[ChatWindow] Socket connected, joining chat:', connection._id);
      socketService.joinChat(connection._id);
    };

    const handleDisconnect = (reason) => {
      console.log('[ChatWindow] Socket disconnected:', reason);
    };

    const handleConnectError = (error) => {
      console.error('[ChatWindow] Socket connection error:', error);
      setError('Socket connection failed: ' + error);
    };

    socketService.on('newMessage', handleNewMessage);
    socketService.on('messageNotification', handleMessageNotification);
    socketService.on('messagesRead', handleMessagesRead);
    socketService.on('connected', handleConnect);
    socketService.on('disconnected', handleDisconnect);
    socketService.on('connect_error', handleConnectError);

    // Join chat immediately if already connected
    if (socketService.isConnected()) {
      console.log('[ChatWindow] Socket already connected, joining chat');
      socketService.joinChat(connection._id);
    }

    return () => {
      console.log('[ChatWindow] Cleaning up, leaving chat:', connection._id);
      socketService.leaveChat(connection._id);

      socketService.off('newMessage', handleNewMessage);
      socketService.off('messageNotification', handleMessageNotification);
      socketService.off('messagesRead', handleMessagesRead);
      socketService.off('connected', handleConnect);
      socketService.off('disconnected', handleDisconnect);
      socketService.off('connect_error', handleConnectError);
    };
  }, [connection._id]);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) {
      return;
    }

    const content = newMessage.trim();

    setNewMessage('');
    setSending(true);

    const sentViaSocket = socketService.sendMessage({
      connectionId: connection._id,
      content,
      messageType: 'text',
    });

    if (!sentViaSocket) {
      try {
        await chatApi.sendMessage(connection._id, {
          content,
          messageType: 'text',
        });
      } catch (fallbackErr) {
        console.error('REST fallback failed:', fallbackErr);
      } finally {
        setSending(false);
      }
      return;
    }

    setSending(false);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchMessages(page + 1, true);
    }
  };

  const handleMarkAsRead = useCallback(() => {
    chatApi.markAsRead(connection._id);
    socketService.markAsRead(connection._id);
    setUnreadCount(0);
  }, [connection._id]);

  useEffect(() => {
    handleMarkAsRead();
  }, [messages, handleMarkAsRead]);

  const partner = connection.connectedUser;

  const isOwnMessage = (msg) =>
    msg.senderId?._id?.toString() === currentUserId;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/50">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 p-4">
        <div className="w-12 h-12 rounded-full bg-rose-950/50 border border-rose-800 flex items-center justify-center mb-3">
          <span className="text-xl">⚠️</span>
        </div>
        <p className="text-sm text-rose-400 text-center mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
        >
          Reload Page
        </button>
      </div>
    );
  }

  console.log('[ChatWindow] Rendering with:', { chatOpen: !!connection, connection: connection?._id, user: user?._id });

  return (
    <div className="flex flex-col h-full bg-slate-950/80 rounded-3xl overflow-hidden border border-slate-800">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition"
        >
          ←
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-sm">
            {partner?.name?.[0] || 'U'}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">
              {partner?.name || 'Unknown'}
            </h3>

            <p className="text-[10px] text-slate-400 truncate">
              {partner?.email || ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-600 text-white rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={(e) => {
          if (
            e.target.scrollTop === 0 &&
            hasMore &&
            !loading
          ) {
            fetchMessages(page + 1, true);
          }
        }}
      >
        {hasMore && page > 1 && (
          <button
            onClick={handleLoadMore}
            className="mx-auto px-4 py-2 text-xs text-slate-400 hover:text-slate-300 transition"
            disabled={loading}
          >
            {loading
              ? 'Loading...'
              : 'Load earlier messages'}
          </button>
        )}

        {messages.map((msg) => {
          const own = isOwnMessage(msg);
          const sender = msg.senderId;

          return (
            <div
              key={msg._id}
              className={`flex ${
                own ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[75%] flex ${
                  own ? 'flex-row-reverse' : 'flex-row'
                } items-end gap-2`}
              >
                {!own && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {sender?.name?.[0] || 'U'}
                  </div>
                )}

                <div
                  className={`px-4 py-2 rounded-2xl ${
                    own
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                      : 'bg-slate-800/80 text-white border border-slate-700'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {msg.content}
                  </p>

                  <p
                    className={`text-[10px] mt-1 ${
                      own
                        ? 'text-indigo-100'
                        : 'text-slate-400'
                    }`}
                  >
                    {new Date(
                      msg.createdAt
                    ).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  {msg.messageType === 'file' &&
                    msg.fileUrl && (
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-[10px] underline"
                      >
                        📎 {msg.fileName}
                      </a>
                    )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/80">
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) =>
              setNewMessage(e.target.value)
            }
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            disabled={sending}
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import io from 'socket.io-client';

const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
`;

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

const socketOptions = {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
};

const ChatContainer = styled.div`
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(25, 118, 210, 0.10);
  min-height: 400px;
  max-width: 420px;
  width: 100%;
  min-width: 0;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;

  @media (max-width: 500px) {
    max-width: 100vw;
    border-radius: 0;
    margin: 0;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.2rem 1rem 1rem 1rem;
  background: #f7fbff;
  box-sizing: border-box;

  @media (max-width: 500px) {
    padding: 1rem 0.5rem 0.7rem 0.5rem;
  }
`;

const Message = styled.div`
  margin: 0.5rem 0;
  padding: 0.7rem 1.2rem;
  border-radius: 20px;
  max-width: 80%;
  font-size: 1.08rem;
  ${props => props.isMine ? `
    background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%);
    color: white;
    margin-left: auto;
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.10);
  ` : `
    background: #e3f2fd;
    color: #333;
    margin-right: auto;
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.06);
  `}
`;

const InputContainer = styled.div`
  display: flex;
  padding: 1rem;
  border-top: 1px solid #eee;
  gap: 0.5rem;
  background: #f7fbff;
  box-sizing: border-box;

  @media (max-width: 500px) {
    padding: 0.7rem 0.5rem;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 0.7rem 1.1rem;
  border: 1px solid #bbdefb;
  border-radius: 20px;
  outline: none;
  font-size: 1.08rem;
  background: #fff;
  transition: border 0.2s;
  &:focus {
    border-color: #1976d2;
  }
`;

const Button = styled.button`
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 20px;
  background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%);
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.08rem;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.10);
  transition: background 0.2s, box-shadow 0.2s;
  &:hover {
    background: linear-gradient(90deg, #1565c0 0%, #1976d2 100%);
    box-shadow: 0 4px 16px rgba(25, 118, 210, 0.13);
  }
  &:disabled {
    background: #ccc;
    color: #888;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const Status = styled.div`
  text-align: center;
  margin: 1rem 0;
  color: #666;
`;

const StopButtonRow = styled.div`
  display: flex;
  justify-content: center;
  margin: 1rem 0 0 0;
`;

const PageWrapper = styled.div`
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
`;

const ChatCard = styled.div`
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(25, 118, 210, 0.10);
  max-width: 420px;
  width: 100%;
  min-width: 0;
  padding: 2.2rem 1.5rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  @media (max-width: 500px) {
    border-radius: 0;
    padding: 1.2rem 0.5rem 1rem 0.5rem;
    max-width: 100vw;
  }
`;

const StatusArea = styled.div`
  font-size: 1.18rem;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 2.2rem;
  text-align: center;
  min-height: 2.2rem;
`;

function TextChat({ setOnlineUsers }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [partnerId, setPartnerId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, finding, establishing, connected
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, socketOptions);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setConnectionStatus('idle');
    });

    newSocket.on('userCount', (count) => {
      console.log('Current user count:', count);
      setOnlineUsers(count);
    });

    newSocket.on('match', ({ partnerId }) => {
      setPartnerId(partnerId);
      setConnectionStatus('establishing');
      setTimeout(() => {
        setIsConnected(true);
        setConnectionStatus('connected');
        playMatchSound();
      }, 1000);
    });

    newSocket.on('message', ({ message }) => {
      setMessages(prev => [...prev, { text: message, isMine: false }]);
    });

    newSocket.on('partnerDisconnected', () => {
      console.log('TextChat: partnerDisconnected event received, cleaning up connection');
      setIsConnected(false);
      setPartnerId(null);
      setMessages([]);
      setConnectionStatus('idle');
    });

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [setOnlineUsers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const playMatchSound = () => {
    try {
      const audio = new Audio('/ting.mp3');
      audio.play().catch(err => {
        console.log('Audio playback failed:', err);
      });
    } catch (err) {
      console.log('Audio initialization failed:', err);
    }
  };

  const handleStart = () => {
    setConnectionStatus('finding');
    socket.emit('joinQueue', 'text');
  };

  const handleStop = () => {
    console.log('TextChat: handleStop called, cleaning up connection');
    if (socket) {
      socket.emit('leaveChat');
    }
    setIsConnected(false);
    setPartnerId(null);
    setMessages([]);
    setConnectionStatus('idle');
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !partnerId) return;

    socket.emit('message', { to: partnerId, message });
    setMessages(prev => [...prev, { text: message, isMine: true }]);
    setMessage('');
  };

  return (
    <PageWrapper>
      <ChatCard>
        <StatusArea>
          {!isConnected ? (
            connectionStatus === 'finding' ? 'Finding a random online user...' :
            connectionStatus === 'establishing' ? 'Establishing connection...' :
            'Ready to connect!'
          ) : (
            'Connected with Stranger'
          )}
        </StatusArea>
        {!isConnected ? (
          <button
            onClick={handleStart}
            disabled={connectionStatus !== 'idle'}
            style={{
              padding: '0.7rem 1.5rem',
              border: 'none',
              borderRadius: '20px',
              background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
              color: 'white',
              cursor: connectionStatus !== 'idle' ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '1.08rem',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
              transition: 'background 0.2s, box-shadow 0.2s',
              marginTop: '1.5rem',
              opacity: connectionStatus !== 'idle' ? 0.7 : 1
            }}
          >
            {connectionStatus === 'idle' && 'Start Chatting'}
            {connectionStatus === 'finding' && 'Finding online users...'}
            {connectionStatus === 'establishing' && 'Establishing connection...'}
          </button>
        ) : (
          <>
            <ChatContainer>
              <MessagesContainer>
                {messages.map((msg, i) => (
                  <Message key={i} isMine={msg.isMine}>
                    {msg.text}
                  </Message>
                ))}
                <div ref={messagesEndRef} />
              </MessagesContainer>
              <form onSubmit={handleSend}>
                <InputContainer>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <Button type="submit">Send</Button>
                </InputContainer>
              </form>
            </ChatContainer>
            <StopButtonRow>
              <Button type="button" onClick={handleStop}>Stop</Button>
            </StopButtonRow>
          </>
        )}
      </ChatCard>
    </PageWrapper>
  );
}

export default TextChat; 
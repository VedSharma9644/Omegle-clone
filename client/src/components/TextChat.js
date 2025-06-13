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
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  height: 500px;
  display: flex;
  flex-direction: column;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const Message = styled.div`
  margin: 0.5rem 0;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  max-width: 70%;
  ${props => props.isMine ? `
    background: #1a73e8;
    color: white;
    margin-left: auto;
  ` : `
    background: #f0f2f5;
    color: #333;
  `}
`;

const InputContainer = styled.div`
  display: flex;
  padding: 1rem;
  border-top: 1px solid #eee;
  gap: 0.5rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  
  &:focus {
    border-color: #1a73e8;
  }
`;

const Button = styled.button`
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 20px;
  background: #1a73e8;
  color: white;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #1557b0;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
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

function TextChat({ setOnlineUsers }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [partnerId, setPartnerId] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, finding, establishing, connected
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, socketOptions);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setError(null);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Unable to connect to server. Retrying...');
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
    <Container>
      {!isConnected ? (
        <>
          <Button onClick={handleStart} disabled={connectionStatus !== 'idle'}>
            {connectionStatus === 'idle' && 'Start Chatting'}
            {connectionStatus === 'finding' && 'Finding online users...'}
            {connectionStatus === 'establishing' && 'Establishing connection...'}
          </Button>
          {connectionStatus !== 'idle' && <Status>{connectionStatus === 'finding' ? 'Finding a random online user...' : connectionStatus === 'establishing' ? 'Establishing connection...' : ''}</Status>}
        </>
      ) : (
        <>
          <Status>Connected with Stranger</Status>
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
    </Container>
  );
}

export default TextChat; 
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import SpeakingButtonVoice from './common-components/SpeakingButtonVoice';
import StopButton from './common-components/StopButton';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

const socketOptions = {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
};

const PageWrapper = styled.div`
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
`;

const VoiceCard = styled.div`
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(25, 118, 210, 0.10);
  max-width: 350px;
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

const AudioControls = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin: 1rem 0 0 0;
`;

function VoiceChat({ setOnlineUsers }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const audioRef = useRef(null);
  const pendingSignalsRef = useRef([]);
  const initiatorRef = useRef(false);
  const partnerIdRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const socket = io(SOCKET_URL, socketOptions);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      setError(null);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Unable to connect to server. Retrying...');
      setConnectionStatus('idle');
    });

    socket.on('userCount', (count) => {
      console.log('Current user count:', count);
      setOnlineUsers(count);
    });

    socket.on('match', ({ partnerId, initiator }) => {
      console.log('Matched with partner:', partnerId, 'Initiator:', initiator);
      initiatorRef.current = initiator;
      setConnectionStatus('establishing');
      setTimeout(() => {
        initializePeer(initiator, partnerId);
      }, 1000);
    });
    
    

    socket.on('signal', ({ from, signal }) => {
      console.log('Received signal from:', from, 'Type:', signal.type, 'Initiator:', initiatorRef.current);

      if (!peerRef.current) {
        console.log('Peer not ready, queueing signal.');
        pendingSignalsRef.current.push(signal);
        return;
      }

      try {
        if (initiatorRef.current && signal.type === 'answer') {
          peerRef.current.signal(signal);
        } else if (!initiatorRef.current && signal.type === 'offer') {
          peerRef.current.signal(signal);
        } else {
          console.log('Ignoring signal. Role mismatch.');
        }
      } catch (err) {
        console.error('Error handling signal:', err);
        setError('Signal error. Restarting...');
        cleanup();
      }
    });

    socket.on('partnerDisconnected', () => {
      console.log('Partner disconnected');
      cleanup();
    });

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [setOnlineUsers]);

  const initializePeer = async (initiator, partnerId) => {
    console.log('Initializing peer. Initiator:', initiator);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);

      const peer = new SimplePeer({
        initiator,
        stream: mediaStream,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      peer.on('signal', data => {
        console.log('Sending signal:', data.type);
        if (socketRef.current?.connected && partnerId) {
          socketRef.current.emit('signal', { to: partnerId, signal: data });
        }
      });

      peer.on('stream', remoteStream => {
        console.log('Received remote stream');
        const audioElement = document.createElement('audio');
        audioElement.srcObject = remoteStream;
        audioElement.autoplay = true;
        audioElement.playsInline = true;
        document.body.appendChild(audioElement);
        audioRef.current = audioElement;
      });

      peer.on('connect', () => {
        console.log('Peer connected');
        setIsConnected(true);
        setError(null);
        setConnectionStatus('connected');
        playMatchSound();
        while (pendingSignalsRef.current.length > 0) {
          const s = pendingSignalsRef.current.shift();
          if ((initiator && s.type === 'answer') || (!initiator && s.type === 'offer')) {
            peer.signal(s);
          }
        }
      });

      peer.on('error', err => {
        console.error('Peer error:', err);
        setError('Connection error. Try again.');
        cleanup();
      });

      peer.on('close', () => {
        console.log('Peer closed');
        cleanup();
      });

      peerRef.current = peer;
    } catch (err) {
      console.error('Media access error:', err);
      setError('Mic access denied or unavailable.');
      setConnectionStatus('idle');
    }
  };

  const playMatchSound = () => {
    try {
      const audio = new Audio('/ting.mp3');
      audio.play();
    } catch (err) {
      console.warn('Failed to play match sound');
    }
  };

  const cleanup = () => {
    console.log('Cleaning up connection');
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
      audioRef.current.remove();
      audioRef.current = null;
    }
    pendingSignalsRef.current = [];
    partnerIdRef.current = null;
    initiatorRef.current = false;
    setIsConnected(false);
    setIsMuted(false);
    setConnectionStatus('idle');
  };

  const handleStart = () => {
    if (socketRef.current?.connected) {
      setConnectionStatus('finding');
      socketRef.current.emit('joinQueue', 'voice');
    }
  };

  const handleStop = () => cleanup();

  const toggleMute = () => {
    if (stream) {
      const newState = !isMuted;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !newState;
      });
      setIsMuted(newState);
    }
  };

  return (
    <PageWrapper>
      <VoiceCard>
        <StatusArea>
          {error ? (
            <span style={{ color: 'red' }}>{error}</span>
          ) : !isConnected ? (
            connectionStatus === 'finding' ? 'Finding a random online user...' :
            connectionStatus === 'establishing' ? 'Establishing connection...' :
            'Ready to connect!'
          ) : (
            'Connected with Stranger'
          )}
        </StatusArea>
        {!isConnected ? (
          <>
            <button
              onClick={handleStart}
              disabled={connectionStatus !== 'idle' || !socketRef.current?.connected}
              style={{
                padding: '0.7rem 1.5rem',
                border: 'none',
                borderRadius: '20px',
                background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                color: 'white',
                cursor: connectionStatus !== 'idle' || !socketRef.current?.connected ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '1.08rem',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
                transition: 'background 0.2s, box-shadow 0.2s',
                marginTop: '1.5rem',
                opacity: connectionStatus !== 'idle' || !socketRef.current?.connected ? 0.7 : 1
              }}
            >
              {connectionStatus === 'idle' && (socketRef.current?.connected ? 'Start Voice Chat' : 'Connecting...')}
              {connectionStatus === 'finding' && 'Finding online users...'}
              {connectionStatus === 'establishing' && 'Establishing connection...'}
            </button>
          </>
        ) : (
          <AudioControls>
            <SpeakingButtonVoice isMuted={isMuted} toggleMute={toggleMute} size={32} />
            <StopButton onClick={handleStop} size={32} />
          </AudioControls>
        )}
      </VoiceCard>
    </PageWrapper>
  );
}

export default VoiceChat;

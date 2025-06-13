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

const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
  text-align: center;
`;

const Button = styled.button`
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 20px;
  background: #1a73e8;
  color: white;
  cursor: pointer;
  font-weight: 500;
  margin: 0.5rem;

  &:hover {
    background: #1557b0;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const Status = styled.div`
  margin: 1rem 0;
  color: #666;
`;

const AudioControls = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 1rem 0;
`;

function VoiceChat({ setOnlineUsers }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const audioRef = useRef(null);
  const pendingSignalsRef = useRef([]);
  const initiatorRef = useRef(false);
  const partnerIdRef = useRef(null);

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
    });

    socket.on('userCount', (count) => {
      console.log('Current user count:', count);
      setOnlineUsers(count);
    });

    socket.on('match', ({ partnerId, initiator }) => {
      console.log('Matched with partner:', partnerId, 'Initiator:', initiator);
      initiatorRef.current = initiator;
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
  };

  const handleStart = () => {
    if (socketRef.current?.connected) {
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
    <Container>
      {error && <Status style={{ color: 'red' }}>{error}</Status>}
      {!isConnected ? (
        <Button onClick={handleStart} disabled={!socketRef.current?.connected}>
          {socketRef.current?.connected ? 'Start Voice Chat' : 'Connecting...'}
        </Button>
      ) : (
        <>
          <Status>Connected with Stranger</Status>
          <AudioControls>
            <SpeakingButtonVoice isMuted={isMuted} toggleMute={toggleMute} size={24} />
            <StopButton onClick={handleStop} size={24} />
          </AudioControls>
        </>
      )}
    </Container>
  );
}

export default VoiceChat;

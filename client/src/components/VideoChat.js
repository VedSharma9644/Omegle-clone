import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import SpeakingButtonVideo from './common-components/SpeakingButtonVideo';
import CameraButton from './common-components/CameraButton';
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

const VideoCard = styled.div`
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(25, 118, 210, 0.10);
  max-width: 700px;
  width: 100%;
  min-width: 0;
  padding: 2.2rem 1.5rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  @media (max-width: 700px) {
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

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
`;

const VideoContainer = styled.div`
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16/9;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
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

const Controls = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 1rem 0;
  align-items: center;
`;

function VideoChat({ setOnlineUsers }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isLocalVideoReady, setIsLocalVideoReady] = useState(false);
  const [isRemoteVideoReady, setIsRemoteVideoReady] = useState(false);
  const [isVideoElementsMounted, setIsVideoElementsMounted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, finding, establishing, connected
  
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const partnerIdRef = useRef(null);
  const initiatorRef = useRef(false);
  const pendingSignalsRef = useRef([]);

  // Check if video elements are mounted
  useEffect(() => {
    const checkVideoElements = () => {
      const localMounted = !!localVideoRef.current;
      const remoteMounted = !!remoteVideoRef.current;
      console.log('Video elements mounted:', { local: localMounted, remote: remoteMounted });
      setIsVideoElementsMounted(localMounted && remoteMounted);
    };

    // Check immediately
    checkVideoElements();

    // Set up a mutation observer to watch for video elements
    const observer = new MutationObserver(checkVideoElements);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  // Handle local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current && isVideoElementsMounted) {
      console.log('Setting local video stream to element');
      try {
        const videoElement = localVideoRef.current;
        videoElement.srcObject = localStream;
        
        const playVideo = async () => {
          try {
            await videoElement.play();
            console.log('Local video playing successfully');
            setIsLocalVideoReady(true);
          } catch (err) {
            console.error('Error playing local video:', err);
            setError('Error playing local video: ' + err.message);
          }
        };

        if (videoElement.readyState >= 2) {
          playVideo();
        } else {
          videoElement.onloadedmetadata = playVideo;
        }
      } catch (err) {
        console.error('Error setting local video stream:', err);
        setError('Error setting local video: ' + err.message);
      }
    }
  }, [localStream, isVideoElementsMounted]);

  // Handle remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current && isVideoElementsMounted) {
      console.log('Setting remote video stream to element');
      try {
        const videoElement = remoteVideoRef.current;
        videoElement.srcObject = remoteStream;
        
        const playVideo = async () => {
          try {
            await videoElement.play();
            console.log('Remote video playing successfully');
            setIsRemoteVideoReady(true);
          } catch (err) {
            console.error('Error playing remote video:', err);
            setError('Error playing remote video: ' + err.message);
          }
        };

        if (videoElement.readyState >= 2) {
          playVideo();
        } else {
          videoElement.onloadedmetadata = playVideo;
        }
      } catch (err) {
        console.error('Error setting remote video stream:', err);
        setError('Error setting remote video: ' + err.message);
      }
    }
  }, [remoteStream, isVideoElementsMounted]);

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
      partnerIdRef.current = partnerId;
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

  const cleanup = () => {
    console.log('Cleaning up connection');
    if (peerRef.current) {
      console.log('Destroying peer connection');
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (stream) {
      console.log('Stopping media tracks');
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      setStream(null);
      setLocalStream(null);
    }
    setRemoteStream(null);
    pendingSignalsRef.current = [];
    partnerIdRef.current = null;
    initiatorRef.current = false;
    setIsConnected(false);
    setIsMuted(false);
    setIsVideoOff(false);
    setConnectionStatus('idle');
  };

  const playMatchSound = () => {
    try {
      const audio = new Audio('/ting.mp3');
      audio.play();
    } catch (err) {
      console.warn('Failed to play match sound');
    }
  };

  const initializePeer = async (initiator, partnerId) => {
    console.log('Initializing peer. Initiator:', initiator);
    try {
      console.log('Requesting media access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });

      // Log stream details
      const videoTrack = mediaStream.getVideoTracks()[0];
      const audioTrack = mediaStream.getAudioTracks()[0];
      console.log('Media stream details:', {
        videoTrack: {
          label: videoTrack.label,
          enabled: videoTrack.enabled,
          readyState: videoTrack.readyState,
          settings: videoTrack.getSettings()
        },
        audioTrack: {
          label: audioTrack.label,
          enabled: audioTrack.enabled,
          readyState: audioTrack.readyState
        }
      });
      
      setStream(mediaStream);
      setLocalStream(mediaStream);

      console.log('Creating peer connection...');
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
        console.log('Sending signal:', data.type, 'to partner:', partnerId);
        if (socketRef.current?.connected && partnerId) {
          socketRef.current.emit('signal', { to: partnerId, signal: data });
        } else {
          console.warn('Cannot send signal - socket not connected or no partner ID');
        }
      });

      peer.on('stream', stream => {
        console.log('Received remote stream:', {
          tracks: stream.getTracks().map(track => ({
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            settings: track.getSettings?.()
          }))
        });
        setRemoteStream(stream);
      });

      peer.on('connect', () => {
        console.log('Peer connection established');
        setIsConnected(true);
        setError(null);
        setConnectionStatus('connected');
        playMatchSound();
        while (pendingSignalsRef.current.length > 0) {
          const s = pendingSignalsRef.current.shift();
          console.log('Processing pending signal:', s.type);
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
        console.log('Peer connection closed');
        cleanup();
      });

      peerRef.current = peer;
    } catch (err) {
      console.error('Media access error:', err);
      setError('Camera/mic access denied or unavailable: ' + err.message);
      setConnectionStatus('idle');
    }
  };

  const handleStart = () => {
    if (socketRef.current?.connected) {
      setConnectionStatus('finding');
      socketRef.current.emit('joinQueue', 'video');
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

  const toggleVideo = () => {
    if (stream) {
      const newState = !isVideoOff;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !newState;
      });
      setIsVideoOff(newState);
    }
  };

  return (
    <PageWrapper>
      <VideoCard>
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
            {connectionStatus === 'idle' && (socketRef.current?.connected ? 'Start Video Chat' : 'Connecting...')}
            {connectionStatus === 'finding' && 'Finding online users...'}
            {connectionStatus === 'establishing' && 'Establishing connection...'}
          </button>
        ) : (
          <>
            <VideoGrid>
              <VideoContainer>
                <Video 
                  ref={localVideoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  style={{ transform: 'scaleX(-1)' }} // Mirror local video
                />
                {!isLocalVideoReady && <Status>Loading local video...</Status>}
              </VideoContainer>
              <VideoContainer>
                <Video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                />
                {!isRemoteVideoReady && <Status>Loading remote video...</Status>}
              </VideoContainer>
            </VideoGrid>
            <Controls>
              <SpeakingButtonVideo
                isMuted={isMuted}
                onClick={toggleMute}
                size={24}
              />
              <CameraButton
                isOff={isVideoOff}
                onClick={toggleVideo}
                size={24}
              />
              <StopButton
                onClick={handleStop}
                size={24}
              />
            </Controls>
          </>
        )}
      </VideoCard>
    </PageWrapper>
  );
}

export default VideoChat; 
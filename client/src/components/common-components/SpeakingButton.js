import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Mic, MicOff } from 'lucide-react'; // Or use any icon library

const Button = styled.button`
  background-color: ${({ $isSpeaking }) => ($isSpeaking ? '#34c759' : '#ccc')};
  border: none;
  border-radius: 50%;
  padding: 1rem;
  cursor: pointer;
  color: white;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;


function SpeakingButton({ stream, isMuted, toggleMute }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!stream || isMuted) {
      setIsSpeaking(false);
      return;
    }

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    source.connect(analyser);

    const checkSpeaking = () => {
      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setIsSpeaking(volume > 10); // Adjust threshold as needed
      animationRef.current = requestAnimationFrame(checkSpeaking);
    };

    checkSpeaking();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      audioContext.close();
    };
  }, [stream, isMuted]);

  return (
    <Button $isSpeaking={isSpeaking} onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
      {isMuted ? <MicOff /> : <Mic />}
    </Button>

  );
}

export default SpeakingButton;

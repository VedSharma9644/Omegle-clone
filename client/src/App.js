import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import TextChat from './components/TextChat';
import VoiceChat from './components/VoiceChat';
import VideoChat from './components/VideoChat';
import Header from './components/common-components/Header';
import Footer from './components/common-components/Footer';

const AppBackground = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 2rem 0 1rem 0;
`;

function App() {
  const [onlineUsers, setOnlineUsers] = React.useState(0);

  return (
    <Router>
      <AppBackground>
        <Header onlineUsers={onlineUsers} />
        <MainContent>
          <Routes>
            <Route path="/" element={<Navigate to="/text" replace />} />
            <Route path="/text" element={<TextChat setOnlineUsers={setOnlineUsers} />} />
            <Route path="/voice" element={<VoiceChat setOnlineUsers={setOnlineUsers} />} />
            <Route path="/video" element={<VideoChat setOnlineUsers={setOnlineUsers} />} />
          </Routes>
        </MainContent>
        <Footer />
      </AppBackground>
    </Router>
  );
}

export default App; 
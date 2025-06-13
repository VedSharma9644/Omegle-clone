import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import styled from 'styled-components';
import TextChat from './components/TextChat';
import VoiceChat from './components/VoiceChat';
import VideoChat from './components/VideoChat';

const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

const AppContainer = styled.div`
  min-height: 100vh;
  background: #f0f2f5;
`;

const Nav = styled.nav`
  background: #ffffff;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: #1a73e8;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  
  &:hover {
    background: #f0f2f5;
  }
`;

const OnlineCount = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  font-size: 0.9rem;
  color: #666;
`;

function App() {
  const [onlineUsers, setOnlineUsers] = React.useState(0);

  return (
    <Router future={router.future}>
      <AppContainer>
        <Nav>
          <NavLinks>
            <StyledLink to="/">Text Chat</StyledLink>
            <StyledLink to="/voice">Voice Chat</StyledLink>
            <StyledLink to="/video">Video Chat</StyledLink>
          </NavLinks>
        </Nav>
        <OnlineCount>Online: {onlineUsers}</OnlineCount>
        <Routes>
          <Route path="/" element={<TextChat setOnlineUsers={setOnlineUsers} />} />
          <Route path="/voice" element={<VoiceChat setOnlineUsers={setOnlineUsers} />} />
          <Route path="/video" element={<VideoChat setOnlineUsers={setOnlineUsers} />} />
        </Routes>
      </AppContainer>
    </Router>
  );
}

export default App; 
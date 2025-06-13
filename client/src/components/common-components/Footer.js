import React from 'react';
import styled from 'styled-components';

const FooterBar = styled.footer`
  width: 100%;
  background: linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
  padding: 1.2rem 0 1rem 0;
  text-align: center;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  box-shadow: 0 -2px 8px rgba(25, 118, 210, 0.04);
  margin-top: 2rem;
`;

const FooterLinks = styled.div`
  margin-top: 0.5rem;
  a {
    color: #1976d2;
    text-decoration: underline;
    margin: 0 0.5rem;
    font-size: 0.95rem;
    &:hover {
      color: #0d47a1;
    }
  }
`;

function Footer() {
  return (
    <FooterBar>
      &copy; {new Date().getFullYear()} Random Chat &mdash; Made with ❤️ for privacy and fun.
      <FooterLinks>
        <a href="https://github.com/VedSharma9644/Omegle-clone" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="/privacy" style={{marginLeft: '0.5rem'}}>Privacy</a>
      </FooterLinks>
    </FooterBar>
  );
}

export default Footer; 
import React, { useState } from 'react';
import styled from 'styled-components';
import { FiMenu, FiX } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';

const HeaderBar = styled.header`
  width: 100%;
  background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%);
  color: #fff;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.08);
`;

const HeaderFlex = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;

const Logo = styled(Link)`
  font-size: 1.6rem;
  font-weight: bold;
  letter-spacing: 2px;
  color: #fff;
  text-decoration: none;
  flex: 0 0 auto;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 1 1 0;
  justify-content: center;
  @media (max-width: 700px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  color: #fff;
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 500;
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  background: ${({ $active }) => ($active ? 'rgba(255,255,255,0.18)' : 'none')};
  transition: background 0.2s;

  &:hover {
    background: rgba(255,255,255,0.12);
  }
`;

const MenuIcon = styled.div`
  display: none;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
  @media (max-width: 700px) {
    display: block;
  }
`;

const MobileMenu = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 220px;
  height: 100vh;
  background: linear-gradient(90deg, #1976d2 0%, #42a5f5 100%);
  box-shadow: -2px 0 8px rgba(25, 118, 210, 0.12);
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem;
  z-index: 2000;
  transition: transform 0.2s;
`;

const MobileNavLink = styled(Link)`
  color: #fff;
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  border-radius: 6px;
  background: ${({ $active }) => ($active ? 'rgba(255,255,255,0.18)' : 'none')};
  padding: 0.5rem 0.8rem;
  transition: background 0.2s;

  &:hover {
    background: rgba(255,255,255,0.12);
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.2);
  z-index: 1500;
`;

const OnlineCount = styled.div`
  margin-left: auto;
  background: rgba(255,255,255,0.18);
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 1rem;
  color: #fff;
  font-weight: 500;
  letter-spacing: 0.5px;
  flex: 0 0 auto;
`;

const navLinks = [
  { to: '/text', label: 'Text Chat' },
  { to: '/voice', label: 'Voice Chat' },
  { to: '/video', label: 'Video Chat' },
];

function Header({ onlineUsers }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <HeaderBar>
      <HeaderFlex>
        <Logo to="/">Random Chat</Logo>
        <Nav>
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              $active={location.pathname.startsWith(link.to)}
            >
              {link.label}
            </NavLink>
          ))}
        </Nav>
        <OnlineCount>Online: {onlineUsers}</OnlineCount>
        <MenuIcon onClick={() => setMenuOpen(true)}>
          <FiMenu />
        </MenuIcon>
      </HeaderFlex>
      {menuOpen && <Overlay onClick={() => setMenuOpen(false)} />}
      {menuOpen && (
        <MobileMenu>
          <MenuIcon style={{ alignSelf: 'flex-end' }} onClick={() => setMenuOpen(false)}>
            <FiX />
          </MenuIcon>
          {navLinks.map(link => (
            <MobileNavLink
              key={link.to}
              to={link.to}
              $active={location.pathname.startsWith(link.to)}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </MobileNavLink>
          ))}
        </MobileMenu>
      )}
    </HeaderBar>
  );
}

export default Header; 
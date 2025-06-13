import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  background: #ff4444;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  color: #fff;
  position: relative;

  &:hover {
    background-color: #d32f2f;
  }

  svg {
    width: ${props => props.size || 32}px;
    height: ${props => props.size || 32}px;
  }
`;

const Tooltip = styled.span`
  visibility: hidden;
  background-color: #333;
  color: #fff;
  text-align: center;
  border-radius: 4px;
  padding: 4px 8px;
  position: absolute;
  z-index: 1;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 0.9rem;
  pointer-events: none;

  ${Button}:hover & {
    visibility: visible;
    opacity: 1;
  }
`;

function StopButton({ onClick, size }) {
  return (
    <Button onClick={onClick} size={size} aria-label="End call">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.21 15.89c-.39-.39-.39-1.02 0-1.41l2.12-2.12c.39-.39 1.02-.39 1.41 0l1.06 1.06c2.34-1.17 5.13-1.17 7.47 0l1.06-1.06c.39-.39 1.02-.39 1.41 0l2.12 2.12c.39.39.39 1.02 0 1.41-.39.39-1.02.39-1.41 0l-1.06-1.06c-2.34 1.17-5.13 1.17-7.47 0l-1.06 1.06c-.39.39-1.02.39-1.41 0z" fill="currentColor"/>
      </svg>
      <Tooltip>End call</Tooltip>
    </Button>
  );
}

export default StopButton; 
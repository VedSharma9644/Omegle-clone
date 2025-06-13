import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  color: ${props => props.isOff ? '#ff4444' : '#4CAF50'};
  position: relative;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  svg {
    width: ${props => props.size || 24}px;
    height: ${props => props.size || 24}px;
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

function CameraButton({ isOff, onClick, size }) {
  return (
    <Button onClick={onClick} isOff={isOff} size={size} aria-label={isOff ? 'Turn on camera' : 'Turn off camera'}>
      {isOff ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
        </svg>
      )}
      <Tooltip>{isOff ? 'Turn on camera' : 'Turn off camera'}</Tooltip>
    </Button>
  );
}

export default CameraButton; 
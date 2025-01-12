// DisclaimerModal.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
`;

const Modal = styled.div`
  background-color: #2d2d2d;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  padding: 1.5rem;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #d7a451;
`;

const Content = styled.div`
  margin-bottom: 1.5rem;
  line-height: 1.6;

  p {
    margin-bottom: 1rem;
  }

  ul {
    list-style-type: disc;
    margin-left: 1.5rem;
    margin-top: 0.5rem;
  }

  li {
    margin-bottom: 0.5rem;
  }
`;

const Button = styled.button`
  background-color: #8b0000;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  float: right;

  &:hover {
    background-color: #a00000;
  }
`;

const DisclaimerModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem('hasSeenDisclaimer');
    if (!hasSeenDisclaimer) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('hasSeenDisclaimer', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <Modal>
        <Title>Educational Project Disclaimer</Title>
        <Content>
          <p>
            Welcome! This is a non-commercial fan project created for educational
            purposes and portfolio demonstration only.
          </p>
          <p>
            This project is inspired by CD Projekt Red's Gwent from The Witcher 3:
            Wild Hunt. All Witcher-related intellectual property belongs to CD
            Projekt Red.
          </p>

          <p>
            This project is:
            <ul>
              <li>Not affiliated with CD Projekt Red</li>
              <li>Created for educational purposes only</li>
              <li>Not for commercial use</li>
              <li>A fan project intended for learning and portfolio demonstration</li>
            </ul>
          </p>
        </Content>
        <Button onClick={handleAccept}>I Understand</Button>
      </Modal>
    </Overlay>
  );
};

export default DisclaimerModal;
import { createContext, useContext, useState } from 'react';

const ChatContext = createContext({});

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const openChat  = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);
  return (
    <ChatContext.Provider value={{ isOpen, openChat, closeChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);

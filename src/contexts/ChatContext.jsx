import { createContext, useContext, useState } from "react";
//createContext() makes a new Context Object
//useContext() lets you consume that context in any component
//useState() holds state inside your provider

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]); //messages is an array of { sender, content }  objects
  const [input, setInput] = useState(""); // input is the current text in the input box

  const addMessage = (msg) => {
    //addMessage is a helper that appends a new message to messages
    setMessages((prev) => [...prev, msg]);
  };

  //ChatContext.Provider makes the given value available to all descendants
  //{children} renders whatever you wrap with ChatProvider
  return (
    <ChatContext.Provider
      value={{ messages, setMessages, input, setInput, addMessage }}
    >
      {children}
    </ChatContext.Provider>
  );
}

//custom hook: shorthand for useContext(ChatContext)
export function useChat() {
  return useContext(ChatContext);
}

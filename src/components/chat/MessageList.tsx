import * as React from 'react';
import { findDOMNode } from 'react-dom';

import Message, { MessageObj } from './Message';


export interface MessageListProps {
  messages: MessageObj[];
  username: string;
}

export default function MessageList({ messages, username }: MessageListProps) {

  return (
    <ul>
      {messages.map( (message: MessageObj) => {
        return <Message
                  key={message.key}
                  message={message}
                  username={username}/>;
      } )}
    </ul>
  );
}

import * as React from 'react';

import MessageBox from './MessageBox';
import MessageForm from './MessageForm';

export interface ChatContainerProps {
  messages: MessageObj[];
  username: string;
  onSendMessage: (msg: string) => void;
}

export default function ChatContainer({messages, username, onSendMessage }: ChatContainerProps) {
  return (
    <div className="content">
      <MessageBox
        messages={messages}
        username={username} />
      <MessageForm onSendMessage={onSendMessage} />
    </div>
  );
}

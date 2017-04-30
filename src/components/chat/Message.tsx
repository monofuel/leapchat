import * as PropTypes from 'prop-types';
import * as React from 'react';

export interface MessageProps {
  message: MessageObj;
  username: string;
}

export default function Message({ message, username }: MessageProps) {
  const fromMe = message.from === username;
  const messageClass = fromMe ? 'chat-outgoing' : 'chat-incoming';

  return (
    <li className={messageClass} key={message.key}>
      <span className="username">{message.from}</span>
      {message.msg}
    </li>
  );
}

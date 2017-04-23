import * as React from 'react';

export interface MessageProps {
  message: any;
  username: string;
}

export default class Message extends React.Component<MessageProps, null> {
  public render() {
    const { message, username } = this.props;
    const fromMe = message.from === username;
    const messageClass = fromMe ? 'chat-outgoing' : 'chat-incoming';

    return (
      <li className={messageClass} key={message.key}>
        <span className="username">{message.from}</span>
        {message.msg}
      </li>
    );
  }
}

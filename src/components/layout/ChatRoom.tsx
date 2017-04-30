import * as React from 'react';

import { MessageObj } from '../chat/Message';

interface Room {
  key: string;
  messages: MessageObj[];
}

interface ChatRoomProps {
  username: string;
  rooms: Room[];
  room: Room;
}

export default class ChatRoom extends React.Component<ChatRoomProps, null> {
  public render(){
    const { username, rooms } = this.props;

    return (
     <div key={this.props.room.key} className="chatroom">
        {(this.props.room.messages || []).map((message: MessageObj) => {
          const fromMe: boolean = (message.from === username);
          return (
            <div key={message.key} className={fromMe ? 'chat-outgoing' : 'chat-incoming'}>
              {message.from}: {message.msg}
            </div>
          );
        })}
      </div>
    );
  }
}
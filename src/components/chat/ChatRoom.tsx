import * as React from 'react';

export interface ChatRoomType {
  key: string;
  roomname: string;
}

export interface ChatRoomProps {
  chatRoom: ChatRoomType;
  onSelectRoom: (key: string) => void;
}

export function ChatRoom({ chatRoom, onSelectRoom }: ChatRoomProps) {
  return (
    <li>
      <a href="#" onClick={() => onSelectRoom(chatRoom.key)}>{chatRoom.roomname}</a>
    </li>
  );
}

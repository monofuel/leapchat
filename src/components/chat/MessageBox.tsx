import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as notifier from 'node-notifier';
import * as PropTypes from 'prop-types';

import MessageList from './MessageList';
import { MessageObj } from './Message';

import { playNotification } from '../../utils/audio';

interface MessageBoxProps {
  messages: MessageObj[];
  username: string;
}
interface MessageBoxState {
  notifiedIds: string[];
}

export default class MessageBox extends React.Component<MessageBoxProps, MessageBoxState>{
  public static propTypes = {
    messages: PropTypes.arrayOf(
      PropTypes.shape({
        msg: PropTypes.string.isRequired,
        form: PropTypes.string.isRequired,
        key: PropTypes.string.isRequired,
      }),
    ),
    username: PropTypes.string.isRequired,
  };

  public state: MessageBoxState = {
    notifiedIds: [],
  };

  private componentDidUpdate(prevProps: MessageBoxProps){
    if (this.shouldScroll(prevProps)){
      this.scrollToBottom();
    }
  }

  private shouldScroll(prevProps: MessageBoxProps){
    const hasNewMessages: boolean = this.hasNewMessages(prevProps);
    if (hasNewMessages){
      this.checkNewMessages(prevProps.messages);
    }
    return hasNewMessages;
  }

  private checkNewMessages(prevMessages: MessageObj[]){
    let messageIds = prevMessages.map( (message) => {
      return message.key;
    });
    messageIds = messageIds.concat(this.state.notifiedIds);

    const newMessages = this.props.messages.filter((message) => {
      return messageIds.indexOf(message.key) === -1;
    });

    // better logic needed, but this will play a notification if you've been mentioned.
    const newMessageIds: string[] = [];
    newMessages.forEach( (message) => {
      newMessageIds.push(message.key);
      const content = message.msg.toLowerCase();
      const username = this.props.username.toLowerCase();
      if (content.indexOf('@' + username) > -1){
        notifier.notify({
          title: message.from,
          message: message.msg,
        });
        playNotification();
      }
    });

    const notifiedIds = this.state.notifiedIds;
    this.setState({
      notifiedIds: notifiedIds.concat(newMessageIds),
    });
  }

  private hasNewMessages(prevProps: MessageBoxProps){
    return prevProps.messages.length !== this.props.messages.length;
  }

  private scrollToBottom(){
    const messageContainer = ReactDOM.findDOMNode(this.refs.messages);
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }

  public render(){
    const { messages, username } = this.props;

    return (
      <div className="row message-box" ref="messages">
        <div className="col-md-12">
          <MessageList messages={messages} username={username} />
        </div>
      </div>
    );
  }
}

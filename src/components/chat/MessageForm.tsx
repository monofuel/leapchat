import * as PropTypes from 'prop-types';
import * as React from 'react';

export interface MessageFormProps {
  onSendMessage: (msg: string) => void;
}

export default class MessageForm extends React.Component<MessageFormProps, null> {
  private static propTypes = {
    onSendMessage: PropTypes.func.isRequired,
  };

  private messageInput: HTMLInputElement;

  constructor(props: MessageFormProps) {
    super(props);

    this.onSendMessage = this.onSendMessage.bind(this);
  }

  public render() {
    return (
      <div className="row message-form">
        <hr />
        <form role="form" className="form" onSubmit={this.onSendMessage}>
          <div className="col-md-12">
            <input
              ref={(ref) => this.messageInput = ref}
              type="text"
              className="form-control"
              name="message"
              placeholder="Send a message" />
          </div>
        </form>
      </div>
    );
  }

  private componentDidMount() {
    this.messageInput.focus();
  }

  private onSendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const message: string = this.messageInput.value;
    if (message && message.length > 0) {
      this.props.onSendMessage(message);
      this.messageInput.value = '';
    }
  }
}

import * as React from 'react';
import * as PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import { autobind } from 'core-decorators';
import { Modal, Button } from 'react-bootstrap';

const { Component } = React;

interface UsernameModalProps {
  onSetUsername: (name: string) => void;
  onCloseModal: () => void;
  showModal: boolean;
  username: string;
}

interface UsernameModalState {
  username: string;
}

class UsernameModal extends Component<UsernameModalProps, UsernameModalState> {
  public static PropTypes = {
    username: PropTypes.string.isRequired,
    onSetUsername: PropTypes.func.isRequired,
    showModal: PropTypes.bool.isRequired,
    onCloseModal: PropTypes.func.isRequired,
  };
  public state: UsernameModalState = {
    username: this.props.username,
  };

  private usernameDiv: HTMLElement;


  public componentDidMount(){
    this.usernameDiv.focus();
  }

  @autobind
  public onSubmit(){
    const { onSetUsername } = this.props;
    const { username } = this.state;

    if (!username || username.length === 0){
      alert('Invalid username!');
    } else {
      onSetUsername(username);
    }
  }

  public render(){
    const { showModal, username, onCloseModal } = this.props;
    return (
      <div>
        <Modal show={showModal} onHide={onCloseModal}>
          <Modal.Header>
            <Modal.Title>Set Username</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group" ref={(ref) => this.usernameDiv = ref}>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => this.setState({ username: e.target.value })}
                placeholder="Enter username (e.g., trinity)"
                onBlur={this.onSubmit} />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={onCloseModal}>Cancel</Button>
            <Button onClick={this.onSubmit} bsStyle="primary">Set Username</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as PropTypes from 'prop-types';
import { autobind } from 'core-decorators';
const { Component } = React;

const sha384 = require('js-sha512').sha384;
const btoa = require('btoa');
const atob = require('atob');

import ChatContainer from './components/chat/ChatContainer';

import { formatMessages } from './utils/chat';
import { tagByPrefixStripped } from './utils/tags';
import { genPassphrase } from './data/minishare';

import UsernameModal from './components/modals/Username';
const USERNAME_KEY = 'username';

interface AppState {
  username: string;
  showUsernameModal: boolean;
  authToken: string;
  keyPair: KeyPairType | null;
  mID: string;
  wsMsgs: any; // TODO type this
  messages: MessageObj[];
  protocol: string;
  showAlert: boolean;
  alertMessage: string;
  alertStyle: string;
}

export default class App extends Component<{}, AppState> {
  constructor(){
    super();

    const username = localStorage.getItem(USERNAME_KEY) || '';
    const protocol = document.location.protocol.slice(0, -1);

    this.state = {
      username,
      showUsernameModal: true,
      authToken: '',
      keyPair: null,
      mID: '', // miniLock ID
      wsMsgs: null, // WebSockets connection for getting/sending messages
      messages: [],
      protocol,
      showAlert: false,
      alertMessage: 'Welcome to miniShare!',
      alertStyle: 'success',
    };
  }

  public componentDidMount(){
    this.keypairFromURLHash();
  }

  @autobind
  private alert(errStr: string, alertStyle: string){
    console.log(errStr);

    this.setState({
      showAlert: true,
      alertMessage: errStr,
      alertStyle, // Changing this changes nothing...
    });
  }
  @autobind
  private onError(errStr: string) {
    this.alert(errStr, 'error');
  }

  @autobind
  private promptForUsername(){
    this.setState({
      showUsernameModal: true,
    });
  }

  @autobind
  private loadUsername(){
    const { username } = this.state;

    if (!username){
      this.promptForUsername();
    }
  }

  @autobind
  private decryptMsg(msg: Blob, callback: (blob: Blob, saveName: string, senderID: string) => void){
    console.log('Trying to decrypt', msg);

    const { mID, keyPair } = this.state;
    if (!keyPair) {
      throw new Error('no keypair in state');
    }

    // From https://github.com/kaepora/miniLock/blob/ffea0ecb7a619d921129b8b4aed2081050ec48c1/src/js/miniLock.js#L592-L595 --
    //
    //    Callback is passed these parameters:
    //      file: Decrypted file object (blob),
    //      saveName: File name for saving the file (String),
    //      senderID: Sender's miniLock ID (Base58 string)
    miniLock.crypto.decryptFile(msg,
                                mID,
                                keyPair.secretKey,
                                callback);
  }

  @autobind
  private async login(){
    const host = document.location.host;
    try {
      const resp = await fetch(this.state.protocol + '://' + host + '/api/login', {
        headers: {
          'X-Minilock-Id': this.state.mID,
        },
      });
      // TODO verify the typing around this
      const body = await resp.blob() as any;

      return new Promise((resolve, reject) => {
        this.decryptMsg(body, (fileBlob: Blob, saveName: string, senderID: string) => {
        // Read fileBlob, which contains the auth token
        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
          const authToken = reader.result;
          console.log('authToken:', authToken);
          this.setState({
            authToken,
          });
          resolve();
        });

        reader.readAsText(fileBlob);
      });

      });
    } catch (err) {
      console.error('Error logging in:', err);
    }
  }

  @autobind
  private newWebSocket(url: string): WebSocket{
    const ws: WebSocket = new WebSocket(url);

    ws.onopen = (event) => {
      const authToken = this.state.authToken;
      console.log('Sending auth token', authToken);
      ws.send(authToken);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Event data:', data);
      if (data.error){
        this.onError('Error from server: ' + data.error);
        return;
      }

      // TODO: Ensure ordering of incoming messages
      for (let i = 0; i < data.ephemeral.length; i++) {
        const binStr: string = atob(data.ephemeral[i]);
        const binStrLength = binStr.length;
        const array = new Uint8Array(binStrLength);

        for (let j = 0; j < binStrLength; j++) {
          array[j] = binStr.charCodeAt(j);
        }
        const msg = new Blob([array], {type: 'application/octet-stream'});

        // TODO: Do smarter msgKey creation
        const date = new Date() as any; // TS complains about toGMTString
        const msgKey = date.toGMTString() + ' - ' +
              date.getSeconds() + '.' + date.getMilliseconds() + '.' + i;
        this.decryptMsg(msg, this.onReceiveMessage.bind(this, msgKey));
      }
    };

    return ws;
  }

  @autobind
  private onReceiveMessage(msgKey: string, fileBlob: Blob, saveName: string, senderID: string){
    console.log(msgKey, fileBlob, saveName, senderID);

    const tags = saveName.split('|||');
    console.log('Tags on received message:', tags);

    // TODO: Make more efficient later
    const isTypeChatmessage = tags.includes('type:chatmessage');
    const isTypePicture = tags.includes('type:picture');
    const isTypeRoomName = tags.includes('type:roomname');
    const isTypeRoomDescription = tags.includes('type:roomdescription');

    if (isTypeChatmessage){
      const reader = new FileReader();
      reader.addEventListener('loadend', () => {
        const obj = JSON.parse(reader.result);
        console.log('Decrypted message:', obj);

        const fromUsername = tagByPrefixStripped(tags, 'from:');

        let maybeSenderID = '';
        if (senderID !== this.state.mID){
           maybeSenderID = ' (' + senderID + ')';
        }

        const msg: MessageObj = {
          key: msgKey,
          from: fromUsername + maybeSenderID,
          msg: obj.msg,
        };
        this.setState({
          messages: this.state.messages.concat([msg]),
        });
      });

      reader.readAsText(fileBlob);  // TODO: Add error handling
      return;
    }

    // TODO: Handle other types

    console.log(`onReceiveMessage: got non-chat message with tags ${tags}`);
  }

  @autobind
  public async keypairFromURLHash(){
    let passphrase = document.location.hash || '#';
    passphrase = passphrase.slice(1);

    // Generate new room for user if none specified (that is, if the
    // URL hash is blank)
    if (!passphrase){
      passphrase = genPassphrase();
      document.location.hash = '#' + passphrase;
      this.alert('New room created!', 'success');
    }

    console.log('URL hash is `%s`', passphrase);

    const email = sha384(passphrase) + '@cryptag.org';
    await new Promise((resolve, reject) => {
      miniLock.crypto.getKeyPair(passphrase, email, (keyPair: KeyPairType) => {
        // Code from https://github.com/kaepora/miniLock/blob/ffea0ecb7a619d921129b8b4aed2081050ec48c1/src/js/ui.js#L78
        // May be useful:
        // https://github.com/kaepora/miniLock/blob/master/src/js/miniLock.js#L18
        miniLock.session.keys = keyPair;
        miniLock.session.keyPairReady = true;

        const mID = miniLock.crypto.getMiniLockID(keyPair.publicKey);
        console.log('mID ==', mID);

        this.setState({
          keyPair,
          mID,
        });

        resolve();
      });
    });

    const host = document.location.host;

    await this.login();

    const wsProto = (this.state.protocol === 'https') ? 'wss' : 'ws';
    const wsMsgs = this.newWebSocket(wsProto + '://' + host +
                                    '/api/ws/messages/all');

    this.setState({
      wsMsgs,
    });
  }

  @autobind
  private onSetUsernameClick(){
    this.setState({
      showUsernameModal: true,
    });
  }

  @autobind
  private onCloseUsernameModal(){
    this.setState({
      showUsernameModal: false,
    });
  }

  @autobind
  private onSetUsername(username: string){
    localStorage.setItem(USERNAME_KEY, username);
    this.setState({
      username,
    });
    this.onCloseUsernameModal();
  }

  @autobind
  private populateMessages(response: any){
    const messages = formatMessages(response.body);
    this.setState({
      messages,
    });
  }

  @autobind
  private onSendMessage(message: string){
    this.createMessage(message);
  }

  @autobind
  private createMessage(message: string){
    console.log('Creating message with contents `%s`', message);

    const contents = {msg: message};
    const fileBlob = new Blob([JSON.stringify(contents)],
                            {type: 'application/json'});
    const saveName = ['from:' + this.state.username, 'type:chatmessage'].join('|||');
    (fileBlob as any).name = saveName;

    const mID = this.state.mID;

    console.log('Encrypting file blob');
    if (!this.state.keyPair) {
      throw new Error('keyPair not set in state');
    }

    miniLock.crypto.encryptFile(fileBlob, saveName, [mID],
                                mID, this.state.keyPair.secretKey,
                                this.sendMessageToServer);
  }

  @autobind
  private sendMessageToServer(fileBlob: Blob, saveName: string, senderMinilockID: string){

    const reader = new FileReader();
    reader.addEventListener('loadend', () => {
      // From https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string#comment55137593_11562550
      const b64encMinilockFile = btoa([].reduce.call(
        new Uint8Array(reader.result),
        (p: any, c: any) => p + String.fromCharCode(c)
        , ''));

      const msgForServer = {
        ephemeral: [b64encMinilockFile],
      };
      this.state.wsMsgs.send(JSON.stringify(msgForServer));
    });

    reader.readAsArrayBuffer(fileBlob);  // TODO: Add error handling
  }

  public render(){
    const { username, showUsernameModal } = this.state;

    console.log('Rendering...');

    return (
      <main>
        {showUsernameModal &&
          <UsernameModal
            username={username}
            showModal={showUsernameModal}
            onSetUsername={this.onSetUsername}
            onCloseModal={this.onCloseUsernameModal} />
        }
        <ChatContainer
          messages={this.state.messages}
          username={this.state.username}
          onSendMessage={this.onSendMessage} />
      </main>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));

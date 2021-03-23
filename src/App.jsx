import React from 'react';
import { Layout, Modal, notification, Spin , Button} from 'antd';
const { confirm } = Modal;
const { Header, Content, Sider } = Layout;
import { reactLocalStorage } from 'reactjs-localstorage';
import MediaSettings from './settings';
import ChatFeed from './chat/index';
import Message from './chat/message';
import bLogo from '../public/logo-blue-dark.svg';
import '../styles/css/app.scss';

import LoginForm from './LoginForm';
import Conference from './Conference';
import { HMSClient, HMSPeer, HMSClientConfig } from '@100mslive/hmsvideo-web';
import { dependencies } from '../package.json';

import Participant from './participant';
import { isFunction } from 'formik';
import Poll from './components/Poll/form'

const sdkVersion = dependencies['@100mslive/hmsvideo-web'].substring(1);
console.info(
  `%c[APP] Using hmsvideo-web SDK version ${sdkVersion}`,
  'color:#268bd2'
);

async function getToken({ room_id, user_name, role = 'guest', env }) {
  const endpoint = `${process.env.TOKEN_ENDPOINT}?api=token`;
  const { token } = await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({ room_id, user_name, env, role }),
  })
    .then(response => response.json())
    .catch(err => console.log('Error client token: ', err));
  return token;
}

// const pollQuestion = 'Is react-polls useful?'
// const pollAnswers = [
//   { option: 'Yes', votes: 8 },
//   { option: 'No', votes: 2 }
// ]

class App extends React.Component {
  constructor() {
    super();
    this.client = null;
    this.isConnected = false;
    this.role = 'Guest';
    this.state = {
      login: false,
      loading: false,
      localAudioEnabled: true,
      localVideoEnabled: true,
      screenSharingEnabled: false,
      collapsed: true,
      rightCollapsed : true,
      pollCollapsed: true,
      isFullScreen: false,
      vidFit: false,
      loginInfo: {},
      messages: [],
      participantsList: [],
      privateMessages: {},
      isPollActive:false,
      pollOptionsVote:{},
      voted : false,
      selectOptionId : -1,
    };

    this._settings = {
      selectedAudioDevice: '',
      selectedVideoDevice: '',
      resolution: 'qvga',
      bandwidth: 256,
      codec: 'VP8',
      frameRate: 20,
      isDevMode: true,
    };

    let settings = reactLocalStorage.getObject('settings');
    if (settings.codec !== undefined) {
      this._settings = { ...this._settings, ...settings };
    }
  }

  _cleanUp = async () => {
    window.history.pushState({}, '100ms', `${window.location.href}`);
    await this.conference.cleanUp();
    await this.client.disconnect();
    this.client = null;
    this.isConnected = false;
    this.setState({
      login: false,
    });
  };

  _notification = (message, description) => {
    notification.info({
      message: message,
      description: description,
      placement: 'bottomRight',
    });
  };

  _createClient = async ({ userName, env, roomId, role }) => {
    let url = process.env.HMS_ENDPOINT;
    let authToken = await getToken({
      env,
      room_id: roomId,
      user_name: userName,
      role,
    });

    console.log(`%c[APP] TOKEN IS: ${authToken}`, 'color: orange');

    try {
      let peer = new HMSPeer(userName, authToken);

      let config = new HMSClientConfig({
        endpoint: url,
      });

      return new HMSClient(peer, config);
    } catch (err) {
      console.error('ERROR: ', err);
      alert('Invalid token');
    }
  };

  _handleJoin = async values => {
    console.log(values);

    console.log("handle join func");
    this.setState({ loading: true });
    let settings = this._settings;
    this.roomName = values.roomName;
    this.roomId = values.roomId;
    this.hideMessage = () => {};
    settings.selectedVideoDevice = values.selectedVideoDevice;
    settings.selectedAudioDevice = values.selectedAudioDevice;
    //TODO this should reflect in initialization as well

    this._onMediaSettingsChanged(
      settings.selectedAudioDevice,
      settings.selectedVideoDevice,
      settings.resolution,
      settings.bandwidth,
      settings.codec,
      settings.frameRate,
      settings.isDevMode
    );

    let client = await this._createClient({
      userName: values.displayName,
      roomId: values.roomId,
      role: values.role,
    });
    client.connect().catch(error => {
      alert(error.message);
    });

    window.onunload = async () => {
      await this._cleanUp();
    };

    client.on('peer-join', (room, peer) => {
      this._notification('Peer Join', `peer => ${peer.name} joined ${room}!`);
      
      console.log(peer);
    });

    client.on('peer-leave', (room, peer) => {
      this._notification('Peer Leave', `peer => ${peer.name} left ${room}!`);
    });

    client.on('connect', () => {
      console.log('on connect called');

      if (this.isConnected) return;
      console.log('connected!');
      this._handleTransportOpen(values);
    });

    client.on('disconnect', () => {
      console.log('disconnected!');
      this.setState({
        loading: false,
      });
    });

    client.on('stream-add', (room, peer, streamInfo) => {
      console.log('stream-add %s,%s,%s!', room, peer.peerId,peer.customerUserId);
      this._updateParticipatantList(peer.customerUserId,peer.peerId);
      console.log("participantlsit!!!!!");
      console.log(this.state.participantsList);
    });

    client.on('stream-remove', (room, streamInfo) => {
      console.log(`stream-remove: ${room}, ${streamInfo.mid}`);
    });

    client.on('broadcast', (room, peer, message) => {
      console.log('broadcast: ', room, peer.name, message);
      console.log(message);
      console.log(peer);
      if(message.msg === 'raise a hand')
        this._raiseHand(peer.name);
      else if(message.type == 'poll ended')
        this._endPoll();
      else if(message.type == 'poll created')
        this._onActivatePoll()
      else if(message.type == 'poll selcted option')
        this._updatePollVotes(message.id);  
      else  
        this._onMessageReceived(peer.name, message);
    });

    client.on('disconnected', async () => {
      console.log(`%c[APP] TEARING DOWN`, 'color:#fc0');
      // @NOTE: Implement a cleaner tear down logic for graceful UI transition instead of a page reload
      location.reload();
    });

    this.client = client;
    console.log(this.client);
    this.role = values.role;
  };



  _handleTransportOpen = async values => {
    this.isConnected = true;
    reactLocalStorage.remove('loginInfo');
    reactLocalStorage.setObject('loginInfo', values);
    try {
      await this.client.join(values.roomId);
      //TODO ugly hack
      let redirectURL = `/?room=${values.roomId}&role=${values.role}`;
      window.history.pushState({}, '100ms', redirectURL);
      this.setState({
        login: true,
        loading: false,
        loginInfo: values,
        localVideoEnabled: !values.audioOnly,
        localAudioEnabled: !values.videoOnly,
      });

      this._notification(
        'Connected!',
        'Welcome to the 100ms room => ' + values.roomId
      );
      await this.conference.handleLocalStream(true);

      //edited
      this._updateParticipatantList(values.displayName, this.client.uid);
    
    } catch (error) {
      console.error('HANDLE THIS ERROR: ', error);
    }
  };

  _handleLeave = async () => {
    let client = this.client;
    let this2 = this;
    confirm({
      title: 'Leave Now?',
      content: 'Do you want to leave the room?',
      async onOk() {
        await this2._cleanUp();
        this2.setState({ login: false });
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  };

  _handleAudioTrackEnabled = enabled => {
    this.setState({
      localAudioEnabled: enabled,
    });
    this.conference.muteMediaTrack('audio', enabled);
  };

  _handleVideoTrackEnabled = enabled => {
    this.setState({
      localVideoEnabled: enabled,
    });
    this.conference.muteMediaTrack('video', enabled);
  };

  _handleScreenSharing = enabled => {
    this.setState({
      screenSharingEnabled: enabled,
    });
    this.conference.handleScreenSharing(enabled);
  };

  _onRef = ref => {
    this.conference = ref;
  };

  _openOrCloseLeftContainer = collapsed => {
    this.setState({
      collapsed: collapsed,
    });
  };

  //edited
  _openOrCloseRightContainer = rightCollapsed => {
    this.setState({
      rightCollapsed: rightCollapsed,
    });
  };
  _openOrClosePollBox = pollCollapsed =>{
    this.setState({
      pollCollapsed : pollCollapsed,
    })
  }

  _onVidFitClickHandler = () => {
    this.setState({
      vidFit: !this.state.vidFit,
    });
  };

  _onFullScreenClickHandler = () => {
    let docElm = document.documentElement;

    if (this._fullscreenState()) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }

      this.setState({ isFullScreen: false });
    } else {
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
      }
      //FireFox
      else if (docElm.mozRequestFullScreen) {
        docElm.mozRequestFullScreen();
      }
      //Chrome等
      else if (docElm.webkitRequestFullScreen) {
        docElm.webkitRequestFullScreen();
      }
      //IE11
      else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }

      this.setState({ isFullScreen: true });
    }
  };

  _fullscreenState = () => {
    return (
      document.fullscreen ||
      document.webkitIsFullScreen ||
      document.mozFullScreen ||
      false
    );
  };

  _onMediaSettingsChanged = (
    selectedAudioDevice,
    selectedVideoDevice,
    resolution,
    bandwidth,
    codec,
    frameRate,
    isDevMode,
    reloadPage = false
  ) => {
    this._settings = {
      selectedAudioDevice,
      selectedVideoDevice,
      resolution,
      bandwidth,
      codec,
      frameRate,
      isDevMode,
    };
    reactLocalStorage.setObject('settings', this._settings);
    const constraints = {
      frameRate: frameRate,
      bitrate: bandwidth,
      resolution: resolution,
      advancedMediaConstraints: {
        audio: {
          deviceId: selectedAudioDevice,
        },
        video: {
          deviceId: selectedVideoDevice,
        },
      },
    };
    if (reloadPage) {
      this.client &&
        this.client.applyConstraints(constraints, this.client.local);
    }
  };

  _onMessageReceived = (from, message) => {
    console.log(message.type);
    console.log("advs");
    // console.log('Received message:' + from + ':' + message);
    let uid = 1;

    if(message.type === 'public'){
      console.log("inside public messge");
      let messages = this.state.messages;
     
      messages.push(new Message({ id: uid, message: message.msg, senderName: from }));
      this.setState({ messages });
    }
    else {
      if(message.receipentId != this.client.uid)
      return 
      
      console.log("isnide priavteMsg");
      let privateMessages = this.state.privateMessages;
      console.log(privateMessages[message.senderId]);
      if(typeof privateMessages[message.senderId] != 'undefined'){
        privateMessages[message.senderId].push(new Message({ id: uid, message: message.msg, senderName: from }));
        
      }
      
        else {
          console.log("insode else");
          privateMessages[message.senderId]=[];
          console.log(privateMessages[message.senderId])
          // let uid
          try{
          (privateMessages[message.senderId]).push(new Message({ id: uid, message: message.msg, senderName: from }));
        } catch(e){
          console.log(e);
        }
          console.log(uid);
          console.log(message.msg);
          console.log(from);
          console.log(privateMessages[message.senderId])
        }
        console.log(privateMessages);
        try{
          this.setState(prevState=>({ 
            privateMessages : {
              ...prevState.privateMessages,
              [message.senderId] : privateMessages[message.senderId]
            }
          }))
        } catch(e){console.log(e);}
        console.log(this.state.privateMessages);
    }
  };

  _onSendMessage = data => {
    console.log('Send message:' + data);
    var info = {
      type: data.type,
      senderName: this.state.loginInfo.displayName,
      msg: data.msg,
      receipentId : data.receipentId,
      senderId : this.client.uid
    };
    console.log(info)
    this.client.broadcast(info, this.client.rid);
    let uid = 0;
    if(data.type === 'public'){
      let messages = this.state.messages;
      messages.push(new Message({ id: uid, message: data.msg, senderName: 'me' }));
      this.setState({ messages });
    }

    else{
      let privateMessages = this.state.privateMessages;
      if(typeof privateMessages[data.receipentId] != 'undefined'){
        privateMessages[data.receipentId].push(new Message({ id: uid, message: data.msg, senderName: 'me' }));
      }
      else{
          privateMessages[data.receipentId]=[];
          console.log(privateMessages[data.receipentId])
          // let uid
          try{
          (privateMessages[data.receipentId]).push(new Message({ id: uid, message: data.msg, senderName: 'me' }));
        } catch(e){
          console.log(e);
        }
      }
      try{
        this.setState(prevState=>({ 
          privateMessages : {
            ...prevState.privateMessages,
            [data.receipentId] : privateMessages[data.receipentId]
          }
        }))
      } catch(e){console.log(e);}
      console.log(this.state.privateMessages);
    }
  };

  //edited
  _onRaiseHand = ()=>{

    console.log("inside onRaiseHand");
    var info = {
      type: "raise hand",
      senderName: this.state.loginInfo.displayName,
      msg: `raise a hand`,
    };
    this.client.broadcast(info,this.client.rid);
  }

  _raiseHand = (name) =>{
    console.log("inside _raiseHand");
    console.log(this.client);
    if(this.role == 'Host')
      this._notification("Raise Hand",`${name} has raise hand`);
  }

  //edited
  _updateParticipatantList =(participantName, userId) =>{

    let participantsList = this.state.participantsList;
    participantsList.push(new Participant({id : userId, senderName : participantName}));
    this.setState({participantsList});
  }

  _sendSelectedOptionPoll = id=>{
    this.setState({voted : true})
    this.setState({selectedOptionId : id})
    this._updatePollVotes(id);
    var info = {
      type: "poll selcted option",
      senderName: this.state.loginInfo.displayName,
      id : id,
    };
    this.client.broadcast(info,this.client.rid);
  }

  _endPoll =() =>{
    // this.setState({isPollActive : false})
    // this.setState({voted : false})
    // this.setState({selectOptionId : -1})
    this.setState({
      isPollActive : false,
      voted : false,
      selectedOptionId : -1
    })
    this._notification('Poll has ended','')
  }

  _onEndPoll = ()=>{
    
    this._endPoll();
    // this.setState({voted : false})
    // this.setState({selectOptionId : -1})
    var info = {
      type: "poll ended",
      senderName: this.state.loginInfo.displayName,
      // id : id,
    };
    this.client.broadcast(info,this.client.rid)
    console.log(this.state.pollOptionsVote)
    
  }
  _onActivatePoll = async ()=>{
    await this.setState({isPollActive: true})
    console.log(this.state.isPollActive)
    this._notification("Poll has been Created","")
  }
  _createPoll=async ()=>{
    console.log("inside cratePoll");
    await this._onActivatePoll();
    var info = {
      type: "poll created",
      senderName: this.state.loginInfo.displayName,
      // id : id,
    };
    this.client.broadcast(info,this.client.rid)
    
  }

  _updatePollVotes=(id) =>{
    let pollOptionsVote = this.state.pollOptionsVote;
    let selectedOptionId =id;
    let currentVote=0
    if(typeof pollOptionsVote[selectedOptionId] == 'undefined')
      currentVote=1;
    else currentVote = pollOptions[selectedOptionId] + 1;
    
    this.setState(prevState =>({
      pollOptionsVote : {
        ...prevState.pollOptionsVote,
        [selectedOptionId] : currentVote 
      }
    }))
    console.log(this.state.pollOptionsVote)
  }

  render() {
    const {
      login,
      loading,
      localAudioEnabled,
      localVideoEnabled,
      screenSharingEnabled,
      collapsed,
      rightCollapsed,
      pollCollapsed,
      vidFit,
      isPollActive
    } = this.state;
    return (
      <Layout className="app-layout">
        <Header
          className="app-header"
          style={{
            backgroundColor: '#0B0F15',
            zIndex: '10',
            padding: '0 0',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <div className="app-header-left">
            <a href="https://100ms.live/" target="_blank">
              <img src={bLogo} className="h-8" />
            </a>
          </div>
          <div className="app-header-right">
            <MediaSettings
              onMediaSettingsChanged={this._onMediaSettingsChanged}
              settings={this._settings}
              isLoggedIn={login}
            />
          </div>
        </Header>

        <Content className="app-center-layout">
          {login ? (
            <Layout className="app-content-layout">
              <Sider
                width={320}
                collapsedWidth={0}
                trigger={null}
                collapsible
                collapsed={this.state.collapsed}
                style={{ backgroundColor: '#0B0F15' }}
              >
                <div className="left-container">
                  <ChatFeed
                  messageType='public'
                    messages={this.state.messages}
                    onSendMessage={this._onSendMessage}
                  />
                </div>
              </Sider>

              


              <Layout className="app-right-layout">
                <Content style={{ flex: 1, position: 'relative' }}>
                  <div>
                    <Conference
                      roomName={this.roomName}
                      roomId={this.roomId}
                      collapsed={this.state.collapsed}
                      
                      //edited
                      pollCollapsed = {this.state.pollCollapsed}
                      rightCollapsed = {this.state.rightCollapsed}
                      client={this.client}
                      settings={this._settings}
                      localAudioEnabled={localAudioEnabled}
                      localVideoEnabled={localVideoEnabled}
                      vidFit={vidFit}
                      loginInfo={this.state.loginInfo}
                      ref={ref => {
                        this.conference = ref;
                      }}
                      isScreenSharing={screenSharingEnabled}
                      onScreenToggle={() =>
                        this._handleScreenSharing(!screenSharingEnabled)
                      }
                      onLeave={this._handleLeave}
                      onChatToggle={() =>
                        this._openOrCloseLeftContainer(!collapsed)
                      }
                      isChatOpen={!this.state.collapsed}
                      cleanUp={this._cleanUp}

                      //edited
                      onRaiseHand={this._onRaiseHand}

                      isPrivateChatOpen={!this.state.rightCollapsed}
                      isPollBoxOpen={!this.state.pollCollapsed}
                      onPrivateChatToggle ={()=>
                        this._openOrCloseRightContainer(!rightCollapsed) 
                      }
                      onPollBoxToggle={()=>{
                        this._openOrClosePollBox(!pollCollapsed)
                      }}

                      // onPollCreate={this._onPollCreate} 
                    />
                  </div>
                </Content>
              </Layout>

              <Sider
                width={320}
                collapsedWidth={0}
                trigger={null}
                collapsible
                collapsed={this.state.pollCollapsed}
                style={{ backgroundColor: '#0B0F15' }}
              >
                {/* <div>
                  {
                    isPollActive ?(
                  <> */}
                  <Poll 
                    question={this.state.pollQuestion} 
                    options={this.state.pollOptions} 
                    onVote={this._sendSelectedOptionPoll} 
                    isPollActive={this.state.isPollActive}
                    endPoll = {this._onEndPoll}
                    createPoll = {this._createPoll}
                    voted={this.state.voted}
                    pollVotes={this.state.pollOptionsVote}
                    role={this.role}
                    />
                
              </Sider>
              
              <Sider
                width={320}
                collapsedWidth={0}
                trigger={null}
                collapsible
                collapsed={this.state.rightCollapsed}
                style={{ backgroundColor: '#0B0F15' }}
              >
                {/* <div>
                  {
                    isPollActive ?(
                  <> */}
                  {/* <Poll 
                    question={this.state.pollQuestion} 
                    options={this.state.pollOptions} 
                    onVote={this._sendSelectedOptionPoll} 
                    isPollActive={this.state.isPollActive}
                    endPoll = {this._onEndPoll}
                    createPoll = {this._createPoll}
                    voted={this.state.voted}
                    pollVotes={this.state.pollOptionsVote}
                    role={this.role}
                    /> */}
                    {/* </>)

                    :(<Button onClick={this._createPoll}> Create POll</Button>)
                  }
                </div> */}
                <div className="left-container">
                  <ChatFeed
                    messageType= 'private'
                    messages={this.state.messages}
                    onSendMessage={this._onSendMessage}
                    participantsList = {this.state.participantsList}
                    privateMessages = {this.state.privateMessages}
                  />
                </div>
              </Sider>

            </Layout>
          ) : loading ? (
            <Spin size="large" tip="Connecting..." />
          ) : (
            <div className="relative w-full mt-16">
              <LoginForm
                handleLogin={this._handleJoin}
                createClient={this._createClient}
              />
            </div>
          )}
        </Content>
      </Layout>
    );
  }
}

export default App;

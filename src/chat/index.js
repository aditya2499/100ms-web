'use strict';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import ChatBubble from './chatbubble';
import ChatInput from './chatinput';
import './style.scss';

import { Menu, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';

function RenderParticipantList({participantsList}){
  const list = participantsList.map((participant)=>{
         
    // <div>
    <Menu.Item key={participant.id}>{participant.senderName}</Menu.Item>
    {/* <li>--{cmnt.author} {cmnt.date}</li> */}
    // </div>
    
 
})
  return (
    <>
    {list}
     </>
   )
}

export default class ChatFeed extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messageType: props.messageType,
      messages: props.messages || [],
      currentParticipantName: "Everyone",
      currentParticpantId: null, 
      participantsList: props.participantsList || [],
      privateMessages : props.privateMessages || {}

    };
  }

  _scrollToBottom() {
    const { chat } = this.refs;
    if (chat !== undefined) {
      const scrollHeight = chat.scrollHeight;
      const height = chat.clientHeight;
      const maxScrollTop = scrollHeight - height;
      ReactDOM.findDOMNode(chat).scrollTop =
        maxScrollTop > 0 ? maxScrollTop : 0;
    }
  }

  _renderGroup(messages, index, id) {
    var group = [];

    for (var i = index; messages[i] ? messages[i].id == id : false; i--) {
      group.push(messages[i]);
    }

    var message_nodes = group.reverse().map((curr, index) => {
      return <ChatBubble key={Math.random().toString(36)} message={curr} />;
    });
    return (
      <div key={Math.random().toString(36)} className="chatbubble-wrapper">
        {message_nodes}
      </div>
    );
  }

  _renderMessages(messages) {
    var message_nodes = messages.map((curr, index) => {
      // Find diff in message type or no more messages
      if (
        (messages[index + 1] ? false : true) ||
        messages[index + 1].id != curr.id
      ) {
        return this._renderGroup(messages, index, curr.id);
      }
    });
    // return nodes
    return message_nodes;
  }

  _updateTargetParticipant = async (event) => {
    console.log("update participant id name");
    console.log(event);
    await this.setState({currentParticipantId : event.key})
    await this.setState({currentParticipantName: event.item.props.children})
    console.log(this.state.currentParticipantName)
    console.log(this.state.currentParticipantId)
  }

  _onSendMessage = data =>{

    this.props.onSendMessage({
      type : this.state.messageType,
      msg : data,
      receipentId : this.state.currentParticipantId
    })
  }



  // RenderParticipantList= ({participantsList})=>{
  //   const list = participantsList.map((participant)=>{
           
  //     // <div>
  //     <Menu.Item key={participant.id}>{participant.senderName}</Menu.Item>
  //     {/* <li>--{cmnt.author} {cmnt.date}</li> */}
  //     // </div>
      
   
  // })
  //   return (
  //     <Menu onClick={this._updateTargetParticipant}>
  //     {list}
  //     </Menu>
       
  //    )
  // }

  render() {

    const{
      currentParticipantId
    } = this.state;

    const isPrivate = this.state.messageType=='private' ? true : false;
    console.log(isPrivate)
  //   const list = (this.props.participantsList.map((participant)=>{
         
  //       //  <div>
  //        <Menu.Item key={participant.id}>{participant.senderName}</Menu.Item>
  //        {/* <li>--{cmnt.author} {cmnt.date}</li> */}
  //        {/* </div> */}
         
      
  //  }))
  console.log("menu")
    console.log(this.state.participantsList)
    const menu = (
      <Menu onClick={this._updateTargetParticipant}>
        {/* <Menu.Item key="1">1st menu item</Menu.Item>
        <Menu.Item key="2">2nd menu item</Menu.Item>
        <Menu.Item key="3">3rd menu item</Menu.Item> */}
       {/* <RenderParticipantList participantsList = {this.props.participantsList}/> */}
        {
          this.state.participantsList.map((participant)=>{
            return <Menu.Item key={participant.id}>{participant.name}</Menu.Item>
          })
        }
      
      </Menu>
    );

    

    window.setTimeout(() => {
      this._scrollToBottom();
    }, 10);

    const messages = [
      { id: 0, message: 'hello every one', senderName: 'kevin kang' },
    ];

    return (
      <div
        id="chat-panel"
        className="flex flex-1 flex-col"
        style={{ backgroundColor: '#000000' }}
      >
        <div className="title-panel">
          <span className="title-chat">Chat</span>
        </div>

        {isPrivate ?(
        <>
        <Dropdown className="title-panel" overlay={menu}>
          <a className="ant-dropdown-link" className="title-chat" onClick={e => e.preventDefault()}>
            {this.state.currentParticipantName} 
            {/* <DownOutlined /> */}
          </a>
        </Dropdown>

        <div ref="chat" className="chat-history">
        { typeof this.props.privateMessages[currentParticipantId] != 'undefined' ? 
          (<div>{this._renderMessages(this.props.privateMessages[currentParticipantId])}</div>) :
          (<div></div>)
        }
        </div>

        </>
        )
        :(
          <div ref="chat" className="chat-history">
           
          <div>{this._renderMessages(this.props.messages)}</div>
          
          </div>
          )
        }

        

        
        <ChatInput onSendMessage={this._onSendMessage} />
      </div>
    );
  }
}

ChatFeed.propTypes = {
  isTyping: PropTypes.bool,
  messages: PropTypes.array.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  // participantsList: PropTypes.array.isRequired
};

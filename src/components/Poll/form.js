import React, { Component }  from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import "./Poll.css";
import { Button} from 'antd';
import {PollResult} from './PollResult'

export default class Poll extends Component{ 
   constructor(props){
      super(props);
      this.state={
         question : 'Question',
      options: [
        { "id": 0, "votes": 0, "option": "Option One" },
        { "id": 1, "votes": 0, "option": "Option Two" },
        { "id": 2, "votes": 0, "option": "Option Three" },
        { "id": 3, "votes": 0, "option": "Option Four" }
     ],
     
      };
   }

   _submitVote = (e) => {
      console.log(e.target.id)
      if(this.props.voted === false) {
        const voteSelected = e.target.id;
        // console.log(this.props.selectOptionId)
        this.props.onVote(voteSelected)
      }
    }

  render(){
     const {
       options,
       question,
      } = this.state;
      const {isPollActive} = this.props
   const pollOptions = options.map((item) => {
      return (
        <li key={item.id}>
          <button onClick={this._submitVote} id={item.id}>
            {item.option}
          </button>          
        </li>
      );
    });
   return (
     <>
      { isPollActive ? (
        <>
      <div className="poll">
        <h1 className ='title-chat'>{question}</h1>
        <ul className={this.props.voted ? "results" : "options"}>
          {pollOptions}
        </ul>
      </div>
      { this.props.role == 'Host' ? (
         <Button onClick={this.props.endPoll}> End Poll</Button>) :(<></>)
      }
      </>
      ) : this.props.role == 'Host' ? (
        <>
        <PollResult options={this.state.options} pollVotes={this.props.pollVotes}></PollResult>
        
        <Button onClick={this.props.createPoll}> Create POll</Button>
        </>
      ) : (<></>)
      }
      </>
    );
   }
};



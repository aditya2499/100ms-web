import './Poll.css'
import React from 'react';

const PollResult = ({
   options,
   pollVotes
}) =>{

   const pollOptionsResult = options.map((item) => {
      return (
        <li key={item.id}>
          <button id={item.id}>
            {item.option} : totalVotes = {typeof pollVotes[item.id] == 'undefined'? 0 : pollVotes[item.id]}
            {/* <span>- {item.votes} Votes</span> */}
          </button>          
        </li>
      );
    });
   return (
      <div className="poll">
        <h1 className ='title-chat'>Result</h1>
        <ul className='results'>
          {pollOptionsResult}
        </ul>
      </div>
   )
}

export {PollResult}
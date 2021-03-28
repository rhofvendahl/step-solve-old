import React from 'react';
import '../styles/App.css';

const App = () => {
  return (
    <div className='app'>
      {/* <div className='solver-wrapper'> */}
      <div className='solver'>
        <div className = 'solver-left'>
          <div className='solver-input' />
          <div className='solver-description' />
          <div className='solver-description' />
          <div className='solver-description' />
        </div>
        <div className='solver-middle' />
        <div className = 'solver-right'>
          <div className='solver-initial' />
          <div className='solver-step' />
          <div className='solver-step' />
          <div className='solver-step' />
        </div>
      </div>
      {/* </div> */}
    </div>
  );
};

export default App;

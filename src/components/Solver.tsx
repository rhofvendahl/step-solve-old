import React from 'react';
import Input from './Input';
import Step from './Step';
import Description from './Description';
import '../styles/Solver.css';

const Solver = () => {
  return (
    <div className='solver'>
      <div className = 'solver-left'>
        <Input />
        <Description />
        <Description />
        <Description />
      </div>
      <div className='solver-middle' />
      <div className = 'solver-right'>
        <Step
          initial={true}
        />
        <Step />
        <Step />
        <Step />
      </div>
    </div>
  );
};

export default Solver;

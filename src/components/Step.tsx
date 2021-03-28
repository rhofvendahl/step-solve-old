import React from 'react';
import '../styles/Step.css';

type StepProps = {
  initial?: boolean,
}
const Step = ({ initial }: StepProps) => {
  return (
    <div className={initial ? 'initial-step' : 'step'}>
    </div>
  );
};

export default Step;

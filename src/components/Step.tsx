import React from 'react';
import '../styles/Step.css';

type StepProps = {
  initial?: boolean,
}
const Step = ({ initial }: StepProps) => {
  return (
    <div className={initial ? 'step step-initial' : 'step step-next'}>
    </div>
  );
};

export default Step;

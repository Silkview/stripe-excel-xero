import { useCallback, useState } from 'react';
import { hasCompletedFirstRun, markFirstRunComplete } from '../utils/firstRun';
import WelcomeHeroScreen from './welcome/WelcomeHeroScreen';
import ValuePropScreen from './welcome/ValuePropScreen';
import SignInScreen from './welcome/SignInScreen';

type Step = 'welcome' | 'valueProp' | 'signIn';

type WelcomePanelProps = {
  onSignIn: () => void;
  signingIn: boolean;
  sessionExpired?: boolean;
};

function getInitialStep(sessionExpired: boolean): Step {
  if (sessionExpired || hasCompletedFirstRun()) {
    return 'signIn';
  }
  return 'welcome';
}

export default function WelcomePanel({
  onSignIn,
  signingIn,
  sessionExpired = false,
}: WelcomePanelProps) {
  const [step, setStep] = useState<Step>(() => getInitialStep(sessionExpired));

  const goToSignIn = useCallback(() => {
    markFirstRunComplete();
    setStep('signIn');
  }, []);

  if (step === 'welcome') {
    return (
      <WelcomeHeroScreen
        onGetStarted={() => setStep('valueProp')}
        onSignIn={goToSignIn}
      />
    );
  }

  if (step === 'valueProp') {
    return <ValuePropScreen onStartTrial={goToSignIn} />;
  }

  return (
    <SignInScreen
      onSignIn={onSignIn}
      signingIn={signingIn}
      sessionExpired={sessionExpired}
    />
  );
}

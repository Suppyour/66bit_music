import React from 'react';
import Hero from './components/Hero/Hero';
import Cards from './components/Cards/Cards';
import HowItWorks from './components/HowItWorks/HowItWorks';
import CallToAction from './components/CallToAction/CallToAction';

interface MainPageProps {
  onLoginClick?: () => void;
}

const MainPage: React.FC<MainPageProps> = ({ onLoginClick }) => {
  return (
    <main className="main-content">
      <Hero onLoginClick={onLoginClick} />
      <Cards />
      <HowItWorks />
      <CallToAction />
    </main>
  );
};

export default MainPage;

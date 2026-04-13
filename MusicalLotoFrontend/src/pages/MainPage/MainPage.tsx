import React from 'react';
import Hero from './components/Hero/Hero';
import Cards from './components/Cards/Cards';
import HowItWorks from './components/HowItWorks/HowItWorks';
import CallToAction from './components/CallToAction/CallToAction';

const MainPage: React.FC = () => {
  return (
    <main className="main-content">
      <Hero />
      <Cards />
      <HowItWorks />
      <CallToAction />
    </main>
  );
};

export default MainPage;

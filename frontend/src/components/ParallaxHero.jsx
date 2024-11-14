import React, { useEffect, useState } from 'react';

const ParallaxHero = () => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="relative h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80")',
          transform: `translateY(${offset * 0.5}px)`,
        }}
      />
      <div className="absolute inset-0 bg-black opacity-50" />
      <div className="relative h-full flex items-center justify-center text-center text-white px-4">
        <div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
            Unlock Your Potential
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl mb-8">
           Freelance, Find Jobs, Internships, and Build Your Perfect Resume
          </p>
          <a
            href="/gigs"
            className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold text-lg hover:bg-indigo-100 transition duration-300"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
};

export default ParallaxHero;
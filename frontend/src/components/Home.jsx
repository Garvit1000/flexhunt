import React, { useState } from 'react';
import { BriefcaseIcon, GraduationCapIcon, FileTextIcon, SearchIcon } from 'lucide-react';
import Navbar from './Navbar';
import ParallaxHero from './ParallaxHero';
import FeatureSection from './FeatureSection';
import SignUpSection from './SignUpSection';
import CommunityForum from './CommunityForum';
import Footer from './Footer';
import SignInPopup from './SignInPopup';
import AnimatedSection from './AnimatedSection';
import Carousel from './Carousel';
import InternshipBanner from './InternshipBanner';
const Home = () => {
    
 
  return (
    
    <div id='home' className="min-h-screen bg-gray-50">
      

      {/* Hero Section */}
      <ParallaxHero />

      <main className="container mx-auto px-4 py-16">
        {/* Section Header */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-gray-50 text-lg font-medium text-gray-900">
              Empower Your Career
            </span>
          </div>
        </div>
       

        {/* Feature Sections */}
        <div >
         <FeatureSection />
        </div>
        
        <AnimatedSection />

        {/* Signup Section and Community Forum */}
        <Carousel/>
        <SignUpSection />
        <InternshipBanner />

        
        <CommunityForum />

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <a href="#" className="btn" >
          {/* onClick={openSignInPopup} */}
            <SearchIcon className="w-5 h-5 mr-2" />
            Start Your Journey
          </a>
        </div>
        
      </main>
     
     
      

      
    </div>
   
  );
}

export default Home;

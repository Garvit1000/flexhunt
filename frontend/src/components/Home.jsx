import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
    
  return (
    <div id='home' className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <ParallaxHero />

      {/* Create Resume Button - New Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Create Your Professional Resume
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Stand out from the crowd with our professional resume builder. Create a compelling resume that highlights your skills and experience.
          </p>
          <button
            onClick={() => navigate('/resume-builder')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg transform hover:-translate-y-0.5 transition-all duration-150"
          >
            <FileTextIcon className="w-5 h-5 mr-2" />
            Create Resume Now
          </button>
        </div>
      </div>

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
          <button 
            onClick={() => navigate('/resume-builder')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <FileTextIcon className="w-5 h-5 mr-2" />
            Create Your Resume
          </button>
          <a href="#" className="btn ml-4">
            <SearchIcon className="w-5 h-5 mr-2" />
            Start Your Journey
          </a>
        </div>
        
      </main>
     
     
      

      
    </div>
   
  );
}

export default Home;

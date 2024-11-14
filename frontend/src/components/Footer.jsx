import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - FlexHunt Content */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-white mb-4">FlexHunt</h2>
            <p className="text-gray-300 mb-6">
              Connecting talented professionals with the best freelance opportunities and internships worldwide.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" aria-hidden="true" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" aria-hidden="true" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" aria-hidden="true" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-6 w-6" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Right Columns - Navigation */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Find Work
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="/gigs" className="text-base text-gray-300 hover:text-white">
                      Freelance Jobs
                    </a>
                  </li>
                  <li>
                    <a href="internship-page" className="text-base text-gray-300 hover:text-white">
                      Internships
                    </a>
                  </li>
                  <li>
                    <a href="resume-builder" className="text-base text-gray-300 hover:text-white">
                      Resume Builder
                    </a>
                  </li>
                  <li>
                    <a href="/job-page" className="text-base text-gray-300 hover:text-white">
                      jobs
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  About
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="/about" className="text-base text-gray-300 hover:text-white">
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-gray-300 hover:text-white">
                      How It Works
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-gray-300 hover:text-white">
                      Success Stories
                    </a>
                  </li>
                  <li>
                    <a href="/contact-us" className="text-base text-gray-300 hover:text-white">
                      Contact Us
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright Section */}
        <div className="mt-8 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 text-center">
            &copy; 2024 FlexHunt, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import React from 'react';
import { GraduationCap, Briefcase, Award, Users, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
const Button = ({ children, className, ...props }) => (
  <button
    className={`bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300 flex items-center ${className}`}
    {...props}
  >
    {children}
  </button>
);

const IconBox = ({ Icon, text, color }) => (
  <div className={`flex items-center space-x-2 bg-${color}-100 p-2 rounded-md`}>
    <Icon className={`w-5 h-5 text-${color}-600`} />
    <span className={`text-sm font-medium text-${color}-800`}>{text}</span>
  </div>
);

const InternshipBanner = () => {
  return (
    <div id="internships" className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 md:p-12 rounded-xl shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      
      <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
        <div className="max-w-md mb-8 md:mb-0">
          <h2 className="text-xl font-bold mb-2 text-blue-800">internship launchpad.</h2>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-blue-900">
            Kickstart your career <span className="text-blue-600">with top internships</span>
          </h1>
          <p className="text-blue-700 mb-6">
            Gain valuable experience and build your professional network with our curated internship opportunities.
          </p>
          <Link to="/internship-page">
          <Button className="bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md">
            Explore Opportunities
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <IconBox Icon={GraduationCap} text="Learn from Experts" color="blue" />
          <IconBox Icon={Briefcase} text="Real-world Projects" color="green" />
          <IconBox Icon={Award} text="Skill Certification" color="yellow" />
          <IconBox Icon={Users} text="Networking Events" color="purple" />
          <div className="col-span-2">
            <IconBox Icon={Calendar} text="Flexible Schedules Available" color="red" />
          </div>
        </div>
      </div>
      
      
    </div>
  );
};

export default InternshipBanner;
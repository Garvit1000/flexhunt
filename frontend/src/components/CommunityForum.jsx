import React from 'react';
import { MessageSquareIcon, UsersIcon, TrendingUpIcon } from 'lucide-react';

const CommunityForum = () => {
  return (
    <section id="community" className="my-16 bg-white shadow-md rounded-lg p-8 relative overflow-hidden">
     <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 opacity-50"></div>
      <div className="relative z-10">
        <h2 className="text-3xl font-bold text-center mb-12">Community Forum</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md transition duration-300 hover:shadow-lg transform hover:-translate-y-1">
            <MessageSquareIcon className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-center">Discuss</h3>
            <p className="text-gray-600 text-center">Engage in meaningful conversations with peers and industry experts.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md transition duration-300 hover:shadow-lg transform hover:-translate-y-1">
            <UsersIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-center">Network</h3>
            <p className="text-gray-600 text-center">Build valuable connections and expand your professional network.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md transition duration-300 hover:shadow-lg transform hover:-translate-y-1">
            <TrendingUpIcon className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-center">Grow</h3>
            <p className="text-gray-600 text-center">Learn from others' experiences and accelerate your career growth.</p>
          </div>
        </div>
        <div className="mt-12 text-center">
          <a
            href="https://flex-community.vercel.app/"
            className="inline-block px-8 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition duration-300 shadow-md hover:shadow-lg"
          >
            Join the Community
          </a>
        </div>
      </div>
    </section>
  );
};

export default CommunityForum;
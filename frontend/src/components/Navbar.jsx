import React, { useState, useEffect } from 'react';
import { Menu, X, Users, ChevronDown, Settings, LogOut } from 'lucide-react';
import { useAuth } from './AuthContext';
import { logout } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';

const navigationItems = [
  { name: 'Home', href: '/', current: true },
  { name: 'Jobs', href: '/job-page', current: false },
  { name: 'Internships', href: '/internship-page', current: false },
  { name: 'Freelance', href: '/gigs', current: false },
  { name: 'Assessments', href: '/assessment/question-bank', current: false },
  { name: 'Community', href: 'https://flex-community.vercel.app/', current: false, icon: Users }
];

const PhotoAvatar = ({ user, size = 'h-8 w-8' }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      setError(false);

      if (!user?.photoURL) {
        setError(true);
        setIsLoading(false);
        return;
      }

      try {
        // Create a new image object to test loading
        const img = new Image();
        img.src = user.photoURL;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        setImgSrc(user.photoURL);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading profile image:', err);
        setError(true);
        setIsLoading(false);
      }
    };

    loadImage();
  }, [user?.photoURL]);

  if (isLoading) {
    return (
      <div className={`${size} rounded-full bg-gray-200 animate-pulse`} />
    );
  }

  if (error || !imgSrc) {
    // Fallback to initials or default avatar
    return (
      <div className={`${size} rounded-full bg-indigo-100 flex items-center justify-center`}>
        <span className="text-indigo-600 font-medium text-sm">
          {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
        </span>
      </div>
    );
  }
  return (
    <img
      src={imgSrc}
      alt={user?.displayName || 'User'}
      className={`${size} rounded-full object-cover`}
      onError={() => setError(true)}
    />
  );
};
const ProfileDropdown = ({ userRole, currentUser, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    // Prevent body scroll when dropdown is open on mobile
    if (isMobile) {
      if (isDropdownOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDropdownOpen, isMobile]);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('lastUserEmail');
      onLogout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const recruiterLinks = [
    { name: 'Profile', href: '/profile' },
    { name: 'Post a Job', href: '/postjob' },
    { name: 'View Applications', href: '/applications' },
    { name: 'Resume Builder', href: '/resume-builder' },
    { name: 'View Internship Applications', href: '/internship-applications' },
    { name: 'Post Internship', href: '/post-internship' },
    { name: 'Become a Freelancer', href: '/seller-info' },
    { name: 'Orders', href: '/orders' },
    { name: 'Question Bank', href: '/assessment/question-bank' },
    { name: 'Create Assessment', href: '/assessment/create' },
    { name: 'My Assessments', href: '/assessments' },
    { name: 'Assign Assessments', href: '/assessment/assign' }
  ];

  const candidateLinks = [
    { name: 'Profile', href: '/profile' },
    { name: 'My Applications', href: '/applicants/:id' },
    { name: 'Saved Jobs', href: '/saved-jobs' },
    { name: 'Saved Internships', href: '/saved-internships' },
    { name: 'Create New Gig', href: '/create-gig' },
    { name: 'Resume Builder', href: '/resume-builder' },
    { name: 'My Internship Applications', href: '/internship-tracking' },
    { name: 'Become a Freelancer', href: '/seller-info' },
    { name: 'Orders', href: '/orders' },
    { name: 'My Assessments', href: '/assessments' }
  ];

  const roleSpecificItems = () => {
    const commonClasses = "block w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200";

    if (userRole === 'jobseeker') {
      return (
        <>
          {candidateLinks.map((link) => (
            <Link to={link.href} key={link.name} className={commonClasses}>
              {link.icon && <link.icon className="inline-block w-4 h-4 mr-2" />}
              {link.name}
            </Link>
          ))}
        </>
      );
    } else if (userRole === 'recruiter') {
      return (
        <>
          {recruiterLinks.map((link) => (
            <Link to={link.href} key={link.name} className={commonClasses}>
              {link.icon && <link.icon className="inline-block w-4 h-4 mr-2" />}
              {link.name}
            </Link>
          ))}
        </>
      );
    }
    return null;
  };

  return (
    <div className="relative profile-dropdown">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="flex items-center space-x-2">
          <PhotoAvatar user={currentUser} />
          <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
            {currentUser?.displayName || 'User'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 
          ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isDropdownOpen && (
        <>
          {/* Mobile Overlay */}
          {isMobile && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsDropdownOpen(false)} />
          )}

          {/* Dropdown Content */}
          <div className={`
            ${isMobile
              ? 'fixed left-0 right-0 bottom-0 z-50 rounded-t-xl'
              : 'absolute right-0 w-56 rounded-md mt-2'
            }
            bg-white shadow-lg
          `}>
            {/* Mobile Header */}
            {isMobile && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Scrollable Content */}
            <div className={`
              overflow-y-auto
              ${isMobile ? 'max-h-[70vh]' : 'max-h-[calc(100vh-100px)]'}
              overscroll-contain
            `}>
              {roleSpecificItems()}
              <Link to="/edit-profile" className="block w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200">
                <Settings className="inline-block w-4 h-4 mr-2" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 text-left transition-colors duration-200"
              >
                <LogOut className="inline-block w-4 h-4 mr-2" />
                Log Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Navbar = ({ onSignInClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateUserRole = () => {
      if (currentUser?.email) {
        const savedRole = localStorage.getItem(`role_${currentUser.email}`);
        if (savedRole) {
          setUserRole(savedRole);
          localStorage.setItem('lastUserEmail', currentUser.email);
        }
      } else {
        const lastUserEmail = localStorage.getItem('lastUserEmail');
        if (lastUserEmail) {
          const savedRole = localStorage.getItem(`role_${lastUserEmail}`);
          if (savedRole) {
            setUserRole(savedRole);
          }
        }
      }
    };

    updateUserRole();
  }, [currentUser]);

  const handleLogout = () => {
    setUserRole(null);
    setIsOpen(false);
  };

  return (
    <>
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="block h-8 w-auto">
                  <img
                    // className="block"
                    // src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
                    // alt="Flexhunt"
                      ></img>
                    < span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      FlexHunt
                  </span>
                </Link>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {navigationItems.map((item) => (
                  item.href.startsWith('http') ? (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                        border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700
                        transition-colors duration-200"
                    >
                      {item.icon && <item.icon className="w-4 h-4 mr-1" />}
                      {item.name}
                    </a>
                  ) : (
                    <button
                      key={item.name}
                      onClick={() => navigate(item.href)}
                      className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                        border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700
                        transition-colors duration-200"
                    >
                      {item.icon && <item.icon className="w-4 h-4 mr-1" />}
                      {item.name}
                    </button>
                  )
                ))}
              </div>
            </div>

            <div className="hidden md:ml-6 md:flex md:items-center">
              {!currentUser ? (
                <button
                  onClick={onSignInClick}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium 
                    rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                >
                  Sign In
                </button>
              ) : (
                <ProfileDropdown
                  userRole={userRole}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              )}
            </div>

            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 
                  hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 
                  focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className={`md:hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg">
            {navigationItems.map((item) => (
              item.href.startsWith('http') ? (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 
                    hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    {item.icon && <item.icon className="w-4 h-4 mr-2" />}
                    {item.name}
                  </div>
                </a>
              ) : (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className="block w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 
                    hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    {item.icon && <item.icon className="w-4 h-4 mr-2" />}
                    {item.name}
                  </div>
                </button>
              )
            ))}
            {!currentUser ? (
              <button
                onClick={onSignInClick}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium 
                  text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
              >
                Sign In
              </button>
            ) : (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <ProfileDropdown
                  userRole={userRole}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              </div>
            )}
          </div>
        </div>
      </nav>
      <div className="h-16"></div>
    </>
  );
};

export default Navbar;
import React, { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import AuthProvider from './components/AuthContext';
import ResumeBuilder from './pages/ResumeBuilder';
import JobPage from './pages/Jobpage';
import EditProfile from './pages/EditProfile';
import Profile from './pages/Profile';
import SignInPopup from './components/SignInPopup';
import PostJobPage from './pages/PostJob';
import SavedJobsPage from './pages/SavedJobsPage';
import ApplicationPage from './pages/ApplicationPage';
import ApplicantPage from './pages/ApplicantPage';
import InternshipForm from './pages/InternshipForm';
import InternshipPage from './pages/InternshipPage';
import InternshipApplicationPage from './pages/InternshipApplicantionPage';
import InternshipTrackingPage from './pages/InternshipTrackingPage';
import SavedInternshipsPage from './pages/SavedInternshipCard';
import { GigList } from './components/Giglist';
import CreateGig from './pages/CreateGig';
import GigDetails from './pages/GigDetails';
import Orders from './pages/Orders';
import SellerOrders from './pages/SellerOrders';
import SellerRegistration from './pages/SellerRegistration';
import { AboutUs, ContactUs } from './pages/about';
import QuestionBank from './components/assessment/QuestionBank';
import CreateAssessment from './components/assessment/CreateAssessment';
import TakeAssessment from './components/assessment/TakeAssessment';
import AssessmentList from './components/assessment/AssessmentList';
import AssignAssessment from './components/assessment/AssignAssessment';

const App = () => {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);

  const openSignInPopup = () => setIsSignInOpen(true);
  const closeSignInPopup = () => setIsSignInOpen(false);

  return (
    <>
      <div className="App">
        <AuthProvider>
          {!isFullScreen && <Navbar onSignInClick={openSignInPopup} />}
          {/* Sign-In Popup */}
          {isSignInOpen && (
            <SignInPopup
              closeModal={closeSignInPopup}
              setRole={(role) => {
                setUserRole(role);
                console.log('User role set:', role);
              }}
            />
          )}
          {/* Define Routes for navigation */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/job-page" element={<JobPage />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/postjob" element={<PostJobPage />} />
            <Route path="/saved-jobs" element={<SavedJobsPage />} />
            <Route path="/applications" element={<ApplicationPage />} />
            <Route path="/applicants/:id" element={<ApplicantPage />} />
            <Route path="/post-internship" element={<InternshipForm />} />
            <Route path="/internship-page" element={<InternshipPage />} />
            <Route path="/internship-applications" element={<InternshipApplicationPage />} />
            <Route path="/internship-tracking" element={<InternshipTrackingPage />} />
            <Route path="/saved-internships" element={<SavedInternshipsPage />} />
            <Route path="/gigs" element={<GigList />} />
            <Route path="/create-gig" element={<CreateGig />} />
            <Route path="/gig/:id" element={<GigDetails />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/seller-orders" element={<SellerOrders />} />
            <Route path='/seller-info' element={<SellerRegistration />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact-us" element={<ContactUs />} />
            {/* Assessment Routes */}
            <Route path="/assessment/question-bank" element={<QuestionBank />} />
            <Route path="/assessment/create" element={<CreateAssessment />} />
            <Route path="/assessment/take/:assessmentId" element={<TakeAssessment />} />
            <Route path="/assessments" element={<AssessmentList />} />
            <Route path="/assessment/assign" element={<AssignAssessment />} />
          </Routes>
        </AuthProvider>
      </div>
      {!isFullScreen && <Footer />}
    </>
  );
};

export default App;

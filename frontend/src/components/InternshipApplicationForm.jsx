import React, { useState, useEffect } from 'react';
import { X, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from './AuthContext';

export default function InternshipApplicationForm({ internshipId, isOpen, setIsOpen }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    university: '',
    major: '',
    graduationYear: '',
    gpa: '',
    relevantCoursework: '',
    projects: '',
    availability: '',
    resume: null,
    coverLetter: ''
  });

  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [hasApplied, setHasApplied] = useState(false);
  const [internshipDetails, setInternshipDetails] = useState({});

  // Fetch internship details
  useEffect(() => {
    const fetchInternshipDetails = async () => {
      try {
        const internshipDoc = await getDoc(doc(db, 'internshipapplication', internshipId));
        if (internshipDoc.exists()) {
          setInternshipDetails(internshipDoc.data());
        }
      } catch (error) {
        console.error('Error fetching internship details:', error);
      }
    };

    if (internshipId) fetchInternshipDetails();
  }, [internshipId]);

  // Check for existing application
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (currentUser?.uid && internshipId) {
        const q = query(
          collection(db, 'internshipApplications'),
          where('userId', '==', currentUser.uid),
          where('internshipId', '==', internshipId)
        );

        try {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setHasApplied(true);
            setSubmitStatus({
              type: 'error',
              message: 'You have already applied for this internship.'
            });
          }
        } catch (error) {
          console.error('Error checking existing application:', error);
        }
      }
    };

    checkExistingApplication();
  }, [currentUser?.uid, internshipId]);

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (currentUser?.email) {
      setFormData(prev => ({
        ...prev,
        email: currentUser.email
      }));
    }
  }, [currentUser]);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    const gpaRegex = /^[0-4](\.\d{1,2})?$/;
    const yearRegex = /^20\d{2}$/;

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!emailRegex.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!phoneRegex.test(formData.phone)) newErrors.phone = 'Valid phone number is required';
    if (!formData.university.trim()) newErrors.university = 'University name is required';
    if (!formData.major.trim()) newErrors.major = 'Major is required';
    if (!yearRegex.test(formData.graduationYear)) newErrors.graduationYear = 'Valid graduation year is required';
    if (!gpaRegex.test(formData.gpa)) newErrors.gpa = 'Valid GPA is required (0-4.0)';
    if (!formData.relevantCoursework.trim()) newErrors.relevantCoursework = 'Relevant coursework is required';
    if (!formData.availability.trim()) newErrors.availability = 'Availability information is required';
    if (!formData.resume) newErrors.resume = 'Resume is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, resume: 'File size should be less than 5MB' }));
        return;
      }
      setFormData(prev => ({ ...prev, resume: file }));
      setErrors(prev => ({ ...prev, resume: '' }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, resume: 'File size should be less than 5MB' }));
        return;
      }
      setFormData(prev => ({ ...prev, resume: file }));
      setErrors(prev => ({ ...prev, resume: '' }));
    }
  };

  const uploadResume = async (file) => {
    const resumeRef = ref(storage, `internship-resumes/${currentUser.uid}/${file.name}-${Date.now()}`);
    await uploadBytes(resumeRef, file);
    return getDownloadURL(resumeRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setSubmitStatus({ type: 'error', message: 'Please sign in to submit your application' });
      return;
    }

    if (hasApplied) {
      setSubmitStatus({ type: 'error', message: 'You have already applied for this internship' });
      return;
    }

    if (!validateForm()) {
      setSubmitStatus({ type: 'error', message: 'Please fix the errors before submitting' });
      return;
    }

    setUploading(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      let resumeURL = null;

      if (formData.resume) {
        resumeURL = await uploadResume(formData.resume);
      }

      await addDoc(collection(db, 'internshipApplications'), {
        userId: currentUser.uid,
        candidateId: currentUser.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        university: formData.university,
        major: formData.major,
        graduationYear: formData.graduationYear,
        gpa: formData.gpa,
        relevantCoursework: formData.relevantCoursework,
        projects: formData.projects,
        availability: formData.availability,
        resumeURL,
        coverLetter: formData.coverLetter,
        internshipId,
        ...internshipDetails,
        status: 'pending',
        submittedAt: new Date(),
      });

      setSubmitStatus({ type: 'success', message: 'Application submitted successfully!' });
      setHasApplied(true);
      setTimeout(() => setIsOpen(false), 2000);
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitStatus({ type: 'error', message: 'Failed to submit application. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  if (!currentUser) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              Please sign in to submit your internship application.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col bg-white">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-xl font-semibold">Internship Application</DialogTitle>
          <DialogDescription className="text-gray-500">
            Fill in your details to apply for this internship position
          </DialogDescription>
          <Button
            variant="ghost"
            className="absolute right-4 top-4 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            
          </Button>
        </DialogHeader>

        <ScrollArea className="flex-grow px-6">
          <form onSubmit={handleSubmit} className="space-y-6 py-6">
            {submitStatus.message && (
              <Alert variant={submitStatus.type === 'error' ? 'destructive' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitStatus.message}</AlertDescription>
              </Alert>
            )}

            {hasApplied ? (
              <div className="text-center p-6">
                <h3 className="text-lg font-medium text-gray-900">Application Submitted</h3>
                <p className="mt-2 text-sm text-gray-500">
                  You have already applied for this internship position. You can check the status of your application in your dashboard.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`mt-1 ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name}</span>}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`mt-1 ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="Enter your email address"
                    />
                    {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email}</span>}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">Phone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`mt-1 ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && <span className="text-red-500 text-xs mt-1">{errors.phone}</span>}
                  </div>

                  <div>
                    <Label htmlFor="university" className="text-sm font-medium">University *</Label>
                    <Input
                      id="university"
                      name="university"
                      value={formData.university}
                      onChange={handleInputChange}
                      className={`mt-1 ${errors.university ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="Enter your university name"
                    />
                    {errors.university && <span className="text-red-500 text-xs mt-1">{errors.university}</span>}
                  </div>

                  <div>
                    <Label htmlFor="major" className="text-sm font-medium">Major *</Label>
                    <Input
                      id="major"
                      name="major"
                      value={formData.major}
                      onChange={handleInputChange}
                      className={`mt-1 ${errors.major ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="Enter your major"
                    />
                    {errors.major && <span className="text-red-500 text-xs mt-1">{errors.major}</span>}
                  </div>

                  <div>
                    <Label htmlFor="graduationYear" className="text-sm font-medium">Expected Graduation Year *</Label>
                    <Input
                      id="graduationYear"
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleInputChange}
                      className={`mt-1 ${errors.graduationYear ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="YYYY"
                    />
                    {errors.graduationYear && <span className="text-red-500 text-xs mt-1">{errors.graduationYear}</span>}
                  </div>

                  <div>
                    <Label htmlFor="gpa" className="text-sm font-medium">GPA *</Label>
                    <Input
                      id="gpa"
                      name="gpa"
                      value={formData.gpa}
                      onChange={handleInputChange}
                      className={`mt-1 ${errors.gpa ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="Enter your GPA (e.g., 3.5)"
                    />
                    {errors.gpa && <span className="text-red-500 text-xs mt-1">{errors.gpa}</span>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="relevantCoursework" className="text-sm font-medium">Relevant Coursework *</Label>
                  <Textarea
                    id="relevantCoursework"
                    name="relevantCoursework"
                    value={formData.relevantCoursework}
                    onChange={handleInputChange}
                    className={`mt-1 h-24 ${errors.relevantCoursework ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="List relevant courses you've taken"
                  />
                  {errors.relevantCoursework && <span className="text-red-500 text-xs mt-1">{errors.relevantCoursework}</span>}
                </div>

                <div>
                  <Label htmlFor="projects" className="text-sm font-medium">Projects</Label>
                  <Textarea
                    id="projects"
                    name="projects"
                    value={formData.projects}
                    onChange={handleInputChange}
                    className="mt-1 h-32"
                    placeholder="Describe any relevant projects you've worked on"
                  />
                </div>

                <div>
                  <Label htmlFor="availability" className="text-sm font-medium">Availability *</Label>
                  <Textarea
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleInputChange}
                    className={`mt-1 h-24 ${errors.availability ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="Specify your availability (start date, duration, hours per week)"
                  />
                  {errors.availability && <span className="text-red-500 text-xs mt-1">{errors.availability}</span>}
                </div>

                <div>
                  <Label htmlFor="coverLetter" className="text-sm font-medium">Cover Letter</Label>
                  <Textarea
                    id="coverLetter"
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleInputChange}
                    className="mt-1 h-48"
                    placeholder="Write a brief cover letter explaining why you're interested in this internship"
                  />
                </div>

                <div>
                  <Label htmlFor="resume" className="text-sm font-medium">Resume *</Label>
                  <div
                    className={`mt-1 border-2 border-dashed p-6 text-center rounded-lg transition-colors duration-200
                    ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
                    ${errors.resume ? 'border-red-500' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Input
                      id="resume"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                    />
                    <label htmlFor="resume" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Upload className="h-12 w-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          {formData.resume ? formData.resume.name : 'Drag and drop your resume or click to browse'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          Supported formats: PDF, DOC, DOCX (Max 5MB)
                        </span>
                      </div>
                    </label>
                  </div>
                  {errors.resume && <span className="text-red-500 text-xs mt-1">{errors.resume}</span>}
                </div>

                <Button
                  type="submit"
                  disabled={uploading || hasApplied}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {uploading ? (
                    <span className="flex items-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </>
            )}
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
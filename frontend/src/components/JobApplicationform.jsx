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

export default function JobApplicationForm({ jobId, isOpen, setIsOpen }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    education: '',
    skills: '',
    coverLetter: '',
    resume: null,
  });

  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [hasApplied, setHasApplied] = useState(false);
  const [jobDetails, setJobDetails] = useState({}); // State to store job details

  // Fetch job details from Firestore
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const jobDoc = await getDoc(doc(db, 'jobs', jobId));
        if (jobDoc.exists()) {
          setJobDetails(jobDoc.data());
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
      }
    };

    if (jobId) fetchJobDetails();
  }, [jobId]);

  // Check if user has already applied for this job
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (currentUser?.uid && jobId) {
        const q = query(
          collection(db, 'applications'),
          where('userId', '==', currentUser.uid),
          where('jobId', '==', jobId)
        );

        try {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setHasApplied(true);
            setSubmitStatus({
              type: 'error',
              message: 'You have already applied for this position.'
            });
          }
        } catch (error) {
          console.error('Error checking existing application:', error);
        }
      }
    };

    checkExistingApplication();
  }, [currentUser?.uid, jobId]);

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

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!emailRegex.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!phoneRegex.test(formData.phone)) newErrors.phone = 'Valid phone number is required';
    if (!formData.experience.trim()) newErrors.experience = 'Experience is required';
    if (!formData.education.trim()) newErrors.education = 'Education is required';
    if (!formData.skills.trim()) newErrors.skills = 'Skills are required';
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
    const resumeRef = ref(storage, `resumes/${currentUser.uid}/${file.name}-${Date.now()}`);
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
      setSubmitStatus({ type: 'error', message: 'You have already applied for this position' });
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

      await addDoc(collection(db, 'applications'), {
        userId: currentUser.uid,
        candidateId: currentUser.uid,  
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        experience: formData.experience,
        education: formData.education,
        skills: formData.skills,
        resumeURL,
        jobId,
        ...jobDetails, 
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
  // Authentication check message
  if (!currentUser) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              Please sign in to submit your job application.
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
          <DialogTitle className="text-xl font-semibold">Job Application</DialogTitle>
          <DialogDescription className="text-gray-500">
            Fill in your details to apply for this position
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
                  You have already applied for this position. You can check the status of your application in your dashboard.
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
                    <Label htmlFor="education" className="text-sm font-medium">Education *</Label>
                    <Input
                      id="education"
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      className={`mt-1 ${errors.education ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="Highest degree, Institution"
                    />
                    {errors.education && <span className="text-red-500 text-xs mt-1">{errors.education}</span>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="experience" className="text-sm font-medium">Experience *</Label>
                  <Textarea
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className={`mt-1 h-32 ${errors.experience ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="Describe your relevant work experience if any or wirte 'None'"
                  />
                  {errors.experience && <span className="text-red-500 text-xs mt-1">{errors.experience}</span>}
                </div>

                <div>
                  <Label htmlFor="skills" className="text-sm font-medium">Skills *</Label>
                  <Input
                    id="skills"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    className={`mt-1 ${errors.skills ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="Relevant skills, separated by commas"
                  />
                  {errors.skills && <span className="text-red-500 text-xs mt-1">{errors.skills}</span>}
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
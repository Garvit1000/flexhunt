import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const InternshipForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    companyDescription: "",
    companyWebsite: "",
    position: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
    requirements: "",
    applicationProcess: "",
    deadline: "",
    compensation: "",
    contactName: "",
    contactEmail: "",
    contactPhone: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare the data object with formatted dates
      const internshipData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        deadline: new Date(formData.deadline).toISOString(),
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add the document to Firestore
      const docRef = await addDoc(collection(db, 'internshipapplication'), internshipData);
      
      setNotificationMessage("Internship posted successfully!");
      setShowNotification(true);
      
      // Reset form
      setFormData({
        companyName: "",
        industry: "",
        companyDescription: "",
        companyWebsite: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
        requirements: "",
        applicationProcess: "",
        deadline: "",
        compensation: "",
        contactName: "",
        contactEmail: "",
        contactPhone: ""
      });
      setActiveStep(0);
    } catch (error) {
      console.error('Error posting internship:', error);
      setNotificationMessage("Error posting internship. Please try again.");
      setShowNotification(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Company Details', 'Internship Details', 'Requirements & Process', 'Contact Information'];

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Enter company name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g. Technology, Finance"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyWebsite">Company Website</Label>
              <Input
                id="companyWebsite"
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleChange}
                placeholder="www.company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyDescription">Company Description</Label>
              <Textarea
                id="companyDescription"
                name="companyDescription"
                value={formData.companyDescription}
                onChange={handleChange}
                placeholder="Brief description of your company"
                required
              />
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position Title</Label>
              <Input
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="e.g. Software Engineering Intern"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, State or Remote"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Internship Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed description of the internship role and responsibilities"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requirements">Qualifications and Skills</Label>
              <Textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="List required qualifications and skills"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applicationProcess">How to Apply</Label>
              <Textarea
                id="applicationProcess"
                name="applicationProcess"
                value={formData.applicationProcess}
                onChange={handleChange}
                placeholder="Describe the application process"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Application Deadline</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compensation">Compensation</Label>
                <Select 
                  value={formData.compensation} 
                  onValueChange={(value) => handleSelectChange("compensation", value)}
                >
                  <SelectTrigger id="compensation">
                    <SelectValue placeholder="Select compensation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="Email address"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone (optional)</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </div>
          </div>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Post an Internship</CardTitle>
          <CardDescription className="text-center">Fill out the form below to post a new internship opportunity</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stepper */}
          <div className="mb-8">
            <div className="flex justify-between">
              {steps.map((label, index) => (
                <div key={label} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= activeStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-sm mt-2">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {getStepContent(activeStep)}
            
            <div className="flex justify-end gap-4 mt-6">
              {activeStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep((step) => step - 1)}
                  disabled={isSubmitting}
                  className="mr-4"
                >
                  Back
                </Button>
              )}
              <Button
                type={activeStep === steps.length - 1 ? 'submit' : 'button'}
                onClick={activeStep === steps.length - 1 ? undefined : () => setActiveStep((step) => step + 1)}
                disabled={isSubmitting}
                 className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isSubmitting ? 'Submitting...' : activeStep === steps.length - 1 ? 'Post Internship' : 'Next'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notification */}
      {showNotification && (
        <div className="fixed bottom-4 left-4">
          <Alert className="w-96">
            <div className="flex justify-between items-center">
              <span>{notificationMessage}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotification(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default InternshipForm;
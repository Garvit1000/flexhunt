import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel, 
  Paper, 
  Container, 
  Snackbar, 
  IconButton, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl 
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const PostJobPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [jobData, setJobData] = useState({
    companyName: '',
    jobDescription: '',
    role: '',
    education: '',
    skills: '',
    experience: '',
    location: '',
    salary: '',
    companyDescription: '',
    companyWebsite: '',
    deadline: '',
    jobType: '', 
    industry: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJobData({ ...jobData, [name]: value });
  };

  const handleSelectChange = (e) => {
    setJobData({ ...jobData, jobType: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'jobs'), jobData);
      setSnackbar({ open: true, message: 'Job posted successfully!' });
      setJobData({
        companyName: '',
        jobDescription: '',
        role: '',
        education: '',
        skills: '',
        experience: '',
        location: '',
        salary: '',
        companyDescription: '',
        companyWebsite: '',
        deadline: '',
        jobType: '',
        industry: '',
      });
      setActiveStep(0);
    } catch (error) {
      console.error('Error posting job:', error);
      setSnackbar({ open: true, message: 'Error posting job. Please try again.' });
    }
  };

  const steps = ['Company Details', 'Job Details', 'Additional Information'];

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              label="Company Name"
              name="companyName"
              value={jobData.companyName}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Company Website"
              name="companyWebsite"
              value={jobData.companyWebsite}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Company Description"
              name="companyDescription"
              value={jobData.companyDescription}
              onChange={handleChange}
              multiline
              rows={4}
              required
              fullWidth
              margin="normal"
            />
          </>
        );
      case 1:
        return (
          <>
            <TextField
              label="Role"
              name="role"
              value={jobData.role}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Required Education"
              name="education"
              value={jobData.education}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Skills (comma separated)"
              name="skills"
              value={jobData.skills}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Job Description"
              name="jobDescription"
              value={jobData.jobDescription}
              onChange={handleChange}
              multiline
              rows={4}
              required
              fullWidth
              margin="normal"
            />
          </>
        );
      case 2:
        return (
          <>
           <TextField
              label="Industry"
              name="industry"
              value={jobData.industry}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Experience (e.g., 2-5 years)"
              name="experience"
              value={jobData.experience}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Location"
              name="location"
              value={jobData.location}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Salary/Stipend"
              name="salary"
              value={jobData.salary}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Application Deadline"
              name="deadline"
              type="date"
              value={jobData.deadline}
              onChange={handleChange}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              margin="normal"
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="job-type-label">Job Type</InputLabel>
              <Select
                labelId="job-type-label"
                value={jobData.jobType}
                onChange={handleSelectChange}
                name="jobType"
              >
                <MenuItem value="Full-Time">Full-Time</MenuItem>
                <MenuItem value="Part-Time">Part-Time</MenuItem>
              </Select>
            </FormControl>
          </>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Post a Job
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel style={{ marginBottom: '20px' }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <form onSubmit={handleSubmit}>
          {getStepContent(activeStep)}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            {activeStep > 0 && (
              <Button onClick={() => setActiveStep((step) => step - 1)} sx={{ mr: 1 }}>
                Back
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              type={activeStep === steps.length - 1 ? 'submit' : 'button'}
              onClick={activeStep === steps.length - 1 ? undefined : () => setActiveStep((step) => step + 1)}
            >
              {activeStep === steps.length - 1 ? 'Post Job' : 'Next'}
            </Button>
          </Box>
        </form>
      </Paper>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        action={
          <IconButton size="small" color="inherit" onClick={() => setSnackbar({ ...snackbar, open: false })}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Container>
  );
};

export default PostJobPage;

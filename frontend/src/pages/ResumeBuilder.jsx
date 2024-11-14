import React, { useState, useRef } from 'react';
import { FileText, User, Briefcase, GraduationCap, Award, Plus, Trash2, Code, Palette,Download, Github, Linkedin } from 'lucide-react';

const ResumeBuilder = () => {
  const [personalInfo, setPersonalInfo] = useState({ name: '', email: '', phone: '', title: '', linkedin: '', });
  const [experience, setExperience] = useState([{ company: '', position: '', startDate: '', endDate: '', description: '' }]);
  const [education, setEducation] = useState([{ school: '', degree: '', graduationDate: '' }]);
  const [skills, setSkills] = useState(['']);
  const [certificates, setCertifications] = useState(['']);
  const [projects, setProjects] = useState([{ name: '', description: '', technologies: '' }]);
  const [accentColor, setAccentColor] = useState('#3B82F6');
  const resumeRef = useRef();
  const downloadAsPDF = () => {
    const element = resumeRef.current;
    const opt = {
      margin: [10, 10, 10, 10], // [top, right, bottom, left]
      filename: `${personalInfo.name.toLowerCase().replace(/\s+/g, '_')}_resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        letterRendering: true,
        useCORS: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait'
      }
    };

    // Using window.html2pdf which should be imported via CDN
    if (window.html2pdf && element) {
      window.html2pdf().set(opt).from(element).save();
    }
  };

  const handlePersonalInfoChange = (e) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };

  const handleExperienceChange = (index, e) => {
    const updatedExperience = experience.map((exp, i) => {
      if (i === index) {
        return { ...exp, [e.target.name]: e.target.value };
      }
      return exp;
    });
    setExperience(updatedExperience);
  };

  const handleEducationChange = (index, e) => {
    const updatedEducation = education.map((edu, i) => {
      if (i === index) {
        return { ...edu, [e.target.name]: e.target.value };
      }
      return edu;
    });
    setEducation(updatedEducation);
  };

  const handleSkillChange = (index, e) => {
    const updatedSkills = skills.map((skill, i) => {
      if (i === index) {
        return e.target.value;
      }
      return skill;
    });
    setSkills(updatedSkills);
  };
  const handleCertificateChange = (index, e) => {
    const updatedCertificates = certificates.map((certificates, i) => {
      if (i === index) {
        return e.target.value;
      }
      return certificates;
    });
    setCertifications(updatedCertificates);
  };

  const handleProjectChange = (index, e) => {
    const updatedProjects = projects.map((project, i) => {
      if (i === index) {
        return { ...project, [e.target.name]: e.target.value };
      }
      return project;
    });
    setProjects(updatedProjects);
  };

  const addExperience = () => {
    setExperience([...experience, { company: '', position: '', startDate: '', endDate: '', description: '' }]);
  };

  const addEducation = () => {
    setEducation([...education, { school: '', degree: '', graduationDate: '' }]);
  };

  const addSkill = () => {
    setSkills([...skills, '']);
  };
  const addcertificate= () => {
    setCertifications([...certificates, '']);
  };
  const addProject = () => {
    setProjects([...projects, { name: '', description: '', technologies: '' }]);
  };

  const removeExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const removeEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };
  const removeCertificate = (index) => {
    setCertifications(certificates.filter((_, i) => i !== index));
  };

  const removeProject = (index) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6" style={{ backgroundColor: accentColor }}>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <FileText className="mr-2" /> Professional Resume Builder
          </h1>  
          <button
              onClick={downloadAsPDF}
              className="px-4 py-2 bg-white text-gray-800 rounded-md flex items-center hover:bg-gray-100 transition-colors"
            >
              <Download className="mr-2" size={20} />
              Download PDF
            </button>
        </div>
       
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 p-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
            <form className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4">
                  <User className="mr-2" /> Personal Information
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={personalInfo.name}
                    onChange={handlePersonalInfoChange}
                    className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                  />
                  <input
                    type="text"
                    name="title"
                    placeholder="Professional Title"
                    value={personalInfo.title}
                    onChange={handlePersonalInfoChange}
                    className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={personalInfo.email}
                    onChange={handlePersonalInfoChange}
                    className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={personalInfo.phone}
                    onChange={handlePersonalInfoChange}
                    className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                  />
                  
                  <input
                    type="text"
                    name="linkedin"
                    placeholder="LinkedIn URL"
                    value={personalInfo.linkedin}
                    onChange={handlePersonalInfoChange}
                    className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                  />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4">
                  <Briefcase className="mr-2" /> Work Experience
                </h2>
                {experience.map((exp, index) => (
                  <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <input
                        type="text"
                        name="company"
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(index, e)}
                        className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                      />
                      <input
                        type="text"
                        name="position"
                        placeholder="Position"
                        value={exp.position}
                        onChange={(e) => handleExperienceChange(index, e)}
                        className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                      />
                      <input
                        type="date"
                        name="startDate"
                        placeholder="Start Date"
                        value={exp.startDate}
                        onChange={(e) => handleExperienceChange(index, e)}
                        className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                      />
                      <input
                        type="date"
                        name="endDate"
                        placeholder="End Date"
                        value={exp.endDate}
                        onChange={(e) => handleExperienceChange(index, e)}
                        className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                      />
                    </div>
                    <textarea
                      name="description"
                      placeholder="Job Description"
                      value={exp.description}
                      onChange={(e) => handleExperienceChange(index, e)}
                      className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                      rows="3"
                    ></textarea>
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="mt-2 px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Trash2 className="inline-block mr-1" size={16} /> Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addExperience}
                  className="mt-2 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: accentColor }}
                >
                  <Plus className="inline-block mr-1" size={16} /> Add Experience
                </button>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4">
                  <GraduationCap className="mr-2" /> Education
                </h2>
                {education.map((edu, index) => (
                  <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <input
                        type="text"
                        name="school"
                        placeholder="School/University"
                        value={edu.school}
                        onChange={(e) => handleEducationChange(index, e)}
                        className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                      />
                      <input
                        type="text"
                        name="degree"
                        placeholder="Degree"
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(index, e)}
                        className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                      />
                      <input
                        type="date"
                        name="graduationDate"
                        placeholder="Graduation Date"
                        value={edu.graduationDate}
                        onChange={(e) => handleEducationChange(index, e)}
                        className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className="mt-2 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Trash2 className="inline-block mr-1" size={16} /> Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEducation}
                  className="mt-2 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: accentColor }}
                >
                  <Plus className="inline-block mr-1" size={16} /> Add Education
                </button>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4">
                  <Code className="mr-2" /> Projects
                </h2>
                {projects.map((project, index) => (
                  <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 gap-6">
                      <input
                        type="text"
                        name="name"
                        placeholder="Project Name"
                        value={project.name}
                        onChange={(e) => handleProjectChange(index, e)}
                        className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                      />
                      <textarea
                        name="description"
                        placeholder="Project Description"
                        value={project.description}
                        onChange={(e) => handleProjectChange(index, e)}
                        className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                        rows="3"
                      ></textarea>
                      <input
                        type="text"
                        name="technologies"
                        placeholder="Technologies Used"
                        value={project.technologies}
                        onChange={(e) => handleProjectChange(index, e)}
                        className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProject(index)}
                      className="mt-2 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Trash2 className="inline-block mr-1" size={16} /> Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addProject}
                  className="mt-2 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: accentColor }}
                >
                  <Plus className="inline-block mr-1" size={16} /> Add Project
                </button>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4">
                  <Award className="mr-2" /> Skills
                </h2>
                {skills.map((skill, index) => (
                  <div key={index} className="mb-2 flex items-center">
                    <input
                      type="text"
                      placeholder="Skill"
                      value={skill}
                      onChange={(e) => handleSkillChange(index, e)}
                      className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                    />
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="ml-2 px-2 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSkill}
                  className="mt-2 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: accentColor }}
                >
                  <Plus className="inline-block mr-1" size={16} /> Add Skill
                </button>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4">
                  <Award className="mr-2" /> Certificates
                </h2>
                {certificates.map((Certificate, index) => (
                  <div key={index} className="mb-2 flex items-center">
                    <input
                      type="text"
                      placeholder="certificate"
                      value={Certificate}
                      onChange={(e) => handleCertificateChange(index, e)}
                      className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring focus:ring-opacity-40"
                    />
                    <button
                      type="button"
                      onClick={() => removeCertificate(index)}
                      className="ml-2 px-2 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addcertificate}
                  className="mt-2 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: accentColor }}
                >
                  <Plus className="inline-block mr-1" size={16} /> Add Certificate
                </button>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4">
                  <Palette className="mr-2" /> Customize
                </h2>
                <div className="flex items-center">
                  <label htmlFor="accentColor" className="mr-2">Accent Color:</label>
                  <input
                    type="color"
                    id="accentColor"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded-md cursor-pointer"
                  />
                </div>
              </section>
            </form>
          </div>
          <div className="w-full md:w-1/2 p-8 bg-gray-100 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
            <h2 className="text-2xl font-bold mb-4">Resume Preview</h2>
            <div ref={resumeRef} className="bg-white p-8 rounded-lg shadow-md max-w-[800px] mx-auto">
              {/* Header Section with reduced spacing */}
              <div className="border-b-2 pb-3" style={{ borderColor: accentColor }}>
                <h1 className="text-2xl font-bold" style={{ color: accentColor }}>
                  {personalInfo.name || 'Your Name'}
                </h1>
                <p className="text-lg mb-1 text-gray-700">{personalInfo.title || 'Professional Title'}</p>
                <div className="flex flex-wrap gap-3 text-gray-600 text-sm">
                  {personalInfo.email && (
                    <span className="flex items-center">
                      <User size={14} className="mr-1" /> {personalInfo.email}
                    </span>
                  )}
                  {personalInfo.phone && (
                    <span className="flex items-center">
                      <FileText size={14} className="mr-1" /> {personalInfo.phone}
                    </span>
                  )}
                  {personalInfo.linkedin && (
                    <span className="flex items-center">
                      <Linkedin size={14} className="mr-1" /> {personalInfo.linkedin}
                    </span>
                  )}
                </div>
              </div>

              {/* Experience Section */}
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2" style={{ color: accentColor }}>
                  Professional Experience
                </h2>
                {experience.map((exp, index) => (
                  <div key={index} className="mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">{exp.position}</h3>
                        <p className="text-gray-600 font-medium">{exp.company}</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {exp.startDate} - {exp.endDate || 'Present'}
                      </p>
                    </div>
                    <p className="mt-1 text-gray-700 text-sm text-justify">{exp.description}</p>
                  </div>
                ))}
              </div>

              {/* Education Section */}
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2" style={{ color: accentColor }}>
                  Education
                </h2>
                {education.map((edu, index) => (
                  <div key={index} className="mb-3">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{edu.school}</h3>
                        <p className="text-gray-600 text-sm">{edu.degree}</p>
                      </div>
                      <p className="text-sm text-gray-600">{edu.graduationDate}</p>
                    </div>
                  </div>
                ))}
              </div>

             

              {/* Projects Section */}
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2" style={{ color: accentColor }}>
                  Notable Projects
                </h2>
                {projects.map((project, index) => (
                  <div key={index} className="mb-3">
                    <h3 className="font-semibold text-gray-800">{project.name}</h3>
                    <p className="text-gray-700 mt-1 text-sm text-justify">{project.description}</p>
                    <p className="text-gray-600 mt-1 text-sm">
                      <span className="font-medium">Technologies:</span> {project.technologies}
                    </p>
                  </div>
                ))}
              </div>

              {/* Skills Section */}
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2" style={{ color: accentColor }}>
                  Technical Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded-full text-sm"
                      style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
               {/* Certifications Section */}
               <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2" style={{ color: accentColor }}>
                  Certifications
                </h2>
                <div className="flex flex-wrap gap-2">
                  {certificates.map((certificate, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      • {certificate}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
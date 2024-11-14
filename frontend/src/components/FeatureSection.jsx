import React from 'react';

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
      flex: '1',
      minWidth: '250px',
      margin: '10px',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>{description}</p>
    </div>
  );
};

const FeatureSection = () => {
  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px'
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        alignItems: 'stretch'
      }}>
        <FeatureCard
          icon="💼"
          title="Find Jobs"
          description="Discover exciting job opportunities tailored to your skills and experience."
        />
        <FeatureCard
          icon="🎓"
          title="Internships"
          description="Kickstart your career with valuable internships from top companies."
        />
        <FeatureCard
          icon="📄"
          title="Resume Builder"
          description="Create a standout resume that highlights your unique talents and achievements."
        />
      </div>
    </div>
  );
};

export default FeatureSection;
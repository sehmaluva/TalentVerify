import React, { useState, useRef } from 'react';
import './DataUpload.css';

const DataUpload = ({ onUpload, accept = '.csv,.xlsx', label = 'Upload File' }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(file);
      
      clearInterval(interval);
      setProgress(100);
      
      // Reset after successful upload
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to upload file');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="data-upload">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        style={{ display: 'none' }}
      />
      <button 
        className="upload-button"
        onClick={handleClick}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Uploading...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            {label}
          </>
        )}
      </button>
      
      {uploading && (
        <div className="upload-progress">
          <div 
            className="upload-progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {error && (
        <div className="upload-error">{error}</div>
      )}
    </div>
  );
};

export default DataUpload; 
import React from 'react';
import './Notification.css';

const Notification = ({ type, message, onClose }) => {
  if (!message) return null;

  return (
    <div className={`notification ${type}`}>
      <span className="message">{message}</span>
      <button className="close-btn" onClick={onClose}>×</button>
    </div>
  );
};

export default Notification; 
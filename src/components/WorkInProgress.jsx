import React from 'react';
import PropTypes from 'prop-types';
import { IconTool } from '@tabler/icons-react';
import './WorkInProgress.css';

const WorkInProgress = ({ title, description, icon }) => {
  // `icon` may be provided either as a React element (<Icon />)
  // or as a component (IconComponent). Support both forms.
  const renderIcon = () => {
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon || IconTool;
    return <IconComponent size={64} stroke={1.5} />;
  };

  return (
    <div className="wip-container">
      <div className="wip-content">
        <span className="wip-icon">{renderIcon()}</span>
        <h1 className="wip-title">{title}</h1>
        <p className="wip-description">
          {description || 'This feature is currently under development. Check back soon!'}
        </p>
        <div className="wip-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '35%' }}></div>
          </div>
          <p className="progress-text">Development in progress...</p>
        </div>
      </div>
    </div>
  );
};

WorkInProgress.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  // Accept either a React element (e.g. <Icon />) or a component (IconComponent / elementType)
  icon: PropTypes.oneOfType([PropTypes.element, PropTypes.elementType])
};

WorkInProgress.defaultProps = {
  title: 'Work In Progress',
  description: 'This feature is currently under development. Check back soon!',
  icon: null
};

export default WorkInProgress;

import { IconTool } from '@tabler/icons-react';
import './WorkInProgress.css';

const WorkInProgress = ({ title, description, icon }) => {
  const Icon = icon || IconTool;
  
  return (
    <div className="wip-container">
      <div className="wip-content">
        <span className="wip-icon">
          <Icon size={64} stroke={1.5} />
        </span>
        <h1 className="wip-title">{title}</h1>
        <p className="wip-description">
          {description || "This feature is currently under development. Check back soon!"}
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

export default WorkInProgress;

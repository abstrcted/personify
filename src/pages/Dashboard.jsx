import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;

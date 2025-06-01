import React, { useContext } from 'react';
import { AuthContext } from '../context/auth-context';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">User Profile</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Department:</strong> {user.department || 'N/A'}</p>
        <p><strong>Salary:</strong> {user.salary ? `$${user.salary}` : 'N/A'}</p>
        <p><strong>Avatar:</strong> {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-16 h-16 rounded-full" /> : 'No avatar'}</p>
      </div>
    </div>
  );
};

export default Dashboard;
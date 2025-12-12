import { Truck, Users, DollarSign, Activity } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="text-white w-6 h-6" />
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Vehicles" value="12" icon={Truck} color="bg-blue-500" />
        <StatCard title="Drivers on Duty" value="8" icon={Users} color="bg-green-500" />
        <StatCard title="Pending Settlements" value="Rp 4.5M" icon={DollarSign} color="bg-yellow-500" />
        <StatCard title="Fleet Health" value="92%" icon={Activity} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md h-64">
          <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
          <p className="text-gray-400">No recent activity logged.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md h-64">
          <h3 className="font-bold text-lg mb-4">Performance Metrics</h3>
          <p className="text-gray-400">Chart placeholder.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

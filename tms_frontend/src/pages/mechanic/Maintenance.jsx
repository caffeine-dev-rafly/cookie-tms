import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wrench, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const Maintenance = () => {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchVehicles = async () => {
        try {
          const res = await axios.get('http://localhost:8000/api/vehicles/');
          // Mocking status since API might not have it yet
          const dataWithStatus = res.data.map(v => ({
             ...v,
             status: Math.random() > 0.8 ? 'Broken' : (Math.random() > 0.6 ? 'Needs Service' : 'Good')
          }));
          setVehicles(dataWithStatus);
        } catch (error) {
          console.error("Error fetching vehicles:", error);
        }
    };
    fetchVehicles();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
        case 'Good':
            return <span className="flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm font-medium"><CheckCircle size={14} /> Good</span>;
        case 'Needs Service':
            return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full text-sm font-medium"><AlertTriangle size={14} /> Needs Service</span>;
        case 'Broken':
            return <span className="flex items-center gap-1 text-red-600 bg-red-100 px-3 py-1 rounded-full text-sm font-medium"><XCircle size={14} /> Broken</span>;
        default:
            return <span className="text-gray-500">Unknown</span>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Wrench /> Fleet Maintenance</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add Service Log</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Service</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{vehicle.license_plate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{vehicle.vehicle_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(vehicle.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">2 weeks ago</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href="#" className="text-indigo-600 hover:text-indigo-900">Edit</a>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Maintenance;

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Map, Plus, Trash2, Edit, Save, X, ArrowRight } from 'lucide-react';

const RouteList = () => {
  const [routes, setRoutes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState({ 
    origin: '', 
    destination: '', 
    standard_distance_km: 0, 
    standard_fuel_liters: 0 
  });

  // Fetch Routes
  const fetchRoutes = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/routes/');
      setRoutes(res.data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentRoute.id) {
        await axios.put(`http://localhost:8000/api/routes/${currentRoute.id}/`, currentRoute);
      } else {
        await axios.post('http://localhost:8000/api/routes/', { ...currentRoute, organization: 1 });
      }
      setIsEditing(false);
      setCurrentRoute({ origin: '', destination: '', standard_distance_km: 0, standard_fuel_liters: 0 });
      fetchRoutes();
    } catch (error) {
      console.error("Error saving route:", error);
      alert("Failed to save route.");
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this route?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/routes/${id}/`);
      fetchRoutes();
    } catch (error) {
      console.error("Error deleting route:", error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Map /> Route Management
        </h1>
        <button 
            onClick={() => { setIsEditing(true); setCurrentRoute({ origin: '', destination: '', standard_distance_km: 0, standard_fuel_liters: 0 }); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
            <Plus size={18} /> Add Route
        </button>
      </div>

      {/* Form Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{currentRoute.id ? 'Edit Route' : 'New Route'}</h2>
                    <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700"><X /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Origin</label>
                            <input 
                                type="text" required
                                className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={currentRoute.origin}
                                onChange={e => setCurrentRoute({...currentRoute, origin: e.target.value})}
                                placeholder="Bandung"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Destination</label>
                            <input 
                                type="text" required
                                className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={currentRoute.destination}
                                onChange={e => setCurrentRoute({...currentRoute, destination: e.target.value})}
                                placeholder="Jakarta"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Est. Distance (Km)</label>
                            <input 
                                type="number" required
                                className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={currentRoute.standard_distance_km}
                                onChange={e => setCurrentRoute({...currentRoute, standard_distance_km: parseInt(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Standard Fuel (L)</label>
                            <input 
                                type="number" required
                                className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={currentRoute.standard_fuel_liters}
                                onChange={e => setCurrentRoute({...currentRoute, standard_fuel_liters: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>
                    
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex justify-center items-center gap-2">
                        <Save size={18} /> Save Route
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* List Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Standard Fuel</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {routes.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 flex items-center gap-2">
                            {r.origin} <ArrowRight size={14} className="text-gray-400"/> {r.destination}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{r.standard_distance_km} km</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{r.standard_fuel_liters} Liters</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                            <button 
                                onClick={() => { setCurrentRoute(r); setIsEditing(true); }}
                                className="text-blue-600 hover:text-blue-900"
                            >
                                <Edit size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(r.id)}
                                className="text-red-600 hover:text-red-900"
                            >
                                <Trash2 size={18} />
                            </button>
                        </td>
                    </tr>
                ))}
                 {routes.length === 0 && (
                    <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                            No routes found.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default RouteList;

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, Trash2, Edit, Save, X } from 'lucide-react';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState({ name: '', address: '', phone: '' });

  // Fetch Customers
  const fetchCustomers = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/customers/');
      setCustomers(res.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentCustomer.id) {
        // Update
        await axios.put(`http://localhost:8000/api/customers/${currentCustomer.id}/`, currentCustomer);
      } else {
        // Create
        await axios.post('http://localhost:8000/api/customers/', { ...currentCustomer, organization: 1 });
      }
      setIsEditing(false);
      setCurrentCustomer({ name: '', address: '', phone: '' });
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Failed to save customer.");
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/customers/${id}/`);
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users /> Customer Master Data
        </h1>
        <button 
            onClick={() => { setIsEditing(true); setCurrentCustomer({ name: '', address: '', phone: '' }); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
            <Plus size={18} /> Add Customer
        </button>
      </div>

      {/* Form Modal / Panel */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{currentCustomer.id ? 'Edit Customer' : 'New Customer'}</h2>
                    <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700"><X /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Company Name</label>
                        <input 
                            type="text" 
                            required
                            className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={currentCustomer.name}
                            onChange={e => setCurrentCustomer({...currentCustomer, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input 
                            type="text" 
                            className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={currentCustomer.phone}
                            onChange={e => setCurrentCustomer({...currentCustomer, phone: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <textarea 
                            className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                            rows="3"
                            value={currentCustomer.address}
                            onChange={e => setCurrentCustomer({...currentCustomer, address: e.target.value})}
                        />
                    </div>
                    
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex justify-center items-center gap-2">
                        <Save size={18} /> Save Customer
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{c.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{c.phone}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{c.address}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                            <button 
                                onClick={() => { setCurrentCustomer(c); setIsEditing(true); }}
                                className="text-blue-600 hover:text-blue-900"
                            >
                                <Edit size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(c.id)}
                                className="text-red-600 hover:text-red-900"
                            >
                                <Trash2 size={18} />
                            </button>
                        </td>
                    </tr>
                ))}
                {customers.length === 0 && (
                    <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                            No customers found. Add one to get started.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerList;

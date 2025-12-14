import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ClipboardList, ClipboardCheck, Plus, CirclePlus, X, Search, Trash2, Trash, Edit, Edit2, MapPin, ArrowRight } from 'lucide-react';

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Dropdown Data
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // Busy Logic
  const [busyVehicles, setBusyVehicles] = useState(new Set());
  const [busyDrivers, setBusyDrivers] = useState(new Set());

  const [formData, setFormData] = useState({ 
      id: null, 
      vehicle: '', 
      driver: '', 
      customer: '', 
      origin: '', 
      destination: '', 
      destinations: [], 
      cargo_type: '', 
      allowance_given: 0,
      status: 'PLANNED',
      organization: 1 
  });
  
  // For display of formatted money
  const [allowanceDisplay, setAllowanceDisplay] = useState('');

  const [search, setSearch] = useState('');

  // Helper for Hover Buttons
  const HoverButton = ({ icon: Icon, hoverIcon: HoverIcon, onClick, className, children }) => {
    const [isHovered, setIsHovered] = useState(false);
    const CurrentIcon = isHovered ? HoverIcon : Icon;
    return (
      <button 
        onClick={onClick} 
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
        className={className}
      >
        <CurrentIcon size={18} className="transition-transform" />
        {children}
      </button>
    );
  };

  const formatMoney = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('id-ID').format(value);
  };
  
  const parseMoney = (value) => {
    if (!value) return 0;
    return parseInt(value.replace(/\./g, '').replace(/,/g, ''), 10) || 0;
  };

  const fetchData = async () => {
    try {
      const [tripsRes, vehRes, drvRes, custRes] = await Promise.all([
          api.get('trips/'),
          api.get('vehicles/'),
          api.get('drivers/'),
          api.get('customers/')
      ]);
      setTrips(tripsRes.data);
      setVehicles(vehRes.data);
      setDrivers(drvRes.data);
      setCustomers(custRes.data);

      // Calculate busy resources
      const busyV = new Set();
      const busyD = new Set();
      tripsRes.data.forEach(t => {
          if (['PLANNED', 'OTW'].includes(t.status)) {
              if (t.vehicle) busyV.add(t.vehicle);
              if (t.driver) busyD.add(t.driver);
          }
      });
      setBusyVehicles(busyV);
      setBusyDrivers(busyD);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      
      if (payload.destinations && payload.destinations.length > 0) {
          payload.destination = payload.destinations[payload.destinations.length - 1];
      } else if (payload.destination) {
          payload.destinations = [payload.destination];
      }

      if (isEditing) {
        await api.patch(`trips/${formData.id}/`, payload);
      } else {
        await api.post('trips/', payload);
      }
      setShowModal(false);
      fetchData();
      resetForm();
    } catch (error) {
      console.error("Error saving trip:", error);
      alert(error.response?.data?.detail || "Failed to save trip.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this trip?')) {
      try {
        await api.delete(`trips/${id}/`);
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openEdit = (trip) => {
    setFormData({ 
        id: trip.id,
        vehicle: trip.vehicle,
        driver: trip.driver,
        customer: trip.customer,
        origin: trip.origin,
        destination: trip.destination,
        destinations: trip.destinations || [],
        cargo_type: trip.cargo_type,
        allowance_given: trip.allowance_given,
        status: trip.status,
        organization: trip.organization
    });
    setAllowanceDisplay(formatMoney(trip.allowance_given));
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ 
        id: null, vehicle: '', driver: '', customer: '', 
        origin: '', destination: '', destinations: [], cargo_type: '', 
        allowance_given: 0, status: 'PLANNED', organization: 1 
    });
    setAllowanceDisplay('');
    setIsEditing(false);
  };

  const addDestination = () => {
    setFormData(prev => ({
      ...prev,
      destinations: [...prev.destinations, '']
    }));
  };

  const updateDestination = (index, value) => {
    const newDestinations = [...formData.destinations];
    newDestinations[index] = value;
    setFormData(prev => ({ ...prev, destinations: newDestinations }));
  };

  const removeDestination = (index) => {
    const newDestinations = formData.destinations.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, destinations: newDestinations }));
  };

  const handleAllowanceChange = (e) => {
      const val = e.target.value;
      // Allow only numbers and dots/commas
      if (!/^[\d\.,]*$/.test(val)) return;
      
      const num = parseMoney(val);
      setFormData({ ...formData, allowance_given: num });
      setAllowanceDisplay(val); // Keep user input as is while typing? Better to format on blur or controlled?
      // Controlled with simple logic: remove non-digits, format, set
      const cleanVal = val.replace(/\D/g, '');
      if (cleanVal) {
          setAllowanceDisplay(new Intl.NumberFormat('id-ID').format(cleanVal));
      } else {
          setAllowanceDisplay('');
      }
  };

  const filtered = trips.filter(t => 
    t.surat_jalan_number?.toLowerCase().includes(search.toLowerCase()) || 
    t.origin.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col">
       <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Trip Management (Surat Jalan)</h1>
          <HoverButton 
            icon={Plus} 
            hoverIcon={CirclePlus} 
            onClick={() => { resetForm(); setShowModal(true); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            New Trip
          </HoverButton>
       </header>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search SJ Number or Origin..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none text-sm"
                  value={search} onChange={e => setSearch(e.target.value)} />
             </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">SJ Number</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Driver / Truck</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Route</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">{t.surat_jalan_number || 'Pending'}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            t.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            t.status === 'OTW' ? 'bg-blue-100 text-blue-700' : 
                            'bg-slate-100 text-slate-600'
                        }`}>
                            {t.status}
                        </span>
                    </td>
                    <td className="p-4 text-sm">
                        <div className="font-medium text-slate-800">{t.driver_name}</div>
                        <div className="text-slate-500 text-xs">{t.vehicle_plate}</div>
                    </td>
                    <td className="p-4 text-sm">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                                <span className="font-medium">{t.origin}</span>
                                <ArrowRight size={14} className="text-slate-400"/>
                            </div>
                            {t.destinations && t.destinations.length > 0 ? (
                                <div className="pl-4 border-l-2 border-slate-200 ml-1 space-y-1">
                                    {t.destinations.map((dest, idx) => (
                                        <div key={idx} className="flex items-center gap-1 text-slate-600 text-xs">
                                            <MapPin size={10} /> {dest}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 pl-1">
                                    <span className="font-medium">{t.destination}</span>
                                </div>
                            )}
                        </div>
                    </td>
                    <td className="p-4 text-right space-x-2 flex justify-end">
                       <HoverButton onClick={() => openEdit(t)} icon={Edit} hoverIcon={Edit2} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" />
                       <HoverButton onClick={() => handleDelete(t.id)} icon={Trash2} hoverIcon={Trash} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>

       {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">{isEditing ? 'Edit Trip' : 'Create New Trip'}</h3>
                  <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400 hover:text-red-500 transition-colors"/></button>
               </div>
               <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">Vehicle</label>
                        <select required className="w-full px-3 py-2 border rounded-lg bg-white"
                            value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})}>
                            <option value="">Select Truck</option>
                            {vehicles.map(v => {
                                const isBusy = busyVehicles.has(v.id) && formData.vehicle != v.id;
                                return (
                                    <option key={v.id} value={v.id} disabled={isBusy} className={isBusy ? 'text-slate-400' : ''}>
                                        {v.license_plate} ({v.vehicle_type}) {isBusy ? '(Busy)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Driver</label>
                        <select required className="w-full px-3 py-2 border rounded-lg bg-white"
                            value={formData.driver} onChange={e => setFormData({...formData, driver: e.target.value})}>
                            <option value="">Select Driver</option>
                            {drivers.map(d => {
                                const isBusy = busyDrivers.has(d.id) && formData.driver != d.id;
                                return (
                                    <option key={d.id} value={d.id} disabled={isBusy} className={isBusy ? 'text-slate-400' : ''}>
                                        {d.username} {isBusy ? '(Busy)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">Origin</label>
                        <input required type="text" className="w-full px-3 py-2 border rounded-lg"
                            value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} />
                      </div>
                      
                      {/* Destination Section */}
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium mb-1">Destinations</label>
                        {formData.destinations.map((dest, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-6 text-center text-xs text-slate-400">{index + 1}</div>
                                <input 
                                    type="text" 
                                    className="flex-1 px-3 py-2 border rounded-lg"
                                    placeholder={`Stop #${index + 1}`}
                                    value={dest}
                                    onChange={(e) => updateDestination(index, e.target.value)}
                                    required
                                />
                                <button type="button" onClick={() => removeDestination(index)} className="text-red-400 hover:text-red-600 p-1">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        <button 
                            type="button" 
                            onClick={addDestination}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-2"
                        >
                            <Plus size={16} /> Add Destination
                        </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">Customer (Optional)</label>
                        <select className="w-full px-3 py-2 border rounded-lg bg-white"
                            value={formData.customer || ''} onChange={e => setFormData({...formData, customer: e.target.value})}>
                            <option value="">No Customer</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Allowance (IDR)</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border rounded-lg font-mono"
                            value={allowanceDisplay} 
                            onChange={handleAllowanceChange} 
                            placeholder="0"
                        />
                      </div>
                  </div>
                  
                      <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select className="w-full px-3 py-2 border rounded-lg bg-white"
                            value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                            <option value="PLANNED">Planned</option>
                            <option value="OTW">On The Way</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>

                  <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors">
                      {isEditing ? 'Update Trip' : 'Create Trip'}
                  </button>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

export default Trips;

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Send, Truck, User, MapPin, DollarSign, Briefcase, Package, AlertTriangle, FileText, Plus, X } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';

const TripCreate = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [trips, setTrips] = useState([]);
  
  // Form State
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  
  const [origin, setOrigin] = useState('Bandung');
  const [destinations, setDestinations] = useState(['Jakarta']);
  const [destinationInput, setDestinationInput] = useState('');
  const [cargoType, setCargoType] = useState('General');
  const [suratNumber, setSuratNumber] = useState('');
  
  const [allowance, setAllowance] = useState(500000); // Sangu
  const [revenue, setRevenue] = useState(0); // Ongkos Angkut
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        try {
          const vRes = await axios.get('http://localhost:8000/api/vehicles/');
          setVehicles(vRes.data);
          
          const dRes = await axios.get('http://localhost:8000/api/drivers/');
          setDrivers(dRes.data);
          
          const cRes = await axios.get('http://localhost:8000/api/customers/');
          setCustomers(cRes.data);

          const tRes = await axios.get('http://localhost:8000/api/trips/');
          setTrips(tRes.data);
          
          // Prefill Surat Jalan number
          const sjRes = await axios.get('http://localhost:8000/api/trips/next-surat-number/');
          setSuratNumber(sjRes.data.next_surat_jalan_number || '');
        } catch (error) {
          console.error("Error fetching form data:", error);
          // Fallback generator if backend not reachable
          setSuratNumber(prev => {
            if (prev) return prev;
            const now = new Date();
            return `SJ-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getTime()).slice(-4)}`;
          });
        }
    };
    fetchData();
  }, []);

  // Destination helpers
  const addDestination = () => {
    const value = destinationInput.trim();
    if (!value) return;
    if (destinations.includes(value)) {
      setDestinationInput('');
      return;
    }
    setDestinations(prev => [...prev, value]);
    setDestinationInput('');
  };

  const removeDestination = (value) => {
    setDestinations(prev => prev.filter(d => d !== value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!selectedVehicle || !selectedDriver) {
        alert("Please select both a Truck and a Driver!");
        return;
    }
    if(destinations.length === 0) {
        alert("Please add at least one destination.");
        return;
    }

    setLoading(true);
    const tripData = {
        vehicle: selectedVehicle,
        driver: selectedDriver,
        customer: selectedCustomer || null,
        origin: origin,
        destination: destinations[0], // Legacy support for single destination
        destinations: destinations,
        cargo_type: cargoType,
        allowance_given: allowance,
        revenue: revenue,
        surat_jalan_number: suratNumber,
        status: 'PLANNED',
        organization: 1 
    };

    try {
        await axios.post('http://localhost:8000/api/trips/', tripData);
        alert(`Departure created. Rp ${parseInt(allowance).toLocaleString()} set as allowance.`);
        // Optional: Reset form or redirect
    } catch (error) {
        console.error("Error creating trip:", error);
        alert("Failed to create trip. Check console.");
    } finally {
        setLoading(false);
    }
  };

  // Derived Data
  const activeTrips = useMemo(
    () => trips.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED'),
    [trips]
  );
  const busyVehicleIds = useMemo(() => new Set(activeTrips.map(t => t.vehicle)), [activeTrips]);
  const busyDriverIds = useMemo(() => new Set(activeTrips.map(t => t.driver)), [activeTrips]);

  useEffect(() => {
    if (selectedVehicle && busyVehicleIds.has(Number(selectedVehicle))) {
        setSelectedVehicle('');
    }
    if (selectedDriver && busyDriverIds.has(Number(selectedDriver))) {
        setSelectedDriver('');
    }
  }, [busyVehicleIds, busyDriverIds, selectedVehicle, selectedDriver]);

  const vehicleOptions = vehicles.map(v => {
    const blocked = busyVehicleIds.has(v.id);
    return {
      value: v.id,
      label: `${v.license_plate} (${v.vehicle_type})`,
      subLabel: blocked ? 'On active trip' : `Status: ${v.status || 'Active'}`,
      disabled: blocked,
    };
  });

  const driverOptions = drivers.map(d => {
    const blocked = busyDriverIds.has(d.id);
    return {
      value: d.id,
      label: d.username,
      subLabel: blocked ? 'On active trip' : `ID: ${d.id}`,
      disabled: blocked,
    };
  });

  const customerOptions = customers.map(c => ({
    value: c.id,
    label: c.name,
    subLabel: c.address
  }));

  // Selected Driver Logic (Debt Warning)
  const currentDriver = drivers.find(d => d.id === parseInt(selectedDriver));
  const driverDebt = currentDriver ? parseFloat(currentDriver.current_debt || 0) : 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-green-600 p-4 text-white flex items-center gap-2">
            <DollarSign />
            <h2 className="text-xl font-bold">Input Departure</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
            
            {/* 1. Resources Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <SearchableSelect 
                                options={vehicleOptions}
                                value={selectedVehicle}
                                onChange={setSelectedVehicle}
                                placeholder="Vehicle"
                                icon={Truck}
                        />
                    </div>

                    <div className="space-y-2">
                        <SearchableSelect 
                            options={driverOptions}
                            value={selectedDriver}
                            onChange={setSelectedDriver}
                            placeholder="Driver"
                            icon={User}
                        />
                        
                        {/* Debt Warning */}
                        {driverDebt > 0 && (
                            <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                                <div>
                                    <p className="text-sm text-red-700 font-bold">Kasbon Alert!</p>
                                    <p className="text-xs text-red-600">
                                        {currentDriver?.username} has a debt of 
                                        <span className="font-bold ml-1">Rp {driverDebt.toLocaleString()}</span>.
                                        Consider deducting this from the allowance.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Route & Cargo Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Route & Cargo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                     <div>
                        <SearchableSelect 
                                options={customerOptions}
                                value={selectedCustomer}
                                onChange={setSelectedCustomer}
                                placeholder="Customer (Optional)"
                                icon={Briefcase}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Type</label>
                        <div className="relative">
                            <Package className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                                type="text" 
                                value={cargoType} 
                                onChange={e => setCargoType(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                placeholder="e.g. Cement, Steel"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Origin (Start)</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                                type="text" 
                                value={origin} 
                                onChange={e => setOrigin(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                placeholder="Bandung"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destinations (Multiple)</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                                type="text" 
                                value={destinationInput} 
                                onChange={e => setDestinationInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addDestination();
                                    }
                                }}
                                className="w-full pl-10 pr-14 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                placeholder="Add destination then press Enter"
                            />
                            <button 
                                type="button"
                                onClick={addDestination}
                                className="absolute right-2 top-2 bg-green-600 text-white px-3 py-1 rounded-md text-xs hover:bg-green-700 flex items-center gap-1"
                            >
                                <Plus size={14}/> Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {destinations.map(dest => (
                                <span key={dest} className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                    {dest}
                                    <button type="button" onClick={() => removeDestination(dest)} className="text-green-600 hover:text-green-800">
                                        <X size={12}/>
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2.5 Surat Jalan */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <FileText className="text-green-600" />
                    Surat Jalan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Surat Jalan Number</label>
                        <input
                            type="text"
                            value={suratNumber}
                            onChange={(e) => setSuratNumber(e.target.value)}
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none font-mono"
                            placeholder="SJ-20251213-0001"
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-generated. Admin can edit before saving.</p>
                    </div>
                </div>
            </div>

            {/* 3. Financials Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Financials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ongkos Angkut (Revenue)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500 font-bold">Rp</span>
                            <input 
                                type="number" 
                                value={revenue} 
                                onChange={e => setRevenue(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-lg bg-blue-50"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Total revenue from client.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Uang Sangu (Allowance)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500 font-bold">Rp</span>
                            <input 
                                type="number" 
                                value={allowance} 
                                onChange={e => setAllowance(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none font-mono text-lg"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Cash given to driver upfront.</p>
                    </div>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-lg"
            >
                {loading ? 'Processing...' : (
                    <>
                        <Send size={24} />
                        Create Departure
                    </>
                )}
            </button>

        </form>
      </div>
    </div>
  );
};

export default TripCreate;

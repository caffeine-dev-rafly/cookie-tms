import { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, Truck, User, MapPin, DollarSign, Briefcase, Package, AlertTriangle } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';

const TripCreate = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // Form State
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  
  const [origin, setOrigin] = useState('Bandung');
  const [destination, setDestination] = useState('Jakarta');
  const [cargoType, setCargoType] = useState('General');
  
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
        } catch (error) {
          console.error("Error fetching form data:", error);
        }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!selectedVehicle || !selectedDriver) {
        alert("Please select both a Truck and a Driver!");
        return;
    }

    setLoading(true);
    const tripData = {
        vehicle: selectedVehicle,
        driver: selectedDriver,
        customer: selectedCustomer || null,
        origin: origin,
        destination: destination,
        cargo_type: cargoType,
        allowance_given: allowance,
        revenue: revenue,
        status: 'PLANNED',
        organization: 1 
    };

    try {
        await axios.post('http://localhost:8000/api/trips/', tripData);
        alert(`Success! Rp ${parseInt(allowance).toLocaleString()} sent to Driver.`);
        // Optional: Reset form or redirect
    } catch (error) {
        console.error("Error creating trip:", error);
        alert("Failed to create trip. Check console.");
    } finally {
        setLoading(false);
    }
  };

  // Derived Data
  const vehicleOptions = vehicles.map(v => ({
    value: v.id,
    label: `${v.license_plate} (${v.vehicle_type})`,
    subLabel: `Status: ${v.status || 'Active'}`
  }));

  const driverOptions = drivers.map(d => ({
    value: d.id,
    label: d.username,
    subLabel: `ID: ${d.id}`
  }));

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
            <h2 className="text-xl font-bold">Input Uang Jalan (Trip Allowance)</h2>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination (End)</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                                type="text" 
                                value={destination} 
                                onChange={e => setDestination(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                placeholder="Jakarta"
                            />
                        </div>
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
                        Create Trip & Issue Funds
                    </>
                )}
            </button>

        </form>
      </div>
    </div>
  );
};

export default TripCreate;

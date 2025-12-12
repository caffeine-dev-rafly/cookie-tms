import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calculator, CheckCircle, DollarSign, Fuel, Truck, AlertCircle, FileText } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';

const TripSettlement = () => {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  
  // Expense State
  const [fuelCost, setFuelCost] = useState(0);
  const [fuelLiters, setFuelLiters] = useState(0);
  const [tollCost, setTollCost] = useState(0);
  const [unloadingCost, setUnloadingCost] = useState(0);
  const [otherCost, setOtherCost] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [suratHistory, setSuratHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    // Fetch Active Trips (Planned or OTW)
    const fetchTrips = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/trips/');
            // Filter only active trips on frontend for now
            const active = res.data.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
            setTrips(active);
        } catch (error) {
            console.error("Error fetching trips:", error);
        }
    };
    fetchTrips();
  }, []);

  // Fetch surat jalan history when trip changes
  useEffect(() => {
    if (!selectedTripId) {
        setSuratHistory([]);
        return;
    }
    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await axios.get(`http://localhost:8000/api/trips/${selectedTripId}/surat-history/`);
            setSuratHistory(res.data);
        } catch (error) {
            console.error("Error fetching surat jalan history:", error);
            setSuratHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };
    fetchHistory();
  }, [selectedTripId]);

  // Find selected trip details
  const currentTrip = trips.find(t => t.id === parseInt(selectedTripId));

  // Calculations
  const allowance = currentTrip ? parseFloat(currentTrip.allowance_given) : 0;
  const totalExpense = parseFloat(fuelCost) + parseFloat(tollCost) + parseFloat(unloadingCost) + parseFloat(otherCost);
  const balance = allowance - totalExpense;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTripId) return;

    setLoading(true);
    const settlementData = {
        actual_fuel_cost: fuelCost,
        actual_fuel_liters: fuelLiters,
        actual_toll_cost: tollCost,
        unloading_cost: unloadingCost,
        other_expense: otherCost,
        status: 'COMPLETED' // Mark as done
    };

    try {
        await axios.patch(`http://localhost:8000/api/trips/${selectedTripId}/`, settlementData);
        alert("Settlement Successful! Trip marked as Completed.");
        // Remove from list
        setTrips(prev => prev.filter(t => t.id !== parseInt(selectedTripId)));
        setSelectedTripId('');
        // Reset form
        setFuelCost(0); setFuelLiters(0); setTollCost(0); setUnloadingCost(0); setOtherCost(0);
    } catch (error) {
        console.error("Error settling trip:", error);
        alert("Failed to settle trip.");
    } finally {
        setLoading(false);
    }
  };

  // Prepare options
  const tripOptions = trips.map(t => ({
    value: t.id,
    label: `${t.vehicle_plate} - ${t.driver_name}`,
    subLabel: `${t.origin} -> ${(t.destinations && t.destinations.length ? t.destinations.join(' -> ') : t.destination)} (Sangu: ${parseInt(t.allowance_given).toLocaleString()})`
  }));

  return (
    <div className="max-w-5xl mx-auto p-6">
       
       <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 p-3 rounded-full text-white">
            <Calculator size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Trip Settlement (Setoran)</h1>
            <p className="text-gray-500">Finalize driver expenses and calculate balance.</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Select Trip */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Active Trip</label>
                <SearchableSelect 
                    options={tripOptions}
                    value={selectedTripId}
                    onChange={setSelectedTripId}
                    placeholder="Search Vehicle or Driver..."
                    icon={Truck}
                />
            </div>

            {/* Surat Jalan Card */}
            {currentTrip && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-3">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                        <FileText size={18} className="text-blue-600" />
                        Surat Jalan
                    </h3>
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-100 px-4 py-3 rounded-lg">
                        <div>
                            <p className="text-xs text-blue-600 uppercase font-semibold">Current Number</p>
                            <p className="font-mono text-lg font-bold text-blue-800">{currentTrip.surat_jalan_number || '—'}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 mb-2">History</p>
                        <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-md">
                            {historyLoading ? (
                                <div className="p-3 text-sm text-gray-500">Loading history...</div>
                            ) : suratHistory.length === 0 ? (
                                <div className="p-3 text-sm text-gray-500">No history yet.</div>
                            ) : (
                                suratHistory.map((item, idx) => (
                                    <div key={idx} className="px-3 py-2 border-b last:border-b-0 border-gray-100 flex items-center justify-between">
                                        <span className="font-mono text-sm text-gray-800">{item.surat_jalan_number}</span>
                                        <span className="text-xs text-gray-400">{new Date(item.changed_at).toLocaleString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Expenses Form */}
            {currentTrip && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 fade-in">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <DollarSign size={18} className="text-gray-400"/> Reported Expenses
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Fuel */}
                        <div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fuel Cost (Rp)</label>
                                <input 
                                    type="number" 
                                    value={fuelCost}
                                    onChange={e => setFuelCost(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fuel Liters (L)</label>
                                <input 
                                    type="number" 
                                    value={fuelLiters}
                                    onChange={e => setFuelLiters(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Toll */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-Toll Cost</label>
                            <input 
                                type="number" 
                                value={tollCost}
                                onChange={e => setTollCost(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Unloading */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unloading / Labor</label>
                            <input 
                                type="number" 
                                value={unloadingCost}
                                onChange={e => setUnloadingCost(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Other */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Other Expenses (Parking, etc.)</label>
                            <input 
                                type="number" 
                                value={otherCost}
                                onChange={e => setOtherCost(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}
          </div>

          {/* RIGHT: Summary Card */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-6">
                <div className="bg-gray-900 p-4 text-white">
                    <h3 className="font-bold">Settlement Summary</h3>
                    <p className="text-xs text-gray-400">Review before finalizing</p>
                </div>

                {!currentTrip ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        Please select a trip to begin settlement.
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        {/* Summary Rows */}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Allowance (Given)</span>
                            <span className="font-mono font-medium">Rp {allowance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-600">
                            <span>Total Expenses</span>
                            <span className="font-mono font-medium">- Rp {totalExpense.toLocaleString()}</span>
                        </div>
                        
                        <hr className="border-dashed"/>

                        {/* Balance Result */}
                        <div className={`p-4 rounded-lg text-center ${balance >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                                {balance >= 0 ? "Driver Returns (Setoran)" : "Company Reimburses (Bon)"}
                            </p>
                            <p className={`text-2xl font-bold font-mono ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                Rp {Math.abs(balance).toLocaleString()}
                            </p>
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4"
                        >
                            <CheckCircle size={20} />
                            Finalize Settlement
                        </button>
                    </div>
                )}
             </div>
          </div>

       </div>
    </div>
  );
};

export default TripSettlement;

import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { MapPin, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import TripDetails from './TripDetails';
import FinishTripModal from '../components/FinishTripModal';

const DriverDashboard = () => {
    const { user } = useAuth();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [tripToFinish, setTripToFinish] = useState(null);
    const [isFinishing, setIsFinishing] = useState(false);

    const fetchTrips = async () => {
        try {
            const response = await api.get('trips/'); 
            const myTrips = response.data.filter(t => t.driver === user.id);
            setTrips(myTrips);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, [user.id]);

    const handleStatusUpdate = async (trip) => {
        let nextStatus = '';
        switch (trip.status) {
            case 'PLANNED': nextStatus = 'OTW'; break; // Simplified for now: Planned -> OTW -> Completed
            case 'OTW': nextStatus = 'COMPLETED'; break; 
            default: return;
        }

        if (nextStatus === 'COMPLETED') {
            setTripToFinish(trip);
            return;
        }

        if (confirm(`Update status to ${nextStatus}?`)) {
            try {
                await api.patch(`trips/${trip.id}/`, { status: nextStatus });
                fetchTrips();
                if (selectedTrip && selectedTrip.id === trip.id) {
                    setSelectedTrip(null); // Close modal on completion
                }
            } catch (error) {
                console.error("Failed to update status", error);
            }
        }
    };

    const handleFinishTripSubmit = async ({ file, location }) => {
        if (!tripToFinish) return;
        setIsFinishing(true);

        try {
            const formData = new FormData();
            formData.append('status', 'COMPLETED');
            formData.append('drop_latitude', location.latitude);
            formData.append('drop_longitude', location.longitude);
            formData.append('proof_of_delivery', file);

            await api.patch(`trips/${tripToFinish.id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setTripToFinish(null);
            fetchTrips();
            if (selectedTrip && selectedTrip.id === tripToFinish.id) {
                setSelectedTrip(null);
            }
        } catch (error) {
            console.error("Failed to finish trip", error);
            alert("Failed to upload proof of delivery. Please try again.");
        } finally {
            setIsFinishing(false);
        }
    };

    const activeTrips = trips.filter(t => ['PLANNED', 'OTW'].includes(t.status));
    const historyTrips = trips.filter(t => ['COMPLETED', 'CANCELLED'].includes(t.status));

    return (
        <div className="p-4 max-w-lg mx-auto pb-20"> {/* Mobile focus */}
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Trips</h1>
                    <p className="text-slate-500 text-sm">Hello, {user.username}</p>
                </div>
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                    {user.username.charAt(0).toUpperCase()}
                </div>
            </header>
            
            {loading ? <p>Loading...</p> : (
                <div className="space-y-8">
                    {/* ACTIVE TRIP SECTION */}
                    <section>
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Action Required</h2>
                        {activeTrips.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 p-8 rounded-xl text-center">
                                <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-3">
                                    <CheckCircle size={24} />
                                </div>
                                <p className="text-slate-500 font-medium">No active trips</p>
                                <p className="text-xs text-slate-400">You are currently available.</p>
                            </div>
                        ) : (
                            activeTrips.map(trip => (
                                <div key={trip.id} className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden mb-4">
                                    <div className="bg-blue-600 p-4 text-white">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-blue-100 text-xs font-mono">#{trip.surat_jalan_number}</span>
                                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">{trip.status}</span>
                                        </div>
                                        <div className="font-bold text-lg">{trip.destination}</div>
                                        <div className="text-blue-100 text-sm">Customer: {trip.customer_name || 'N/A'}</div>
                                    </div>
                                    
                                    <div className="p-5">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase font-bold">Cargo</p>
                                                <p className="font-medium text-slate-800">{trip.cargo_type || 'General'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400 uppercase font-bold">Allowance</p>
                                                <p className="font-medium text-slate-800">Rp {trip.allowance_given?.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => handleStatusUpdate(trip)}
                                            className="w-full py-3 rounded-xl font-bold text-white shadow-md transition-transform active:scale-95 flex justify-center items-center gap-2 mb-3 bg-blue-600 hover:bg-blue-700"
                                        >
                                            {trip.status === 'PLANNED' ? 'START JOURNEY' : 'FINISH TRIP'} <ChevronRight size={20}/>
                                        </button>
                                        
                                        <button 
                                            onClick={() => setSelectedTrip(trip)}
                                            className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
                                        >
                                            View Details & Verify Drops
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </section>

                    {/* HISTORY SECTION */}
                    <section>
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Recent History</h2>
                        {historyTrips.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm py-4">No history yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {historyTrips.map(trip => (
                                    <div key={trip.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{trip.destination}</div>
                                            <div className="text-xs text-slate-500">{new Date(trip.created_at).toLocaleDateString()} • {trip.surat_jalan_number}</div>
                                        </div>
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Done</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* Details Modal */}
            {selectedTrip && (
                <TripDetails 
                    trip={selectedTrip} 
                    onClose={() => setSelectedTrip(null)} 
                    onUpdate={fetchTrips}
                />
            )}

            {/* Finish Trip Modal */}
            <FinishTripModal 
                isOpen={!!tripToFinish}
                onClose={() => setTripToFinish(null)}
                onConfirm={handleFinishTripSubmit}
                isSubmitting={isFinishing}
            />
        </div>
    );
};

export default DriverDashboard;
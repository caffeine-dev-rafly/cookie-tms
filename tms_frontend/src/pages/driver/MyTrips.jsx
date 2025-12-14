import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import FinishTripModal from '../../components/FinishTripModal';
import { MapPin, Calendar, Truck, CheckCircle, Clock, Map } from 'lucide-react';

const MyTrips = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTrips = async () => {
    try {
      const response = await api.get('trips/');
      // Fallback to username matching if user.id is missing (legacy token)
      const myTrips = response.data.filter(t => t.driver === user?.id || t.driver_name === user?.username);
      // Sort: Active (OTW) first, then Planned, then Completed
      const sorted = myTrips.sort((a, b) => {
        const statusOrder = { 'OTW': 0, 'PLANNED': 1, 'COMPLETED': 2, 'CANCELLED': 3 };
        return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      });
      setTrips(sorted);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  const handleArriveClick = (trip, destination) => {
    setSelectedTrip(trip);
    setSelectedDestination(destination);
    setIsModalOpen(true);
  };

  const handleConfirmArrival = async ({ file, location }) => {
    if (!selectedTrip || !selectedDestination) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('proof_of_delivery', file); 
      formData.append('destination', selectedDestination);
      formData.append('last_latitude', location.latitude);
      formData.append('last_longitude', location.longitude);

      // Call the new 'arrive' endpoint
      await api.post(`trips/${selectedTrip.id}/arrive/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsModalOpen(false);
      setSelectedTrip(null);
      setSelectedDestination(null);
      fetchTrips();
      // Optional: Show success message
    } catch (error) {
      console.error("Error confirming arrival:", error);
      alert("Failed to confirm arrival. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading your trips...</div>;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Trips</h1>
          <p className="text-slate-500 text-sm">Manage your assigned deliveries</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
          {trips.filter(t => t.status === 'OTW').length} Active
        </div>
      </header>

      <div className="space-y-4">
        {trips.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Truck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-medium text-slate-600">No trips assigned</h3>
            <p className="text-slate-400 text-sm">You currently have no pending deliveries.</p>
          </div>
        ) : (
          trips.map((trip) => (
            <div 
              key={trip.id} 
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                trip.status === 'OTW' ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'
              }`}
            >
              {/* Trip Header */}
              <div className={`px-6 py-4 flex justify-between items-center ${
                trip.status === 'OTW' ? 'bg-blue-50/50' : 'bg-slate-50/50'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-700">{trip.surat_jalan_number}</span>
                  <StatusBadge status={trip.status} />
                </div>
                <div className="text-sm text-slate-500 flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(trip.created_at || Date.now()).toLocaleDateString()}
                </div>
              </div>

              {/* Trip Body */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  {/* Route Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex flex-col items-center h-full">
                         {/* Origin Dot */}
                        <div className="w-3 h-3 rounded-full bg-slate-400 ring-4 ring-slate-100 mb-1"></div>
                        
                        {/* Connecting Line */}
                        <div className="w-0.5 flex-1 bg-slate-200 min-h-[40px]"></div>
                        
                      </div>
                      <div className="flex-1">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Origin</p>
                          <p className="font-medium text-slate-800">{trip.origin}</p>
                        </div>
                      </div>
                    </div>

                    {/* Destinations List */}
                    <div className="space-y-4 pl-0">
                         {trip.destinations && trip.destinations.length > 0 ? (
                            trip.destinations.map((dest, idx) => {
                                const isCompleted = trip.completed_destinations?.includes(dest);
                                const isNext = !isCompleted && trip.status === 'OTW'; // Simplified logic: Allow arriving at any pending

                                return (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="mt-1 flex flex-col items-center">
                                            <div className={`w-3 h-3 rounded-full ring-4 ${isCompleted ? 'bg-green-500 ring-green-100' : 'bg-blue-500 ring-blue-100'}`}></div>
                                            {idx < trip.destinations.length - 1 && <div className="w-0.5 h-10 bg-slate-200 mt-1"></div>}
                                        </div>
                                        <div className="flex-1 flex justify-between items-center pb-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                    Destination {idx + 1}
                                                </p>
                                                <p className={`font-medium ${isCompleted ? 'text-green-700' : 'text-slate-800'}`}>
                                                    {dest}
                                                </p>
                                                {isCompleted && (
                                                    <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                                        <CheckCircle size={12} /> Completed
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Action Button for this Drop */}
                                            {trip.status === 'OTW' && !isCompleted && (
                                                <button 
                                                    onClick={() => handleArriveClick(trip, dest)}
                                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-bold shadow-sm transition-all active:scale-95"
                                                >
                                                    <MapPin size={14} />
                                                    Arrive Here
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                         ) : (
                            // Fallback for trips without destinations array (Legacy)
                             <div className="flex items-start gap-3">
                                <div className="mt-1 flex flex-col items-center">
                                     <div className={`w-3 h-3 rounded-full ring-4 ${trip.status === 'COMPLETED' ? 'bg-green-500 ring-green-100' : 'bg-blue-500 ring-blue-100'}`}></div>
                                </div>
                                <div className="flex-1 flex justify-between items-center">
                                    <div>
                                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Destination</p>
                                         <p className="font-medium text-slate-800">{trip.destination}</p>
                                    </div>
                                    {trip.status === 'OTW' && (
                                         <button 
                                            onClick={() => handleArriveClick(trip, trip.destination)}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-bold shadow-sm transition-all active:scale-95"
                                        >
                                            <MapPin size={14} />
                                            Arrive Here
                                        </button>
                                    )}
                                </div>
                             </div>
                         )}
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="md:w-1/3 bg-slate-50 rounded-lg p-4 space-y-3 h-fit">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Truck size={18} />
                      <span className="font-medium">Vehicle Info</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{trip.vehicle_plate || 'N/A'}</p>
                      <p className="text-xs text-slate-500">License Plate</p>
                    </div>
                    {trip.cargo_type && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-sm font-medium text-slate-700">{trip.cargo_type}</p>
                        <p className="text-xs text-slate-500">Cargo Type</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Status */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                   <div className="text-xs text-slate-400">
                        {trip.completed_destinations?.length || 0} / {trip.destinations?.length || 1} Drops Completed
                   </div>
                   {trip.status === 'PLANNED' && (
                    <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg font-bold text-sm">
                      <Clock size={16} />
                      Waiting for Dispatch
                    </div>
                  )}
                   {trip.status === 'COMPLETED' && (
                    <div className="flex items-center gap-2 text-green-600 font-bold px-4 py-2 bg-green-50 rounded-lg text-sm">
                      <CheckCircle size={16} />
                      Trip Completed
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <FinishTripModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmArrival}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    PLANNED: 'bg-slate-100 text-slate-600',
    OTW: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[status] || styles.PLANNED}`}>
      {status}
    </span>
  );
};

export default MyTrips;
import React, { useState, useEffect } from 'react';
import { Camera, MapPin, X, Loader } from 'lucide-react';

const FinishTripModal = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
    const [file, setFile] = useState(null);
    const [location, setLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState('idle'); // idle, acquiring, acquired, error
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset state when opening
            setFile(null);
            setError('');
            getLocation();
        }
    }, [isOpen]);

    const getLocation = () => {
        setLocationStatus('acquiring');
        if (!navigator.geolocation) {
            setLocationStatus('error');
            setError('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                setLocationStatus('acquired');
            },
            (err) => {
                setLocationStatus('error');
                setError('Unable to retrieve your location. Please ensure GPS is enabled.');
                console.error(err);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSubmit = () => {
        if (!file) {
            setError('Please upload the signed Surat Jalan.');
            return;
        }
        if (!location) {
            setError('GPS location is required. Please try acquiring location again.');
            return;
        }

        // Pass data back to parent
        onConfirm({ file, location });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Camera size={20} /> Complete Delivery
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Location Status */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location Verification</label>
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${locationStatus === 'acquired' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                            {locationStatus === 'acquiring' && <Loader size={20} className="animate-spin text-blue-500" />}
                            {locationStatus === 'acquired' && <MapPin size={20} className="text-green-600" />}
                            {locationStatus === 'error' && <MapPin size={20} className="text-red-500" />}
                            
                            <span className="font-medium text-sm">
                                {locationStatus === 'idle' && 'Waiting to acquire...'}
                                {locationStatus === 'acquiring' && 'Acquiring GPS Location...'}
                                {locationStatus === 'acquired' && 'Location Verified'}
                                {locationStatus === 'error' && 'Location Failed'}
                            </span>

                            {locationStatus === 'error' && (
                                <button onClick={getLocation} className="ml-auto text-xs bg-white border border-slate-300 px-2 py-1 rounded font-bold hover:bg-slate-50">
                                    Retry
                                </button>
                            )}
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upload Surat Jalan</label>
                        <div className="relative">
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all border border-slate-200 rounded-xl"
                            />
                        </div>
                        {file && <p className="text-xs text-green-600 font-medium flex items-center gap-1">File selected: {file.name}</p>}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || locationStatus !== 'acquired' || !file}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        {isSubmitting ? 'Submitting...' : 'CONFIRM DELIVERY'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinishTripModal;
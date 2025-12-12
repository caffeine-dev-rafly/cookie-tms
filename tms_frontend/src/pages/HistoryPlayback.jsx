import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import L from 'leaflet';
import axios from 'axios';
import { Play, Pause, FastForward, Calendar, Clock } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';

// Icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const createTruckIcon = (heading, color = 'blue') => divIcon({
    className: 'custom-truck-icon',
    html: `<div style="
            transform: rotate(${heading || 0}deg); 
            width: 40px; height: 40px;
            background-image: url('https://cdn-icons-png.flaticon.com/512/2555/2555013.png');
            background-size: cover;
            border: 2px solid ${color};
            border-radius: 50%;
            background-color: white;
            "></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

const StopIcon = divIcon({
    html: `<div style="background: red; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px black;"></div>`,
    className: 'stop-icon',
    iconSize: [12, 12]
});

// Map Controller to fit bounds
const MapFitter = ({ points }) => {
    const map = useMap();
    useEffect(() => {
        if (points && points.length > 0) {
            const bounds = points.map(p => [p.latitude, p.longitude]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [points, map]);
    return null;
};

const HistoryPlayback = () => {
    // Data State
    const [vehicles, setVehicles] = useState([]);
    const [history, setHistory] = useState([]);
    
    // Selection State
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Playback State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 5x
    
    // Fetch Vehicles
    useEffect(() => {
        axios.get('http://localhost:8000/api/vehicles/')
             .then(res => setVehicles(res.data))
             .catch(err => console.error(err));
    }, []);

    // Fetch History
    useEffect(() => {
        if (selectedVehicle && selectedDate) {
            axios.get(`http://localhost:8000/api/vehicles/${selectedVehicle}/history/?date=${selectedDate}`)
                 .then(res => {
                     setHistory(res.data);
                     setCurrentIndex(0);
                     setIsPlaying(false);
                 })
                 .catch(err => console.error(err));
        }
    }, [selectedVehicle, selectedDate]);

    // Playback Loop
    useEffect(() => {
        let interval;
        if (isPlaying && history.length > 0) {
            interval = setInterval(() => {
                setCurrentIndex(prev => {
                    if (prev >= history.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000 / playbackSpeed); // Adjust speed
        }
        return () => clearInterval(interval);
    }, [isPlaying, history, playbackSpeed]);

    // Derived Data
    const vehicleOptions = vehicles.map(v => ({ value: v.id, label: v.license_plate }));
    const polylinePositions = history.map(p => [p.latitude, p.longitude]);
    
    // Current Point
    const currentPoint = history[currentIndex];

    // Detect Stops (Simple logic: Speed < 1 km/h)
    // In a real app, clustering these points is better.
    const stopPoints = useMemo(() => {
        return history.filter(p => p.speed < 1);
    }, [history]);

    return (
        <div className="flex flex-col h-full relative">
            
            {/* Control Panel */}
            <div className="bg-white p-4 shadow-md z-20 flex flex-wrap gap-4 items-center border-b">
                <div className="w-64">
                    <SearchableSelect 
                        options={vehicleOptions} 
                        value={selectedVehicle} 
                        onChange={setSelectedVehicle} 
                        placeholder="Select Vehicle" 
                    />
                </div>
                
                <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50">
                    <Calendar size={18} className="text-gray-500 mr-2" />
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={e => setSelectedDate(e.target.value)} 
                        className="bg-transparent outline-none text-sm"
                    />
                </div>

                {history.length > 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        
                        <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1 text-xs font-bold">
                            <span onClick={() => setPlaybackSpeed(1)} className={`cursor-pointer px-1 ${playbackSpeed===1?'text-blue-600':''}`}>1x</span>
                            <span onClick={() => setPlaybackSpeed(5)} className={`cursor-pointer px-1 ${playbackSpeed===5?'text-blue-600':''}`}>5x</span>
                            <span onClick={() => setPlaybackSpeed(10)} className={`cursor-pointer px-1 ${playbackSpeed===10?'text-blue-600':''}`}>10x</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Map */}
            <div className="flex-1 relative z-10">
                <MapContainer center={[-6.9175, 107.6191]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    {history.length > 0 && (
                        <>
                            <MapFitter points={history} />
                            <Polyline positions={polylinePositions} color="blue" weight={4} opacity={0.6} />
                            
                            {/* Start Marker */}
                            <Marker position={polylinePositions[0]}>
                                <Popup>Start Point</Popup>
                            </Marker>

                            {/* End Marker */}
                            <Marker position={polylinePositions[polylinePositions.length - 1]}>
                                <Popup>End Point</Popup>
                            </Marker>

                            {/* Moving Marker */}
                            {currentPoint && (
                                <Marker 
                                    position={[currentPoint.latitude, currentPoint.longitude]} 
                                    icon={createTruckIcon(currentPoint.heading, 'green')}
                                    zIndexOffset={1000}
                                >
                                    <Popup>
                                        <strong>{new Date(currentPoint.timestamp).toLocaleTimeString()}</strong><br/>
                                        Speed: {currentPoint.speed.toFixed(1)} km/h
                                    </Popup>
                                </Marker>
                            )}
                        </>
                    )}
                </MapContainer>

                {/* Timeline Slider Overlay */}
                {history.length > 0 && (
                    <div className="absolute bottom-6 left-6 right-6 bg-white p-4 rounded-lg shadow-xl z-[400]">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{new Date(history[0].timestamp).toLocaleTimeString()}</span>
                            <span className="font-bold text-blue-600 flex items-center gap-1">
                                <Clock size={12}/> 
                                {currentPoint ? new Date(currentPoint.timestamp).toLocaleTimeString() : '--:--'}
                            </span>
                            <span>{new Date(history[history.length-1].timestamp).toLocaleTimeString()}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max={history.length - 1} 
                            value={currentIndex} 
                            onChange={(e) => {
                                setIsPlaying(false);
                                setCurrentIndex(parseInt(e.target.value));
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                )}
            </div>

        </div>
    );
};

export default HistoryPlayback;

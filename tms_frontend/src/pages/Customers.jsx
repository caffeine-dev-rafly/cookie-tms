import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { MapContainer, TileLayer, Marker, Circle, Rectangle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Building2, Plus, CirclePlus, X, Search, Trash2, Trash, Edit, Edit2 } from 'lucide-react';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_CENTER = [-6.9175, 107.6191];

const normalizeGeofenceType = (value) => {
  if (!value) return 'CIRCLE';
  return value.toString().toUpperCase();
};

const normalizeBounds = (bounds) => {
  if (!bounds || typeof bounds !== 'object') return null;
  const north = Number(bounds.north);
  const south = Number(bounds.south);
  const east = Number(bounds.east);
  const west = Number(bounds.west);
  if (![north, south, east, west].every(Number.isFinite)) return null;
  if (north === south || east === west) return null;
  return {
    north: Math.max(north, south),
    south: Math.min(north, south),
    east: Math.max(east, west),
    west: Math.min(east, west),
  };
};

const getBoundsCenter = (bounds) => {
  if (!bounds) return null;
  return {
    latitude: (bounds.north + bounds.south) / 2,
    longitude: (bounds.east + bounds.west) / 2,
  };
};

const boundsToLatLng = (bounds) => {
  if (!bounds) return null;
  return [
    [bounds.south, bounds.west],
    [bounds.north, bounds.east],
  ];
};

const boundsFromLatLngBounds = (bounds) => ({
  north: bounds.getNorth(),
  south: bounds.getSouth(),
  east: bounds.getEast(),
  west: bounds.getWest(),
});

const LocationPicker = ({ latitude, longitude, onPick }) => {
  useMapEvents({
    click: (event) => {
      onPick(event.latlng);
    },
  });

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return <Marker position={[latitude, longitude]} />;
};

const RectanglePicker = ({ enabled, onBoundsChange, onComplete }) => {
  const map = useMap();
  const startRef = useRef(null);
  const interactionStateRef = useRef(null);

  useEffect(() => {
    if (enabled) {
      if (!interactionStateRef.current) {
        interactionStateRef.current = {
          dragging: map.dragging.enabled(),
        };
      }
      if (map.dragging.enabled()) {
        map.dragging.disable();
      }
    } else if (interactionStateRef.current) {
      if (interactionStateRef.current.dragging) {
        map.dragging.enable();
      }
      interactionStateRef.current = null;
    }

    return () => {
      if (interactionStateRef.current?.dragging) {
        map.dragging.enable();
      }
      interactionStateRef.current = null;
    };
  }, [enabled, map]);

  useMapEvents({
    mousedown: (event) => {
      if (!enabled) return;
      startRef.current = event.latlng;
    },
    mousemove: (event) => {
      if (!enabled || !startRef.current) return;
      const nextBounds = L.latLngBounds(startRef.current, event.latlng);
      onBoundsChange(boundsFromLatLngBounds(nextBounds));
    },
    mouseup: (event) => {
      if (!enabled || !startRef.current) return;
      const nextBounds = L.latLngBounds(startRef.current, event.latlng);
      onBoundsChange(boundsFromLatLngBounds(nextBounds));
      startRef.current = null;
      if (onComplete) {
        onComplete();
      }
    },
    touchstart: (event) => {
      if (!enabled) return;
      startRef.current = event.latlng;
    },
    touchmove: (event) => {
      if (!enabled || !startRef.current) return;
      const nextBounds = L.latLngBounds(startRef.current, event.latlng);
      onBoundsChange(boundsFromLatLngBounds(nextBounds));
    },
    touchend: (event) => {
      if (!enabled || !startRef.current) return;
      const nextBounds = L.latLngBounds(startRef.current, event.latlng);
      onBoundsChange(boundsFromLatLngBounds(nextBounds));
      startRef.current = null;
      if (onComplete) {
        onComplete();
      }
    },
    mouseout: () => {
      if (!enabled || !startRef.current) return;
      startRef.current = null;
      if (onComplete) {
        onComplete();
      }
    },
  });

  useEffect(() => {
    if (!enabled && startRef.current) {
      startRef.current = null;
    }
  }, [enabled]);

  return null;
};

const MapFocus = ({ latitude, longitude, bounds, suspend }) => {
  const map = useMap();

  useEffect(() => {
    if (suspend) return;
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30], animate: true });
      return;
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    map.setView([latitude, longitude], map.getZoom(), { animate: true });
  }, [latitude, longitude, bounds, map, suspend]);

  return null;
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isDrawingRect, setIsDrawingRect] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
    radius: 200,
    geofence_type: 'CIRCLE',
    geofence_bounds: null,
    organization: 1
  });
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

  const fetchCustomers = async () => {
    try {
      const response = await api.get('customers/');
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (!showModal) {
      setIsDrawingRect(false);
    }
  }, [showModal]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => {
        setLocationError('Unable to retrieve your location. Please allow GPS access.');
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const geofenceType = normalizeGeofenceType(formData.geofence_type);
      const normalizedBounds = geofenceType === 'RECTANGLE'
        ? normalizeBounds(formData.geofence_bounds)
        : null;

      if (geofenceType === 'RECTANGLE' && !normalizedBounds) {
        alert('Please draw a rectangle on the map to set the geofence.');
        return;
      }

      const center = normalizedBounds ? getBoundsCenter(normalizedBounds) : null;
      const latitudeValue = geofenceType === 'RECTANGLE' && center
        ? center.latitude
        : (formData.latitude === '' ? null : Number(formData.latitude));
      const longitudeValue = geofenceType === 'RECTANGLE' && center
        ? center.longitude
        : (formData.longitude === '' ? null : Number(formData.longitude));

      const payload = {
        ...formData,
        geofence_type: geofenceType,
        geofence_bounds: normalizedBounds,
        latitude: latitudeValue,
        longitude: longitudeValue,
        radius: formData.radius === '' ? 200 : Number(formData.radius),
      };
      if (isEditing) {
        await api.patch(`customers/${formData.id}/`, payload);
      } else {
        await api.post('customers/', payload);
      }
      setShowModal(false);
      fetchCustomers();
      resetForm();
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Failed to save customer.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this customer?')) {
      try {
        await api.delete(`customers/${id}/`);
        fetchCustomers();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openEdit = (customer) => {
    setFormData({
      id: customer.id,
      name: customer.name || '',
      address: customer.address || '',
      phone: customer.phone || '',
      latitude: customer.latitude ?? '',
      longitude: customer.longitude ?? '',
      radius: customer.radius ?? 200,
      geofence_type: normalizeGeofenceType(customer.geofence_type),
      geofence_bounds: customer.geofence_bounds || null,
      organization: customer.organization || 1,
    });
    setLocating(false);
    setLocationError('');
    setIsDrawingRect(false);
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: '',
      address: '',
      phone: '',
      latitude: '',
      longitude: '',
      radius: 200,
      geofence_type: 'CIRCLE',
      geofence_bounds: null,
      organization: 1
    });
    setLocating(false);
    setLocationError('');
    setIsDrawingRect(false);
    setIsEditing(false);
  };

  const handleBoundsUpdate = (bounds) => {
    const normalized = normalizeBounds(bounds);
    if (!normalized) return;
    const center = getBoundsCenter(normalized);
    setFormData(prev => ({
      ...prev,
      geofence_bounds: normalized,
      latitude: center ? center.latitude.toFixed(6) : prev.latitude,
      longitude: center ? center.longitude.toFixed(6) : prev.longitude,
    }));
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const geofenceType = normalizeGeofenceType(formData.geofence_type);
  const normalizedBounds = normalizeBounds(formData.geofence_bounds);
  const rectangleBounds = geofenceType === 'RECTANGLE' ? boundsToLatLng(normalizedBounds) : null;
  const rectangleCenter = geofenceType === 'RECTANGLE' ? getBoundsCenter(normalizedBounds) : null;
  const latValue = formData.latitude === '' ? null : Number(formData.latitude);
  const lngValue = formData.longitude === '' ? null : Number(formData.longitude);
  const hasCircleCoords = Number.isFinite(latValue) && Number.isFinite(lngValue);
  const mapCenter = rectangleCenter
    ? [rectangleCenter.latitude, rectangleCenter.longitude]
    : (hasCircleCoords ? [latValue, lngValue] : DEFAULT_CENTER);
  const mapZoom = (hasCircleCoords || rectangleCenter) ? 13 : 11;
  const geofenceColor = '#f97316';

  return (
    <div className="p-6 h-full flex flex-col">
       <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Customer Management</h1>
          <HoverButton 
            icon={Plus} 
            hoverIcon={CirclePlus} 
            onClick={() => { resetForm(); setShowModal(true); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            Add Customer
          </HoverButton>
       </header>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search customers..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none text-sm"
                  value={search} onChange={e => setSearch(e.target.value)} />
             </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Address</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Phone</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Geofence</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <Building2 size={16} />
                       </div>
                       {c.name}
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">{c.address}</td>
                    <td className="p-4 text-slate-600">{c.phone}</td>
                    <td className="p-4 text-slate-600 text-sm">
                      {(() => {
                        const type = normalizeGeofenceType(c.geofence_type);
                        if (type === 'RECTANGLE') {
                          const bounds = normalizeBounds(c.geofence_bounds);
                          return bounds ? 'Rectangle' : '-';
                        }
                        return Number.isFinite(Number(c.latitude)) && Number.isFinite(Number(c.longitude))
                          ? `${c.radius || 200}m`
                          : '-';
                      })()}
                    </td>
                    <td className="p-4 text-right space-x-2 flex justify-end">
                       <HoverButton onClick={() => openEdit(c)} icon={Edit} hoverIcon={Edit2} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" />
                       <HoverButton onClick={() => handleDelete(c.id)} icon={Trash2} hoverIcon={Trash} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>

       {showModal && (
         <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="bg-white h-full w-full overflow-y-auto">
               <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
                  <h3 className="font-bold text-lg">{isEditing ? 'Edit Customer' : 'New Customer'}</h3>
                  <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400"/></button>
               </div>
               <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6 max-w-3xl mx-auto">
                  <div>
                     <label className="block text-sm font-medium mb-1">Company Name</label>
                     <input required type="text" className="w-full px-3 py-2 border rounded-lg"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">Address</label>
                     <textarea className="w-full px-3 py-2 border rounded-lg" rows="3"
                        value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input type="text" className="w-full px-3 py-2 border rounded-lg"
                       value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">Geofence Shape</label>
                     <select
                       className="w-full px-3 py-2 border rounded-lg bg-white"
                       value={geofenceType}
                       onChange={(e) => {
                         const nextType = e.target.value;
                         setFormData(prev => ({
                           ...prev,
                           geofence_type: nextType,
                           geofence_bounds: nextType === 'RECTANGLE' ? prev.geofence_bounds : null,
                         }));
                         setIsDrawingRect(false);
                       }}
                     >
                       <option value="CIRCLE">Circle</option>
                       <option value="RECTANGLE">Rectangle</option>
                     </select>
                     <p className="text-xs text-slate-400 mt-1">Use circle radius or draw a rectangle on the map.</p>
                  </div>
                  {geofenceType === 'CIRCLE' && (
                    <>
                      <div>
                         <label className="block text-sm font-medium mb-1">Radius (meters)</label>
                         <div className="flex items-center gap-3">
                           <input
                             type="range"
                             min="50"
                             max="2000"
                             step="25"
                             className="flex-1 accent-orange-500"
                             value={Number(formData.radius) || 200}
                             onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) })}
                           />
                           <input
                             type="number"
                             min="50"
                             step="25"
                             className="w-24 px-3 py-2 border rounded-lg text-right"
                             value={Number(formData.radius) || 200}
                             onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) })}
                           />
                         </div>
                         <p className="text-xs text-slate-400 mt-1">Drag the slider or type the size.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium mb-1">Latitude</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border rounded-lg"
                              value={formData.latitude}
                              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                              placeholder="-6.200000"
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Longitude</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border rounded-lg"
                              value={formData.longitude}
                              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                              placeholder="106.816666"
                            />
                         </div>
                      </div>
                    </>
                  )}
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                     <div className="px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase flex items-center justify-between gap-3">
                        <span>
                          {geofenceType === 'RECTANGLE'
                            ? 'Map Geofence (click draw then drag)'
                            : 'Map Location (click to set coordinates)'}
                        </span>
                        <div className="flex items-center gap-2">
                          {geofenceType === 'RECTANGLE' && (
                            <button
                              type="button"
                              onClick={() => setIsDrawingRect(true)}
                              className="text-xs bg-white border border-slate-300 px-2 py-1 rounded font-semibold hover:bg-slate-50 disabled:opacity-60"
                              disabled={isDrawingRect}
                            >
                              {isDrawingRect ? 'Drag to draw...' : 'Draw Rectangle'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleLocate}
                            className="text-xs bg-white border border-slate-300 px-2 py-1 rounded font-semibold hover:bg-slate-50"
                            disabled={locating}
                          >
                            {locating ? 'Locating...' : 'Use My Location'}
                          </button>
                        </div>
                     </div>
                     {locationError && (
                       <div className="px-4 py-2 text-xs text-rose-600 bg-rose-50 border-t border-rose-100">
                         {locationError}
                       </div>
                     )}
                     <div className="h-96">
                        <MapContainer
                          center={mapCenter}
                          zoom={mapZoom}
                          style={{ height: '100%', width: '100%' }}
                          scrollWheelZoom
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <MapFocus
                            latitude={latValue}
                            longitude={lngValue}
                            bounds={geofenceType === 'RECTANGLE' ? rectangleBounds : null}
                            suspend={isDrawingRect}
                          />
                          {geofenceType === 'CIRCLE' && (
                            <LocationPicker
                              latitude={latValue}
                              longitude={lngValue}
                              onPick={(latlng) => {
                                setFormData({
                                  ...formData,
                                  latitude: latlng.lat.toFixed(6),
                                  longitude: latlng.lng.toFixed(6),
                                });
                              }}
                            />
                          )}
                          {geofenceType === 'RECTANGLE' && (
                            <RectanglePicker
                              enabled={isDrawingRect}
                              onBoundsChange={handleBoundsUpdate}
                              onComplete={() => setIsDrawingRect(false)}
                            />
                          )}
                          {geofenceType === 'CIRCLE' && hasCircleCoords && (
                            <Circle
                              center={[latValue, lngValue]}
                              radius={Number(formData.radius) || 200}
                              pathOptions={{ color: geofenceColor, fillColor: geofenceColor, fillOpacity: 0.15 }}
                            />
                          )}
                          {geofenceType === 'RECTANGLE' && rectangleBounds && (
                            <Rectangle
                              bounds={rectangleBounds}
                              pathOptions={{ color: geofenceColor, fillColor: geofenceColor, fillOpacity: 0.15 }}
                            />
                          )}
                        </MapContainer>
                     </div>
                  </div>
                  <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium">Save</button>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

export default Customers;

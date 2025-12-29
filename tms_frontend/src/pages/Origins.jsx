import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Plus, CirclePlus, X, Search, Trash2, Trash, Edit, Edit2, ExternalLink } from 'lucide-react';

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

const LocationPicker = ({ latitude, longitude, onPick }) => {
  useMapEvents({
    click: (event) => {
      onPick(event.latlng);
    },
  });

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return <Marker position={[latitude, longitude]} />;
};

const MapFocus = ({ latitude, longitude, skipNextRef }) => {
  const map = useMap();

  useEffect(() => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (skipNextRef?.current) {
      skipNextRef.current = false;
      return;
    }
    map.setView([latitude, longitude], map.getZoom(), { animate: true });
  }, [latitude, longitude, map]);

  return null;
};

const Origins = () => {
  const [origins, setOrigins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [search, setSearch] = useState('');
  const skipNextFocusRef = useRef(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: 200,
    is_origin: true,
    organization: 1,
  });

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

  const fetchOrigins = async () => {
    try {
      const response = await api.get('origins/');
      setOrigins(response.data || []);
    } catch (error) {
      console.error('Error fetching origins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrigins();
  }, []);

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

  const resetForm = () => {
    setFormData({
      id: null,
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      radius: 200,
      is_origin: true,
      organization: 1,
    });
    setLocating(false);
    setLocationError('');
    setIsEditing(false);
  };

  const openEdit = (origin) => {
    setFormData({
      id: origin.id,
      name: origin.name || '',
      address: origin.address || '',
      latitude: origin.latitude ?? '',
      longitude: origin.longitude ?? '',
      radius: origin.radius ?? 200,
      is_origin: origin.is_origin !== false,
      organization: origin.organization || 1,
    });
    setLocating(false);
    setLocationError('');
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...formData,
        latitude: formData.latitude === '' ? null : Number(formData.latitude),
        longitude: formData.longitude === '' ? null : Number(formData.longitude),
        radius: formData.radius === '' ? 200 : Number(formData.radius),
      };
      if (isEditing) {
        await api.patch(`origins/${formData.id}/`, payload);
      } else {
        await api.post('origins/', payload);
      }
      setShowModal(false);
      fetchOrigins();
      resetForm();
    } catch (error) {
      console.error('Error saving origin:', error);
      alert('Failed to save origin.');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this origin?')) {
      try {
        await api.delete(`origins/${id}/`);
        fetchOrigins();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openInMaps = (origin) => {
    if (!origin.latitude || !origin.longitude) return;
    const query = `${origin.latitude},${origin.longitude}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const filtered = origins.filter((o) =>
    (o.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.address || '').toLowerCase().includes(search.toLowerCase())
  );

  const latValue = formData.latitude === '' ? null : Number(formData.latitude);
  const lngValue = formData.longitude === '' ? null : Number(formData.longitude);
  const hasCoords = Number.isFinite(latValue) && Number.isFinite(lngValue);
  const mapCenter = hasCoords ? [latValue, lngValue] : DEFAULT_CENTER;
  const geofenceColor = formData.is_origin ? '#16a34a' : '#f97316';

  return (
    <div className="p-6 h-full flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Origin Master</h1>
        <HoverButton
          icon={Plus}
          hoverIcon={CirclePlus}
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm group transition-all"
        >
          Add Origin
        </HoverButton>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search origins..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none text-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Origin</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Address</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-slate-500">Loading...</td>
                </tr>
              ) : (
                filtered.map((origin) => (
                  <tr key={origin.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">{origin.name}</td>
                    <td className="p-4 text-slate-600">{origin.address || '-'}</td>
                    <td className="p-4 text-slate-600 text-sm">
                      {origin.is_origin === false ? 'Drop' : 'Origin'}
                    </td>
                    <td className="p-4 text-right space-x-2 flex justify-end">
                      <HoverButton
                        onClick={() => openInMaps(origin)}
                        icon={MapPin}
                        hoverIcon={ExternalLink}
                        className={`text-emerald-600 hover:bg-emerald-50 p-1.5 rounded transition-colors ${origin.latitude && origin.longitude ? '' : 'opacity-40 cursor-not-allowed'}`}
                      />
                      <HoverButton onClick={() => openEdit(origin)} icon={Edit} hoverIcon={Edit2} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" />
                      <HoverButton onClick={() => handleDelete(origin.id)} icon={Trash2} hoverIcon={Trash} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{isEditing ? 'Edit Origin' : 'New Origin'}</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={20} className="text-slate-400 hover:text-red-500 transition-colors" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Origin Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.address}
                    onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location Type</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    value={formData.is_origin ? 'origin' : 'drop'}
                    onChange={(event) =>
                      setFormData({ ...formData, is_origin: event.target.value === 'origin' })
                    }
                  >
                    <option value="origin">Origin (Pickup)</option>
                    <option value="drop">Drop (Customer)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Radius (meters)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="50"
                      max="2000"
                      step="25"
                      className="flex-1"
                      style={{ accentColor: geofenceColor }}
                      value={Number(formData.radius) || 200}
                      onChange={(event) => setFormData({ ...formData, radius: Number(event.target.value) })}
                    />
                    <input
                      type="number"
                      min="50"
                      step="25"
                      className="w-24 px-3 py-2 border rounded-lg text-right focus:ring-2 focus:ring-blue-500 outline-none"
                      value={Number(formData.radius) || 200}
                      onChange={(event) => setFormData({ ...formData, radius: Number(event.target.value) })}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Drag the slider or type the size.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitude</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.latitude}
                    onChange={(event) => setFormData({ ...formData, latitude: event.target.value })}
                    placeholder="-6.200000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.longitude}
                    onChange={(event) => setFormData({ ...formData, longitude: event.target.value })}
                    placeholder="106.816666"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase flex items-center justify-between gap-3">
                  <span>Map Location (click to set coordinates)</span>
                  <button
                    type="button"
                    onClick={handleLocate}
                    className="text-xs bg-white border border-slate-300 px-2 py-1 rounded font-semibold hover:bg-slate-50"
                    disabled={locating}
                  >
                    {locating ? 'Locating...' : 'Use My Location'}
                  </button>
                </div>
                {locationError && (
                  <div className="px-4 py-2 text-xs text-rose-600 bg-rose-50 border-t border-rose-100">
                    {locationError}
                  </div>
                )}
                <div className="h-96">
                  <MapContainer
                    center={mapCenter}
                    zoom={hasCoords ? 13 : 11}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapFocus latitude={latValue} longitude={lngValue} skipNextRef={skipNextFocusRef} />
                    <LocationPicker
                      latitude={latValue}
                      longitude={lngValue}
                      onPick={(latlng) => {
                        skipNextFocusRef.current = true;
                        setFormData({
                          ...formData,
                          latitude: latlng.lat.toFixed(6),
                          longitude: latlng.lng.toFixed(6),
                        });
                      }}
                    />
                    {hasCoords && (
                      <Circle
                        center={[latValue, lngValue]}
                        radius={Number(formData.radius) || 200}
                        pathOptions={{ color: geofenceColor, fillColor: geofenceColor, fillOpacity: 0.15 }}
                      />
                    )}
                  </MapContainer>
                </div>
              </div>

              <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md">
                Save Origin
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Origins;

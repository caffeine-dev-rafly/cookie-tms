import { useState } from "react";
import type { Alert, Document } from "../types";

interface ComplianceViewProps {
  documents: Document[];
  alerts: Alert[];
  onUpload: (doc: Omit<Document, "id" | "uploadedAt" | "status">) => void;
  onDeleteDoc: (id: string) => void;
  onDeleteAlert: (id: string) => void;
}

export default function ComplianceView({ documents, alerts, onUpload, onDeleteDoc, onDeleteAlert }: ComplianceViewProps) {
  const [type, setType] = useState<Document["type"]>("BOL");
  const [relatedId, setRelatedId] = useState("");
  const [uploadedBy, setUploadedBy] = useState("Ops");
  const [url, setUrl] = useState("#");

  const handleUpload = () => {
    if (!relatedId) return;
    onUpload({ type, relatedId, uploadedBy, url });
    setRelatedId("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl shadow-card border border-matcha-50 p-5 space-y-3">
        <h3 className="font-bold text-base text-matcha-900">Documents & Compliance</h3>
        <div className="grid grid-cols-2 gap-2">
          <select
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as Document["type"])}
          >
            <option value="BOL">BOL</option>
            <option value="POD">POD</option>
            <option value="Invoice">Invoice</option>
            <option value="Inspection">Inspection</option>
            <option value="License">License</option>
          </select>
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Related ID (Order/Shipment)"
            value={relatedId}
            onChange={(e) => setRelatedId(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="Uploaded By"
            value={uploadedBy}
            onChange={(e) => setUploadedBy(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-gray-50 border rounded-lg text-sm"
            placeholder="URL / reference"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={handleUpload}
            className="col-span-2 bg-matcha-600 text-white font-bold py-2 rounded-lg text-sm"
          >
            Upload / Record
          </button>
        </div>
        <div className="divide-y divide-matcha-50">
          {documents.map((doc) => (
            <div key={doc.id} className="py-2 text-sm flex justify-between items-center">
              <div>
                <p className="font-bold text-matcha-900">
                  {doc.type} — {doc.relatedId}
                </p>
                <p className="text-[11px] text-gray-500">By {doc.uploadedBy} on {doc.uploadedAt}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-matcha-50 text-matcha-700 px-2 py-1 rounded">
                  {doc.status ?? "Pending"}
                </span>
                <button
                  onClick={() => onDeleteDoc(doc.id)}
                  className="text-[11px] text-red-600 font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-matcha-50 p-5 space-y-3">
        <h3 className="font-bold text-base text-matcha-900">Alerts & Exceptions</h3>
        <div className="divide-y divide-matcha-50">
          {alerts.map((alert) => (
            <div key={alert.id} className="py-2 text-sm">
              <div className="flex justify-between">
                <span className="font-bold text-matcha-900">{alert.message}</span>
                <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-1 rounded">
                  {alert.type}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                {alert.shipmentId ? `Shipment ${alert.shipmentId}` : "General"} • {alert.createdAt}
              </p>
              <button
                onClick={() => onDeleteAlert(alert.id)}
                className="text-[11px] text-red-600 font-bold"
              >
                Delete
              </button>
            </div>
          ))}
          {alerts.length === 0 && <p className="text-xs text-gray-500">No alerts.</p>}
        </div>
      </div>
    </div>
  );
}

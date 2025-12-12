import { useState } from "react";
import type { MaintenanceTask } from "../types";

interface MaintenanceViewProps {
  tasks: MaintenanceTask[];
  onCreate: (task: Omit<MaintenanceTask, "id" | "status">) => void;
  onDelete: (id: string) => void;
}

export default function MaintenanceView({ tasks, onCreate, onDelete }: MaintenanceViewProps) {
  const [title, setTitle] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [priority, setPriority] = useState<"Low" | "Med" | "High">("Med");
  const [dueDate, setDueDate] = useState("");

  const handleCreate = () => {
    if (!title) return;
    onCreate({ title, vehicleId: vehicleId || undefined, priority, dueDate });
    setTitle("");
    setVehicleId("");
    setPriority("Med");
    setDueDate("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-white rounded-2xl p-4 shadow-card border border-matcha-50 space-y-2">
        <h4 className="font-bold text-matcha-900 text-sm">New Task</h4>
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 rounded-lg border text-xs"
        />
        <input
          type="text"
          placeholder="Vehicle (optional)"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 rounded-lg border text-xs"
        />
        <div className="flex gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as "Low" | "Med" | "High")}
            className="w-full px-3 py-2 bg-gray-50 rounded-lg border text-xs"
          >
            <option value="Low">Low</option>
            <option value="Med">Med</option>
            <option value="High">High</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 rounded-lg border text-xs"
          />
        </div>
        <button
          onClick={handleCreate}
          className="w-full bg-matcha-600 text-white font-bold py-2 rounded-lg text-xs mt-1"
        >
          Add Task
        </button>
      </div>

      <div className="md:col-span-2 bg-gray-50 rounded-2xl p-3">
        <h4 className="font-bold text-matcha-900 mb-3 px-2 text-sm">To Do</h4>
        {tasks.length === 0 && <p className="text-xs text-gray-500 px-2">No open tasks.</p>}
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-xl p-3 border border-matcha-100 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-matcha-900">{task.title}</span>
                  <span className="text-[11px] text-gray-500">
                    {task.vehicleId ? `Vehicle ${task.vehicleId}` : "General"}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-orange-600">{task.priority ?? "Med"}</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                Status: {task.status} {task.dueDate ? `| Due ${task.dueDate}` : ""}
              </div>
              <button
                onClick={() => onDelete(task.id)}
                className="mt-2 text-[11px] text-red-600 font-bold"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

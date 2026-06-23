'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Truck, Package, Hash } from 'lucide-react';
import { toast } from 'sonner';

interface TruckRecord {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  capacityCuYd: number;
  active: boolean;
  color: string;
}

const INITIAL_TRUCKS: TruckRecord[] = [
  { id: '1', name: 'Truck 1', make: 'Ford', model: 'F-650', year: 2020, licensePlate: 'HAULR-01', capacityCuYd: 12, active: true, color: '#f97316' },
  { id: '2', name: 'Truck 2', make: 'RAM', model: '5500', year: 2019, licensePlate: 'HAULR-02', capacityCuYd: 10, active: true, color: '#3b82f6' },
];

const TRUCK_COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];

const EMPTY_TRUCK: Omit<TruckRecord, 'id'> = {
  name: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  licensePlate: '',
  capacityCuYd: 10,
  active: true,
  color: '#f97316',
};

export function TruckManager() {
  const [trucks, setTrucks] = useState<TruckRecord[]>(INITIAL_TRUCKS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [editForm, setEditForm] = useState<Omit<TruckRecord, 'id'>>(EMPTY_TRUCK);
  const [newForm, setNewForm] = useState<Omit<TruckRecord, 'id'>>(EMPTY_TRUCK);

  const startEdit = (truck: TruckRecord) => {
    setEditingId(truck.id);
    const { id, ...rest } = truck;
    setEditForm(rest);
    setAddingNew(false);
  };

  const saveEdit = () => {
    if (!editForm.name.trim()) { toast.error('Truck name is required'); return; }
    setTrucks(trucks.map((t) => (t.id === editingId ? { ...t, ...editForm } : t)));
    setEditingId(null);
    toast.success('Truck updated');
  };

  const saveNew = () => {
    if (!newForm.name.trim()) { toast.error('Truck name is required'); return; }
    setTrucks([...trucks, { ...newForm, id: Date.now().toString() }]);
    setAddingNew(false);
    setNewForm(EMPTY_TRUCK);
    toast.success('Truck added');
  };

  const deleteTruck = (id: string) => {
    setTrucks(trucks.filter((t) => t.id !== id));
    toast.success('Truck removed');
  };

  const TruckForm = ({ form, onChange, onSave, onCancel }: {
    form: Omit<TruckRecord, 'id'>;
    onChange: (f: Omit<TruckRecord, 'id'>) => void;
    onSave: () => void;
    onCancel: () => void;
  }) => (
    <div className="bg-gray-800/70 border border-orange-500/30 rounded-xl p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">Truck Name / Label *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="e.g. Truck 3"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">License Plate</label>
          <input
            type="text"
            value={form.licensePlate}
            onChange={(e) => onChange({ ...form, licensePlate: e.target.value })}
            placeholder="HAULR-03"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">Make</label>
          <input
            type="text"
            value={form.make}
            onChange={(e) => onChange({ ...form, make: e.target.value })}
            placeholder="Ford"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">Model</label>
          <input
            type="text"
            value={form.model}
            onChange={(e) => onChange({ ...form, model: e.target.value })}
            placeholder="F-650"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">Year</label>
          <input
            type="number"
            value={form.year}
            onChange={(e) => onChange({ ...form, year: Number(e.target.value) })}
            min={2000}
            max={new Date().getFullYear() + 1}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">Capacity (Cu Yd)</label>
          <div className="relative">
            <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="number"
              value={form.capacityCuYd}
              onChange={(e) => onChange({ ...form, capacityCuYd: Number(e.target.value) })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-7 pr-10 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">yd</span>
          </div>
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="text-gray-500 text-xs block mb-2">Truck Color (for calendar)</label>
        <div className="flex items-center gap-2">
          {TRUCK_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onChange({ ...form, color })}
              className={`w-7 h-7 rounded-full transition-all ${form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : 'hover:scale-110'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Status toggle */}
      <div className="flex items-center gap-3">
        <label className="text-gray-400 text-sm">Status:</label>
        <button
          onClick={() => onChange({ ...form, active: !form.active })}
          className={`relative w-11 h-6 rounded-full transition-colors ${form.active ? 'bg-orange-500' : 'bg-gray-700'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
        <span className={`text-sm ${form.active ? 'text-emerald-400' : 'text-gray-500'}`}>
          {form.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Save Truck
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );

  const totalCapacity = trucks.filter((t) => t.active).reduce((sum, t) => sum + t.capacityCuYd, 0);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <span className="text-gray-400 text-sm">
            <span className="text-white font-semibold">{trucks.filter((t) => t.active).length}</span> active trucks
          </span>
          <span className="text-gray-400 text-sm">
            <span className="text-orange-400 font-semibold">{totalCapacity}</span> cu yd total capacity
          </span>
        </div>
        <button
          onClick={() => { setAddingNew(true); setEditingId(null); setNewForm(EMPTY_TRUCK); }}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Truck
        </button>
      </div>

      {/* Add new form */}
      {addingNew && (
        <TruckForm
          form={newForm}
          onChange={setNewForm}
          onSave={saveNew}
          onCancel={() => setAddingNew(false)}
        />
      )}

      {/* Truck list */}
      <div className="space-y-2">
        {trucks.map((truck) => (
          <div key={truck.id}>
            {editingId === truck.id ? (
              <TruckForm
                form={editForm}
                onChange={setEditForm}
                onSave={saveEdit}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                className={`flex items-center gap-4 bg-gray-800/50 border rounded-xl p-4 transition-all ${
                  truck.active ? 'border-gray-700/50' : 'border-gray-800 opacity-60'
                }`}
              >
                {/* Truck icon with color */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${truck.color}25` }}
                >
                  <Truck className="w-5 h-5" style={{ color: truck.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-100 font-medium text-sm">{truck.name}</span>
                    {!truck.active && (
                      <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                    <span className="text-gray-500 text-xs">
                      {truck.year} {truck.make} {truck.model}
                    </span>
                    {truck.licensePlate && (
                      <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3 text-gray-600" />
                        <span className="text-gray-500 text-xs">{truck.licensePlate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Capacity */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <Package className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-orange-400 font-semibold text-sm">{truck.capacityCuYd}</span>
                    <span className="text-gray-500 text-xs">cu yd</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(truck)}
                    className="text-gray-600 hover:text-blue-400 p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTruck(truck.id)}
                    className="text-gray-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {trucks.length === 0 && !addingNew && (
        <div className="text-center py-12 text-gray-600">
          <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No trucks yet. Add your first truck above.</p>
        </div>
      )}
    </div>
  );
}

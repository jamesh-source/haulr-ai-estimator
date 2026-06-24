'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Building2,
  DollarSign,
  Dumbbell,
  Sparkles,
  Users,
  Bell,
  Upload,
  Plus,
  Trash2,
  Save,
  Edit2,
  X,
  Phone,
  Mail,
  Globe,
  MapPin,
  Check,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PricingConfig } from '@/components/settings/PricingConfig';
import { CrewManager } from '@/components/settings/CrewManager';
import { TruckManager } from '@/components/settings/TruckManager';

// ─── Tab definitions ────────────────────────────────────────────────────────────

type TabId = 'company' | 'pricing' | 'heavy' | 'specialty' | 'crew' | 'notifications';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'company', label: 'Company Info', icon: <Building2 className="w-4 h-4" /> },
  { id: 'pricing', label: 'Pricing', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'heavy', label: 'Heavy Items', icon: <Dumbbell className="w-4 h-4" /> },
  { id: 'specialty', label: 'Specialty Fees', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'crew', label: 'Crew & Trucks', icon: <Users className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
];

// ─── Heavy Items ────────────────────────────────────────────────────────────────

interface HeavyItem {
  id: string;
  name: string;
  defaultPrice: number;
  weight: string;
  editing?: boolean;
}

const DEFAULT_HEAVY_ITEMS: HeavyItem[] = [
  { id: '1', name: 'Piano (Upright)', defaultPrice: 150, weight: '400-600 lbs' },
  { id: '2', name: 'Piano (Grand)', defaultPrice: 250, weight: '600-1200 lbs' },
  { id: '3', name: 'Safe', defaultPrice: 125, weight: '200-500 lbs' },
  { id: '4', name: 'Hot Tub', defaultPrice: 350, weight: '500-900 lbs' },
  { id: '5', name: 'Refrigerator', defaultPrice: 75, weight: '200-400 lbs' },
  { id: '6', name: 'Washer/Dryer Set', defaultPrice: 80, weight: '150-300 lbs' },
  { id: '7', name: 'Treadmill', defaultPrice: 100, weight: '200-350 lbs' },
  { id: '8', name: 'Weight Set', defaultPrice: 90, weight: '100-500 lbs' },
  { id: '9', name: 'Pool Table', defaultPrice: 200, weight: '400-800 lbs' },
  { id: '10', name: 'Riding Mower', defaultPrice: 120, weight: '300-600 lbs' },
];

// ─── Specialty Fees ─────────────────────────────────────────────────────────────

interface SpecialtyFee {
  id: string;
  name: string;
  price: number;
  unit: string;
  description: string;
}

const DEFAULT_SPECIALTY_FEES: SpecialtyFee[] = [
  { id: '1', name: 'Hazmat Disposal', price: 75, unit: 'per item', description: 'Paint, chemicals, batteries' },
  { id: '2', name: 'E-Waste Fee', price: 25, unit: 'per item', description: 'TVs, monitors, computers' },
  { id: '3', name: 'Mattress Disposal', price: 40, unit: 'per unit', description: 'Bed frame + mattress set' },
  { id: '4', name: 'Tire Disposal', price: 15, unit: 'per tire', description: 'Car/truck tires' },
  { id: '5', name: 'Concrete/Brick', price: 25, unit: 'per cu yd', description: 'Heavy masonry materials' },
  { id: '6', name: 'Soil/Dirt', price: 20, unit: 'per cu yd', description: 'Excavated or fill dirt' },
  { id: '7', name: 'After-Hours Rush', price: 100, unit: 'flat fee', description: 'Jobs starting after 6pm' },
  { id: '8', name: 'Same-Day Service', price: 75, unit: 'flat fee', description: 'Booked same day' },
];

// ─── Company Tab ─────────────────────────────────────────────────────────────────

function CompanyTab() {
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          setCompanyName(data.company_name ?? '');
          setAddress(data.address ?? '');
          setCity(data.city ?? '');
          setState(data.state ?? '');
          setZip(data.zip ?? '');
          setPhone(data.phone ?? '');
          setEmail(data.email ?? '');
          setWebsite(data.website ?? '');
          if (data.logo_url) setLogoPreview(data.logo_url);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Logo must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName, address, city, state, zip, phone, email, website }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Company info saved');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Logo upload */}
      <div>
        <h3 className="text-gray-200 font-semibold text-sm mb-4">Company Logo</h3>
        <div className="flex items-center gap-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 bg-gray-800 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-gray-800/70 transition-all group overflow-hidden"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-gray-600 group-hover:text-orange-400 transition-colors" />
                <span className="text-gray-600 text-xs mt-1 group-hover:text-orange-400 transition-colors">Upload</span>
              </>
            )}
          </div>
          <div>
            <p className="text-gray-300 text-sm font-medium">Business Logo</p>
            <p className="text-gray-500 text-xs mt-0.5">PNG, JPG or SVG. Max 5MB.</p>
            <p className="text-gray-500 text-xs">Recommended: 512x512px or larger</p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-orange-400 hover:text-orange-300 text-xs font-medium transition-colors"
              >
                Choose File
              </button>
              {logoPreview && (
                <button
                  onClick={() => setLogoPreview(null)}
                  className="text-gray-600 hover:text-red-400 text-xs transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="text-gray-500 text-xs font-medium block mb-1.5 uppercase tracking-wider">Company Name</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
            />
          </div>
        </div>
        <div>
          <label className="text-gray-500 text-xs font-medium block mb-1.5 uppercase tracking-wider">Street Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1.5 uppercase tracking-wider">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Dallas"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1.5 uppercase tracking-wider">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="TX"
              maxLength={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1.5 uppercase tracking-wider">ZIP</label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="75001"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1.5 uppercase tracking-wider">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
              />
            </div>
          </div>
          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1.5 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="text-gray-500 text-xs font-medium block mb-1.5 uppercase tracking-wider">Website</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
          ) : (
            <><Save className="w-4 h-4" />Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Heavy Items Tab ──────────────────────────────────────────────────────────────

function HeavyItemsTab() {
  const [items, setItems] = useState<HeavyItem[]>(DEFAULT_HEAVY_ITEMS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<HeavyItem>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', defaultPrice: 0, weight: '' });
  const [saving, setSaving] = useState(false);

  const saveEdit = (id: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...editValues } : item)));
    setEditingId(null);
    setEditValues({});
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const addItem = () => {
    if (!newItem.name.trim()) { toast.error('Item name required'); return; }
    setItems([...items, { ...newItem, id: Date.now().toString() }]);
    setNewItem({ name: '', defaultPrice: 0, weight: '' });
    setAddingNew(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const heavy_item_prices: Record<string, number> = {};
      items.forEach((item) => { heavy_item_prices[item.name] = item.defaultPrice; });
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricing: { heavy_item_prices, load_prices: {}, distance_brackets: [{ min_miles: 0, max_miles: 9999, charge: 0 }], labor_rate: 45, stair_fees: { per_flight: 25, max_flights: 5 }, difficulty_multipliers: { easy: 1.0, moderate: 1.15, hard: 1.3, extreme: 1.5 }, specialty_fees: {}, dump_base_fee: 26.5, dump_per_yard: 11 } }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Heavy items saved');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-500 text-sm">Default prices for heavy items that require extra labor.</p>
        <button
          onClick={() => setAddingNew(true)}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {addingNew && (
        <div className="bg-gray-800/70 border border-orange-500/30 rounded-xl p-4">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-gray-500 text-xs block mb-1">Item Name *</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g. Elliptical Machine"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs block mb-1">Default Price ($)</label>
              <input
                type="number"
                value={newItem.defaultPrice}
                onChange={(e) => setNewItem({ ...newItem, defaultPrice: Number(e.target.value) })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs block mb-1">Est. Weight</label>
              <input
                type="text"
                value={newItem.weight}
                onChange={(e) => setNewItem({ ...newItem, weight: e.target.value })}
                placeholder="200-400 lbs"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" />Add
            </button>
            <button onClick={() => setAddingNew(false)} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">
              <X className="w-3.5 h-3.5" />Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-500 font-medium text-xs pb-3 pr-4">Item Name</th>
              <th className="text-left text-gray-500 font-medium text-xs pb-3 pr-4">Est. Weight</th>
              <th className="text-left text-gray-500 font-medium text-xs pb-3 pr-4">Default Price</th>
              <th className="text-left text-gray-500 font-medium text-xs pb-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-800/20 transition-colors">
                <td className="py-3 pr-4">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editValues.name ?? item.name}
                      onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-200 text-sm focus:outline-none focus:border-orange-500 w-full"
                    />
                  ) : (
                    <span className="text-gray-200 text-sm">{item.name}</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editValues.weight ?? item.weight}
                      onChange={(e) => setEditValues({ ...editValues, weight: e.target.value })}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-200 text-sm focus:outline-none focus:border-orange-500 w-36"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">{item.weight}</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {editingId === item.id ? (
                    <div className="relative w-28">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input
                        type="number"
                        value={editValues.defaultPrice ?? item.defaultPrice}
                        onChange={(e) => setEditValues({ ...editValues, defaultPrice: Number(e.target.value) })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-6 pr-2 py-1.5 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  ) : (
                    <span className="text-emerald-400 font-medium text-sm">${item.defaultPrice}</span>
                  )}
                </td>
                <td className="py-3">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => saveEdit(item.id)} className="text-emerald-400 hover:text-emerald-300 p-1 rounded transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingId(null); setEditValues({}); }} className="text-gray-500 hover:text-gray-300 p-1 rounded transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingId(item.id); setEditValues(item); }} className="text-gray-600 hover:text-blue-400 p-1 rounded transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="text-gray-600 hover:text-red-400 p-1 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-800">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
        >
          {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Heavy Items</>}
        </button>
      </div>
    </div>
  );
}

// ─── Specialty Fees Tab ───────────────────────────────────────────────────────────

function SpecialtyFeesTab() {
  const [fees, setFees] = useState<SpecialtyFee[]>(DEFAULT_SPECIALTY_FEES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<SpecialtyFee>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newFee, setNewFee] = useState({ name: '', price: 0, unit: 'flat fee', description: '' });
  const [saving, setSaving] = useState(false);

  const saveFee = () => {
    if (!newFee.name.trim()) { toast.error('Fee name required'); return; }
    setFees([...fees, { ...newFee, id: Date.now().toString() }]);
    setNewFee({ name: '', price: 0, unit: 'flat fee', description: '' });
    setAddingNew(false);
  };

  const saveEdit = (id: string) => {
    setFees(fees.map((f) => (f.id === id ? { ...f, ...editValues } : f)));
    setEditingId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const specialty_fees: Record<string, number> = {};
      fees.forEach((f) => { specialty_fees[f.name] = f.price; });
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricing: { specialty_fees, load_prices: {}, distance_brackets: [{ min_miles: 0, max_miles: 9999, charge: 0 }], labor_rate: 45, stair_fees: { per_flight: 25, max_flights: 5 }, heavy_item_prices: {}, difficulty_multipliers: { easy: 1.0, moderate: 1.15, hard: 1.3, extreme: 1.5 }, dump_base_fee: 26.5, dump_per_yard: 11 } }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Specialty fees saved');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const UNIT_OPTIONS = ['flat fee', 'per item', 'per unit', 'per cu yd', 'per tire', 'per bag'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-500 text-sm">Additional fees for specialty disposal and services.</p>
        <button
          onClick={() => setAddingNew(true)}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Fee
        </button>
      </div>

      {addingNew && (
        <div className="bg-gray-800/70 border border-orange-500/30 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-gray-500 text-xs block mb-1">Fee Name *</label>
              <input
                type="text"
                value={newFee.name}
                onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
                placeholder="e.g. Freon Appliance"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs block mb-1">Description</label>
              <input
                type="text"
                value={newFee.description}
                onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                placeholder="Brief description"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs block mb-1">Price ($)</label>
              <input
                type="number"
                value={newFee.price}
                onChange={(e) => setNewFee({ ...newFee, price: Number(e.target.value) })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs block mb-1">Unit</label>
              <select
                value={newFee.unit}
                onChange={(e) => setNewFee({ ...newFee, unit: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
              >
                {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveFee} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" />Add
            </button>
            <button onClick={() => setAddingNew(false)} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">
              <X className="w-3.5 h-3.5" />Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {fees.map((fee) => (
          <div key={fee.id} className="flex items-center gap-4 bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            {editingId === fee.id ? (
              <div className="flex-1 grid grid-cols-4 gap-3">
                <input
                  type="text"
                  value={editValues.name ?? fee.name}
                  onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
                />
                <input
                  type="text"
                  value={editValues.description ?? fee.description}
                  onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
                />
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="number"
                    value={editValues.price ?? fee.price}
                    onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-6 pr-2 py-1.5 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <select
                  value={editValues.unit ?? fee.unit}
                  onChange={(e) => setEditValues({ ...editValues, unit: e.target.value })}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
                >
                  {['flat fee', 'per item', 'per unit', 'per cu yd', 'per tire', 'per bag'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-200 font-medium text-sm">{fee.name}</span>
                  </div>
                  {fee.description && <p className="text-gray-500 text-xs mt-0.5">{fee.description}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-emerald-400 font-bold text-sm">${fee.price}</span>
                  <span className="text-gray-500 text-xs ml-1">{fee.unit}</span>
                </div>
              </>
            )}

            <div className="flex items-center gap-1 flex-shrink-0">
              {editingId === fee.id ? (
                <>
                  <button onClick={() => saveEdit(fee.id)} className="text-emerald-400 hover:text-emerald-300 p-1 rounded transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300 p-1 rounded transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditingId(fee.id); setEditValues(fee); }} className="text-gray-600 hover:text-blue-400 p-1 rounded transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setFees(fees.filter((f) => f.id !== fee.id))} className="text-gray-600 hover:text-red-400 p-1 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-800">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
        >
          {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Specialty Fees</>}
        </button>
      </div>
    </div>
  );
}

// ─── Crew & Trucks Tab ────────────────────────────────────────────────────────────

function CrewTrucksTab() {
  const [subTab, setSubTab] = useState<'crew' | 'trucks'>('crew');
  return (
    <div>
      <div className="flex items-center gap-2 mb-6 bg-gray-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setSubTab('crew')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${subTab === 'crew' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Crew Members
        </button>
        <button
          onClick={() => setSubTab('trucks')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${subTab === 'trucks' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Trucks
        </button>
      </div>
      {subTab === 'crew' ? <CrewManager /> : <TruckManager />}
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────────

interface NotifToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  channel: 'sms' | 'email' | 'both';
}

function NotificationsTab() {
  const [smsNumber, setSmsNumber] = useState('(555) 123-4567');
  const [notifEmail, setNotifEmail] = useState('alerts@haulr.com');
  const [saving, setSaving] = useState(false);
  const [notifs, setNotifs] = useState<NotifToggle[]>([
    { id: '1', label: 'New Job Booked', description: 'Alert when a new job is created', enabled: true, channel: 'both' },
    { id: '2', label: 'Estimate Sent', description: 'When an estimate is emailed to a customer', enabled: true, channel: 'email' },
    { id: '3', label: 'Job Completed', description: 'When crew marks a job as done', enabled: true, channel: 'both' },
    { id: '4', label: 'Payment Received', description: 'When a payment is processed', enabled: true, channel: 'email' },
    { id: '5', label: 'Job Cancelled', description: 'When a scheduled job is cancelled', enabled: true, channel: 'sms' },
    { id: '6', label: 'Customer Review', description: 'When a review is submitted', enabled: false, channel: 'email' },
    { id: '7', label: 'Daily Summary', description: 'End-of-day revenue and job summary', enabled: true, channel: 'email' },
    { id: '8', label: 'Weekly Report', description: 'Weekly analytics digest', enabled: false, channel: 'email' },
    { id: '9', label: 'Crew Schedule Reminder', description: '24hr reminder before scheduled jobs', enabled: true, channel: 'sms' },
  ]);

  const toggleNotif = (id: string) => {
    setNotifs(notifs.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: smsNumber, email: notifEmail }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Notification settings saved');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const CHANNEL_COLORS: Record<string, string> = {
    sms: 'bg-blue-500/20 text-blue-400',
    email: 'bg-purple-500/20 text-purple-400',
    both: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Contact info */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 space-y-4">
        <h3 className="text-gray-200 font-semibold text-sm">Notification Destinations</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1.5 uppercase tracking-wider">SMS Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="tel"
                value={smsNumber}
                onChange={(e) => setSmsNumber(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
              />
            </div>
          </div>
          <div>
            <label className="text-gray-500 text-xs font-medium block mb-1.5 uppercase tracking-wider">Notification Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={notifEmail}
                onChange={(e) => setNotifEmail(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notification toggles */}
      <div>
        <h3 className="text-gray-200 font-semibold text-sm mb-4">Alert Preferences</h3>
        <div className="space-y-2">
          {notifs.map((notif) => (
            <div
              key={notif.id}
              className="flex items-center justify-between bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3"
            >
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-200 font-medium text-sm">{notif.label}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CHANNEL_COLORS[notif.channel]}`}>
                    {notif.channel === 'both' ? 'SMS + Email' : notif.channel.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">{notif.description}</p>
              </div>
              <button
                onClick={() => toggleNotif(notif.id)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${notif.enabled ? 'bg-orange-500' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notif.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
          ) : (
            <><Save className="w-4 h-4" />Save Preferences</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('company');

  const renderTab = () => {
    switch (activeTab) {
      case 'company': return <CompanyTab />;
      case 'pricing': return <PricingConfig />;
      case 'heavy': return <HeavyItemsTab />;
      case 'specialty': return <SpecialtyFeesTab />;
      case 'crew': return <CrewTrucksTab />;
      case 'notifications': return <NotificationsTab />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-100 text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configure your business preferences and pricing</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <div className="lg:w-52 flex-shrink-0">
          <nav className="bg-gray-900 border border-gray-800 rounded-xl p-2 space-y-1 lg:sticky lg:top-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content panel */}
        <div className="flex-1 min-w-0 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="mb-6 pb-4 border-b border-gray-800">
            <h2 className="text-gray-100 font-semibold text-lg">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
          </div>
          {renderTab()}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, User, Phone, Mail, DollarSign, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface CrewMember {
  id: string;
  name: string;
  role: 'driver' | 'laborer' | 'supervisor' | 'helper';
  phone: string;
  email: string;
  ratePerHour: number;
  active: boolean;
}

// DB row matches crew_members table schema exactly
interface CrewRow {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  hourly_rate: number;   // DB column name
  status: string;        // DB column: 'active' | 'inactive'
  clerk_user_id?: string;
}

function rowToMember(row: CrewRow): CrewMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role as CrewMember['role'],
    phone: row.phone ?? '',
    email: row.email ?? '',
    ratePerHour: row.hourly_rate ?? 0,
    active: row.status === 'active',
  };
}

function memberToPayload(m: Omit<CrewMember, 'id'>) {
  return {
    name: m.name,
    role: m.role,
    phone: m.phone,
    email: m.email,
    hourly_rate: m.ratePerHour,
    status: m.active ? 'active' : 'inactive',
  };
}

const ROLE_LABELS: Record<CrewMember['role'], string> = {
  driver: 'Driver',
  laborer: 'Laborer',
  supervisor: 'Supervisor',
  helper: 'Helper',
};

const ROLE_COLORS: Record<CrewMember['role'], string> = {
  driver: 'bg-blue-500/20 text-blue-400',
  laborer: 'bg-orange-500/20 text-orange-400',
  supervisor: 'bg-purple-500/20 text-purple-400',
  helper: 'bg-gray-500/20 text-gray-400',
};

const EMPTY_MEMBER: Omit<CrewMember, 'id'> = {
  name: '',
  role: 'laborer',
  phone: '',
  email: '',
  ratePerHour: 22,
  active: true,
};

// MemberForm must live OUTSIDE CrewManager so React doesn't remount it on every keystroke
function MemberForm({ form, onChange, onSave, onCancel }: {
  form: Omit<CrewMember, 'id'>;
  onChange: (f: Omit<CrewMember, 'id'>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-gray-800/70 border border-orange-500/30 rounded-xl p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">Full Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="John Smith"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">Role</label>
          <select
            value={form.role}
            onChange={(e) => onChange({ ...form, role: e.target.value as CrewMember['role'] })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onChange({ ...form, phone: e.target.value })}
            placeholder="(555) 000-0000"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => onChange({ ...form, email: e.target.value })}
            placeholder="john@company.com"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">Hourly Rate</label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="number"
              value={form.ratePerHour}
              onChange={(e) => onChange({ ...form, ratePerHour: Number(e.target.value) })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-7 pr-8 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">/hr</span>
          </div>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => onChange({ ...form, active: !form.active })}
              className={`rounded-full transition-colors cursor-pointer relative ${form.active ? 'bg-orange-500' : 'bg-gray-700'}`}
              style={{ width: 40, height: 22 }}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-gray-400 text-sm">{form.active ? 'Active' : 'Inactive'}</span>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Save
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
}

export function CrewManager() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [editForm, setEditForm] = useState<Omit<CrewMember, 'id'>>(EMPTY_MEMBER);
  const [newForm, setNewForm] = useState<Omit<CrewMember, 'id'>>(EMPTY_MEMBER);

  // Load crew from API on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crew');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message ?? 'Failed to load crew');
        setCrew((json.data as CrewRow[]).map(rowToMember));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load crew');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const startEdit = (member: CrewMember) => {
    setEditingId(member.id);
    setEditForm({ name: member.name, role: member.role, phone: member.phone, email: member.email, ratePerHour: member.ratePerHour, active: member.active });
    setAddingNew(false);
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) { toast.error('Name is required'); return; }
    try {
      const res = await fetch(`/api/crew/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberToPayload(editForm)),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to update crew member');
      setCrew(crew.map((m) => (m.id === editingId ? rowToMember(json.data as CrewRow) : m)));
      setEditingId(null);
      toast.success('Crew member updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update crew member');
    }
  };

  const saveNew = async () => {
    if (!newForm.name.trim()) { toast.error('Name is required'); return; }
    try {
      const res = await fetch('/api/crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberToPayload(newForm)),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to add crew member');
      setCrew([...crew, rowToMember(json.data as CrewRow)]);
      setAddingNew(false);
      setNewForm(EMPTY_MEMBER);
      toast.success('Crew member added');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add crew member');
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const res = await fetch(`/api/crew/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to remove crew member');
      setCrew(crew.filter((m) => m.id !== id));
      toast.success('Crew member removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove crew member');
    }
  };

  const toggleActive = async (id: string) => {
    const member = crew.find((m) => m.id === id);
    if (!member) return;
    try {
      const res = await fetch(`/api/crew/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: !member.active ? 'active' : 'inactive' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to update crew member');
      setCrew(crew.map((m) => (m.id === id ? rowToMember(json.data as CrewRow) : m)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update crew member');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-600">
        <div className="text-sm">Loading crew...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            <span className="text-white font-semibold">{crew.filter((m) => m.active).length}</span> active of {crew.length} total
          </span>
        </div>
        <button
          onClick={() => { setAddingNew(true); setEditingId(null); setNewForm(EMPTY_MEMBER); }}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Crew Member
        </button>
      </div>

      {/* Add new form */}
      {addingNew && (
        <MemberForm
          form={newForm}
          onChange={setNewForm}
          onSave={saveNew}
          onCancel={() => setAddingNew(false)}
        />
      )}

      {/* Crew list */}
      <div className="space-y-2">
        {crew.map((member) => (
          <div key={member.id}>
            {editingId === member.id ? (
              <MemberForm
                form={editForm}
                onChange={setEditForm}
                onSave={saveEdit}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                className={`flex items-center gap-4 bg-gray-800/50 border rounded-xl p-4 transition-all ${
                  member.active ? 'border-gray-700/50' : 'border-gray-800 opacity-60'
                }`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-orange-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-100 font-medium text-sm">{member.name}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[member.role]}`}>
                      {ROLE_LABELS[member.role]}
                    </span>
                    {!member.active && (
                      <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    {member.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-600" />
                        <span className="text-gray-500 text-xs">{member.phone}</span>
                      </div>
                    )}
                    {member.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-600" />
                        <span className="text-gray-500 text-xs">{member.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rate */}
                <div className="text-right flex-shrink-0">
                  <div className="text-emerald-400 font-semibold text-sm">${member.ratePerHour}/hr</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(member.id)}
                    className="text-gray-600 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                    title={member.active ? 'Deactivate' : 'Activate'}
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startEdit(member)}
                    className="text-gray-600 hover:text-blue-400 p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMember(member.id)}
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

      {crew.length === 0 && !addingNew && (
        <div className="text-center py-12 text-gray-600">
          <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No crew members yet. Add your first team member above.</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { StickyNote, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface AddNoteFormProps {
  customerId: string;
  onNoteAdded?: () => void;
}

export function AddNoteForm({ customerId, onNoteAdded }: AddNoteFormProps) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = note.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('customer_notes').insert({
        customer_id: customerId,
        content: trimmed,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setNote('');
      toast.success('Note saved');
      onNoteAdded?.();
    } catch (err) {
      console.error('Failed to save note:', err);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note about this customer... (Cmd+Enter to save)"
          rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400 text-gray-900"
        />
        {note.length > 0 && (
          <span className="absolute bottom-2 right-2 text-xs text-gray-400">
            {note.length} chars
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <StickyNote className="h-3 w-3" />
          Notes are private and visible to your team only
        </p>
        <Button
          type="submit"
          size="sm"
          loading={saving}
          disabled={!note.trim()}
          leftIcon={saving ? undefined : <StickyNote className="h-3.5 w-3.5" />}
        >
          Save Note
        </Button>
      </div>
    </form>
  );
}

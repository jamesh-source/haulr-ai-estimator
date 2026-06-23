'use client';

import * as React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from './dialog';
import { Button } from './button';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title?: string;
  /** Explanatory description shown below the title */
  description?: string;
  /** Body content shown below the description (optional) */
  children?: React.ReactNode;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Mark the confirm action as destructive (red button) */
  destructive?: boolean;
  /** Whether the confirm action is currently loading */
  loading?: boolean;
  /** Called when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Called when user cancels (falls back to onOpenChange(false)) */
  onCancel?: () => void;
  /** Icon shown in the header area */
  icon?: React.ReactNode;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ConfirmationDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
  icon,
}: ConfirmationDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const effectiveLoading = loading || isLoading;

  async function handleConfirm() {
    const result = onConfirm();
    if (result instanceof Promise) {
      setIsLoading(true);
      try {
        await result;
      } finally {
        setIsLoading(false);
      }
    }
    onOpenChange(false);
  }

  function handleCancel() {
    if (effectiveLoading) return;
    onCancel ? onCancel() : onOpenChange(false);
  }

  return (
    <DialogRoot open={open} onOpenChange={(v) => !effectiveLoading && onOpenChange(v)}>
      <DialogContent size="sm" hideClose={effectiveLoading}>
        <DialogHeader>
          <div className="flex items-start gap-4">
            {/* Icon area */}
            <div
              className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                destructive ? 'bg-red-100' : 'bg-yellow-50'
              )}
            >
              {icon ?? (
                destructive ? (
                  <Trash2 className="h-5 w-5 text-red-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )
              )}
            </div>

            {/* Title + Description */}
            <div className="flex-1 pt-1">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {children && <DialogBody>{children}</DialogBody>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={effectiveLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'default'}
            onClick={handleConfirm}
            loading={effectiveLoading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

// =============================================================================
// HOOK — useConfirmation
// Provides imperative API: const { confirm, ConfirmDialog } = useConfirmation()
// =============================================================================

export interface UseConfirmationOptions
  extends Omit<ConfirmationDialogProps, 'open' | 'onOpenChange' | 'onConfirm'> {
  onConfirm?: () => void | Promise<void>;
}

export function useConfirmation(defaults?: Partial<UseConfirmationOptions>) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<UseConfirmationOptions>(
    defaults ?? {}
  );
  const resolveRef = React.useRef<((confirmed: boolean) => void) | null>(null);

  /** Opens the dialog and returns a Promise that resolves to true/false */
  function confirm(overrides?: Partial<UseConfirmationOptions>): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      if (overrides) setOptions((prev) => ({ ...prev, ...overrides }));
      setOpen(true);
    });
  }

  function handleConfirm() {
    resolveRef.current?.(true);
    resolveRef.current = null;
  }

  function handleCancel() {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setOpen(false);
  }

  const ConfirmDialog = (
    <ConfirmationDialog
      {...options}
      open={open}
      onOpenChange={(v) => {
        if (!v) handleCancel();
        setOpen(v);
      }}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialog };
}

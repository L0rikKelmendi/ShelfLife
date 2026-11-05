import { useCallback, useRef, useState } from 'react';
import { usePantry } from '../context/PantryContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../lib/errors';

export function useEnjoyItem() {
  const { changeStatus } = usePantry();
  const notify = useToast();
  const pending = useRef(new Set());
  const [busy, setBusy] = useState(null);
  const enjoy = useCallback(
    async (id) => {
      if (pending.current.has(id)) return;
      pending.current.add(id);
      setBusy(id);
      try {
        await changeStatus(id, 'used');
        notify('Enjoyed. A little less waste.', 'success', {
          actionLabel: 'Undo',
          duration: 7000,
          onAction: async () => {
            await changeStatus(id, 'active');
          },
        });
      } catch (error) {
        notify(errorMessage(error), 'error');
      } finally {
        pending.current.delete(id);
        setBusy((current) => (current === id ? null : current));
      }
    },
    [changeStatus, notify],
  );
  return { enjoy, busy };
}

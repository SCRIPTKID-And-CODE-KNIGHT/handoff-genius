import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Forward, Loader2 } from 'lucide-react';
import { useHospitals } from '@/hooks/useHospitals';

interface ForwardReferralDialogProps {
  excludeHospitalIds: string[];
  submitting: boolean;
  onForward: (toHospitalId: string, reason: string) => Promise<boolean>;
}

const PRESET_REASONS = [
  'No specialist available',
  'No bed capacity',
  'Out of our scope of care',
  'Patient location preference',
  'Equipment unavailable',
];

export const ForwardReferralDialog = ({
  excludeHospitalIds,
  submitting,
  onForward,
}: ForwardReferralDialogProps) => {
  const [open, setOpen] = useState(false);
  const { hospitals, loading } = useHospitals();
  const [targetId, setTargetId] = useState('');
  const [preset, setPreset] = useState('');
  const [notes, setNotes] = useState('');

  const available = hospitals.filter(h => !excludeHospitalIds.includes(h.id));

  const handleSubmit = async () => {
    if (!targetId) return;
    const reason = [preset, notes].filter(Boolean).join(' — ');
    const ok = await onForward(targetId, reason);
    if (ok) {
      setOpen(false);
      setTargetId('');
      setPreset('');
      setNotes('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Forward className="w-4 h-4 mr-2" />
          Forward Referral
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Forward Referral</DialogTitle>
          <DialogDescription>
            Pass this referral to another hospital. The original sender and full chain
            stay in the activity log.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Destination hospital</Label>
            <Select value={targetId} onValueChange={setTargetId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a hospital" />
              </SelectTrigger>
              <SelectContent>
                {available.map(h => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
                {available.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No eligible hospitals
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={preset} onValueChange={setPreset}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_REASONS.map(r => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Additional notes (optional)</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anything the receiving hospital should know..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !targetId || (!preset && !notes.trim())}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Forward
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

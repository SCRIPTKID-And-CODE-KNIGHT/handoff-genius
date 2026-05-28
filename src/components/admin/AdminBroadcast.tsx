import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Megaphone, Loader2, Send } from 'lucide-react';

interface Doctor {
  id: string;
  full_name: string;
  hospital_id?: string | null;
  hospital_name?: string;
  role?: string;
}

interface Hospital {
  id: string;
  name: string;
}

interface Props {
  doctors: Doctor[];
  hospitals: Hospital[];
}

const AdminBroadcast = ({ doctors, hospitals }: Props) => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<string>('all'); // 'all' or hospital id
  const [sending, setSending] = useState(false);

  const recipients = doctors.filter(d => {
    if (d.role === 'admin') return false;
    if (d.id === currentUser?.id) return false;
    if (target === 'all') return true;
    return d.hospital_id === target;
  });

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    if (!currentUser) return;
    if (recipients.length === 0) {
      toast.error('No recipients match the selected target');
      return;
    }

    setSending(true);
    const rows = recipients.map(r => ({
      sender_id: currentUser.id,
      recipient_id: r.id,
      message: `📢 ANNOUNCEMENT: ${message.trim()}`,
    }));

    const { error } = await supabase.from('direct_messages').insert(rows);
    setSending(false);

    if (error) {
      toast.error('Failed to send broadcast: ' + error.message);
      return;
    }
    toast.success(`Broadcast sent to ${recipients.length} doctor(s)`);
    setMessage('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" /> Broadcast Announcement
        </CardTitle>
        <CardDescription>
          Send a system-wide message to all doctors or to a specific hospital.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Target Audience</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors (Network-Wide)</SelectItem>
              {hospitals.map(h => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{recipients.length}</Badge>
            doctor(s) will receive this message.
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="broadcast-msg">Message</Label>
          <Textarea
            id="broadcast-msg"
            placeholder="e.g., New referral protocol effective Monday. Please review the updated guidelines."
            rows={5}
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
        </div>

        <Button onClick={handleSend} disabled={sending || !message.trim()} className="w-full sm:w-auto">
          {sending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Send Broadcast
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminBroadcast;

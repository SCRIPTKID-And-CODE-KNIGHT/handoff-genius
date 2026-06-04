import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Forward, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import type { ReferralForward } from '@/hooks/useReferralForwards';

interface Props {
  originHospital: string;
  forwards: ReferralForward[];
}

export const ForwardingChain = ({ originHospital, forwards }: Props) => {
  if (forwards.length === 0) return null;

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Forward className="w-4 h-4 text-primary" />
          Forwarding Chain
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 text-sm">
          <Building2 className="w-4 h-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">{originHospital}</p>
            <p className="text-xs text-muted-foreground">Original receiving hospital</p>
          </div>
        </div>
        {forwards.map(f => (
          <div key={f.id} className="border-l-2 border-dashed border-primary/40 ml-2 pl-4 pb-2">
            <div className="flex items-start gap-2 text-sm">
              <Building2 className="w-4 h-4 mt-0.5 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{f.toHospitalName}</p>
                <p className="text-xs text-muted-foreground">
                  Forwarded by {f.forwardedByName} ·{' '}
                  {format(new Date(f.created_at), 'MMM d, yyyy h:mm a')}
                </p>
                <p className="text-xs italic text-muted-foreground mt-1">"{f.reason}"</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

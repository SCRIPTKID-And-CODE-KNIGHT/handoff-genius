import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Timer, Award, AlertOctagon } from 'lucide-react';

interface Referral {
  id: string;
  status: string;
  urgency: string;
  created_at: string;
  updated_at: string;
  from_hospital_id: string;
  to_hospital_id: string;
  from_hospital_name?: string;
  to_hospital_name?: string;
}

interface Props {
  referrals: Referral[];
  hospitals: { id: string; name: string }[];
}

const AdminInsights = ({ referrals, hospitals }: Props) => {
  const total = referrals.length || 1;
  const completed = referrals.filter(r => r.status === 'completed');
  const completionRate = Math.round((completed.length / total) * 100);

  // Avg response time (created -> updated) for completed referrals, in hours
  const avgHours = completed.length
    ? Math.round(
        completed.reduce((acc, r) => {
          const diff = new Date(r.updated_at).getTime() - new Date(r.created_at).getTime();
          return acc + diff / (1000 * 60 * 60);
        }, 0) / completed.length
      )
    : 0;

  // Top receiving hospitals
  const receiving = hospitals
    .map(h => ({
      name: h.name,
      count: referrals.filter(r => r.to_hospital_id === h.id).length,
    }))
    .filter(h => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Urgency distribution
  const urgencyCounts = {
    emergency: referrals.filter(r => r.urgency === 'emergency').length,
    urgent: referrals.filter(r => r.urgency === 'urgent').length,
    routine: referrals.filter(r => r.urgency === 'routine').length,
  };

  // Last 7 days throughput
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last7 = referrals.filter(r => new Date(r.created_at).getTime() >= sevenDaysAgo).length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="w-4 h-4 text-primary" /> Completion Rate
          </CardTitle>
          <CardDescription>Network-wide referral success</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between mb-2">
            <span className="text-4xl font-bold">{completionRate}%</span>
            <span className="text-sm text-muted-foreground">
              {completed.length}/{referrals.length}
            </span>
          </div>
          <Progress value={completionRate} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="w-4 h-4 text-primary" /> Avg. Resolution Time
          </CardTitle>
          <CardDescription>From creation to completion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{avgHours}h</div>
          <p className="text-sm text-muted-foreground mt-2">
            Based on {completed.length} completed referrals
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-primary" /> Last 7 Days
          </CardTitle>
          <CardDescription>New referrals this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{last7}</div>
          <p className="text-sm text-muted-foreground mt-2">
            {((last7 / total) * 100).toFixed(0)}% of all-time volume
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertOctagon className="w-4 h-4 text-destructive" /> Urgency Mix
          </CardTitle>
          <CardDescription>Distribution by priority</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Emergency</span>
            <Badge variant="destructive">{urgencyCounts.emergency}</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span>Urgent</span>
            <Badge className="bg-warning text-warning-foreground">{urgencyCounts.urgent}</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span>Routine</span>
            <Badge variant="secondary">{urgencyCounts.routine}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Receiving Hospitals</CardTitle>
          <CardDescription>Hospitals with the most incoming referrals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {receiving.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals yet.</p>
          ) : (
            receiving.map((h, i) => {
              const pct = Math.round((h.count / total) * 100);
              return (
                <div key={h.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">
                      {i + 1}. {h.name}
                    </span>
                    <span className="text-muted-foreground">
                      {h.count} ({pct}%)
                    </span>
                  </div>
                  <Progress value={pct} />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInsights;

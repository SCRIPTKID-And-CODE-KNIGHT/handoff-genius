
# Productivity Upgrades — Starting with Referral Forwarding

A staged set of features to make the referral system more useful day-to-day. Forwarding is step 1; the rest build on it.

## 1. Referral Forwarding (priority)

Let a hospital that receives a referral pass it to another hospital better equipped to handle it — without losing history.

**User flow**
- On an incoming referral, the receiving doctor/admin clicks **Forward**.
- Picks a new destination hospital, optionally an assigned doctor, and writes a forwarding note (reason: no specialist, no beds, out of scope, etc.).
- Original sender is notified; new hospital sees it in their incoming queue marked as "Forwarded from …".
- Full chain is visible on the referral detail page (Hospital A → B → C) with timestamps and notes.

**Rules**
- Only `pending` or `accepted` referrals can be forwarded.
- Forwarding count capped (e.g. 3 hops) to avoid loops.
- Cannot forward back to a hospital already in the chain.
- All hospitals in the chain retain read access; only the current holder can act.

**Technical bits**
- New table `referral_forwards` (referral_id, from_hospital_id, to_hospital_id, forwarded_by, reason, created_at).
- `referrals` gets `current_hospital_id` and `forward_count`.
- RLS: read access granted to any hospital appearing in the chain; write/act limited to `current_hospital_id`.
- Activity log entry + in-app notification on each forward.
- UI: Forward button + dialog on `ReferralDetail`, chain timeline component, "Forwarded" badge on cards.

## 2. Complementary admin/productivity features (after forwarding ships)

Short list, each independently shippable:

- **Capacity & availability board** — hospitals publish current bed/specialty capacity so senders see who can actually accept before referring (reduces forwarding).
- **Smart hospital suggestions** — when creating a referral, suggest top destinations based on specialty match, acceptance rate, and average response time.
- **SLA timers & auto-escalation** — emergency referrals not acknowledged in X minutes auto-notify hospital admin and surface on admin dashboard.
- **Bulk admin actions** — admin can reassign, close, or export multiple referrals at once.
- **Doctor workload view** — admin sees active referral load per doctor to balance assignments.
- **Audit export** — admin exports filtered referral + activity log history as CSV/PDF for compliance.

## Suggested build order

1. Referral forwarding (this plan's core)
2. SLA timers & auto-escalation
3. Capacity board → feeds smart suggestions
4. Admin bulk actions + audit export
5. Doctor workload view

Confirm and I'll start with forwarding, or tell me which subset to include in scope first.

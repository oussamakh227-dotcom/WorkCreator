import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Check, Copy, Gift, Link2, LogOut, Share2, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function Referral() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const referralQuery = trpc.referral.getMyLink.useQuery(undefined, { enabled: Boolean(user), retry: false });

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Loading referral center…</div>;
  if (!user) {
    navigate("/");
    return null;
  }

  const referral = referralQuery.data;
  const copyLink = async () => {
    if (!referral?.referralUrl) return;
    await navigator.clipboard.writeText(referral.referralUrl);
    setCopied(true);
    toast.success("Referral link copied");
    window.setTimeout(() => setCopied(false), 1800);
  };

  const shareLink = async () => {
    if (!referral?.referralUrl) return;
    if (navigator.share) {
      await navigator.share({ title: "Join WorkFriends", text: "Join WorkFriends and earn from surveys.", url: referral.referralUrl });
      return;
    }
    await copyLink();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.18),_transparent_35%),linear-gradient(135deg,#020617,#0f172a)] text-white">
      <nav className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-slate-300 hover:bg-white/10 hover:text-white">← Dashboard</Button>
          <Button onClick={handleLogout} variant="outline" size="sm" className="border-white/15 bg-transparent text-slate-300 hover:bg-white/10 hover:text-white"><LogOut className="mr-2 h-4 w-4" /> Sign out</Button>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">Earn together</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Invite friends, earn $0.10</h1>
          <p className="mt-4 text-lg text-slate-300">Share your personal link. When a new member joins through it, your reward is credited once automatically.</p>
        </div>
        {referralQuery.isLoading ? <Card className="border-white/10 bg-white/[0.05]"><CardContent className="p-8 text-slate-300">Creating your referral link…</CardContent></Card> : referralQuery.isError ? <Card className="border-red-400/20 bg-red-500/10"><CardContent className="p-8 text-red-100">We could not load your referral link. Please try again.</CardContent></Card> : <>
          <Card className="mb-6 overflow-hidden border-purple-400/20 bg-white/[0.05] shadow-2xl shadow-purple-950/20">
            <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-purple-300" /> Your personal referral link</CardTitle><CardDescription className="text-slate-400">Use the copy or share action to invite people you know.</CardDescription></CardHeader>
            <CardContent><div className="flex flex-col gap-3 sm:flex-row"><div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 font-mono text-sm text-purple-100 break-all">{referral?.referralUrl}</div><Button onClick={copyLink} className="bg-purple-600 hover:bg-purple-500">{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? "Copied" : "Copy link"}</Button><Button onClick={shareLink} variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10"><Share2 className="mr-2 h-4 w-4" /> Share</Button></div></CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Users} label="Invites" value={referral?.totalInvites ?? 0} />
            <StatCard icon={Gift} label="Successful referrals" value={referral?.successfulInvites ?? 0} />
            <StatCard icon={Wallet} label="Rewards earned" value={`$${referral?.totalRewardsEarned ?? "0.00"}`} />
          </div>
          <Card className="mt-6 border-white/10 bg-white/[0.05]"><CardHeader><CardTitle>Recent referral rewards</CardTitle><CardDescription className="text-slate-400">Rewards are protected against duplicate claims.</CardDescription></CardHeader><CardContent>{referral?.recentRewards?.length ? <div className="space-y-3">{referral.recentRewards.map((reward) => <div key={reward.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 p-4"><span className="text-slate-300">Referral completed</span><span className="font-semibold text-emerald-300">+${reward.rewardAmount}</span></div>)}</div> : <p className="text-slate-400">No successful referrals yet. Share your link to get started.</p>}</CardContent></Card>
        </>}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return <Card className="border-white/10 bg-white/[0.05]"><CardContent className="p-6"><Icon className="mb-4 h-5 w-5 text-purple-300" /><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold text-white">{value}</p></CardContent></Card>;
}

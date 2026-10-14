import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  LockKeyhole,
  LogOut,
  Search,
  Sparkles,
} from "lucide-react";

type SurveyQuestion = {
  id?: number;
  text?: string;
  type?: string;
  options?: string[];
  required?: boolean;
};

function parseQuestions(value: string | null) {
  if (!value) return [] as SurveyQuestion[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as SurveyQuestion[]) : [];
  } catch {
    return [] as SurveyQuestion[];
  }
}

export default function Surveys() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [completionFilter, setCompletionFilter] = useState<"all" | "available" | "completed">("available");

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [authLoading, navigate, user]);

  const surveyInput = useMemo(
    () => ({ level: selectedLevel, limit: 100, offset: 0 }),
    [selectedLevel]
  );
  const surveysQuery = trpc.survey.availableForUser.useQuery(surveyInput, {
    enabled: Boolean(user),
    retry: false,
  });
  const categoriesQuery = trpc.survey.categories.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
  });
  const completedQuery = trpc.survey.completedIds.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
  });
  const levelQuery = trpc.survey.levelProgress.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
  });

  const categoryNames = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name])),
    [categoriesQuery.data]
  );
  const completedIds = useMemo(() => new Set(completedQuery.data ?? []), [completedQuery.data]);
  const filteredSurveys = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return (surveysQuery.data ?? []).filter((survey) => {
      const questions = parseQuestions(survey.questions);
      const categoryName = categoryNames.get(survey.categoryId) ?? "Uncategorized";
      const matchesSearch = !normalizedSearch ||
        survey.title.toLowerCase().includes(normalizedSearch) ||
        (survey.description ?? "").toLowerCase().includes(normalizedSearch) ||
        categoryName.toLowerCase().includes(normalizedSearch);
      const isCompleted = completedIds.has(survey.id);
      const matchesCompletion = completionFilter === "all" ||
        (completionFilter === "completed" && isCompleted) ||
        (completionFilter === "available" && !isCompleted);
      return matchesSearch && matchesCompletion && questions.length >= 0 &&
        (selectedCategory === undefined || survey.categoryId === selectedCategory);
    });
  }, [categoryNames, completedIds, completionFilter, searchTerm, selectedCategory, surveysQuery.data]);

  const currentLevel = levelQuery.data?.currentLevel ?? 1;
  const nextLevel = levelQuery.data?.nextLevel;
  const totalPoints = levelQuery.data?.totalPointsEarned ?? user?.totalPoints ?? 0;
  const nextLevelPoints = levelQuery.data?.nextLevelRequiredPoints;
  const progress = nextLevelPoints
    ? Math.min(100, Math.round((totalPoints / nextLevelPoints) * 100))
    : 100;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex items-center gap-3"><Sparkles className="h-5 w-5 animate-pulse" /> Loading surveys…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/dashboard")} variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white">
              ← Dashboard
            </Button>
            <div className="hidden h-6 w-px bg-white/10 sm:block" />
            <div>
              <p className="font-semibold">Survey marketplace</p>
              <p className="text-xs text-slate-400">Live catalog · rewards are stored after completion</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm" className="border-white/15 bg-transparent text-slate-300 hover:bg-white/10 hover:text-white">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Card className="overflow-hidden border-blue-400/20 bg-gradient-to-br from-blue-500/15 via-slate-900/70 to-purple-500/10 shadow-2xl shadow-blue-950/20">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2 text-blue-300"><Award className="h-5 w-5" /> Progression</div>
              <CardTitle className="text-3xl">Level {currentLevel} access</CardTitle>
              <CardDescription className="max-w-xl text-slate-300">Complete eligible surveys to build points and unlock longer, higher-value research at the next level.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center justify-between text-sm"><span className="text-slate-400">{totalPoints.toLocaleString()} points earned</span><span className="text-blue-300">{nextLevel ? `Level ${nextLevel} at ${nextLevelPoints} points` : "Top level unlocked"}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all" style={{ width: `${progress}%` }} /></div>
            </CardContent>
          </Card>
          <Card className="border-emerald-400/20 bg-emerald-500/10">
            <CardHeader><CardTitle className="text-lg">Responsible earning</CardTitle><CardDescription className="text-slate-300">Every survey includes a required 26-second ad view before questions open.</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300"><div className="flex items-center gap-3"><Clock3 className="h-4 w-4 text-emerald-300" /> Your answers are saved once, with duplicate completion protection.</div><div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Only active surveys within your level are shown.</div></CardContent>
          </Card>
        </section>

        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl sm:p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div><h1 className="text-2xl font-bold">Available surveys</h1><p className="mt-1 text-sm text-slate-400">{filteredSurveys.length} result{filteredSurveys.length === 1 ? "" : "s"} from the live catalog</p></div>
            <div className="relative w-full md:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search title, description, or category" className="border-white/10 bg-slate-950/60 pl-9 text-white placeholder:text-slate-500" /></div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm text-slate-400"><span className="mb-1 flex items-center gap-2"><Filter className="h-4 w-4" /> Level</span><select value={selectedLevel ?? ""} onChange={(event) => setSelectedLevel(event.target.value ? Number(event.target.value) : undefined)} className="w-full rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-white outline-none focus:border-blue-400"><option value="">All unlocked levels</option>{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level} disabled={level > currentLevel}>Level {level}{level > currentLevel ? " · locked" : ""}</option>)}</select></label>
            <label className="text-sm text-slate-400"><span className="mb-1 block">Category</span><select value={selectedCategory ?? ""} onChange={(event) => setSelectedCategory(event.target.value ? Number(event.target.value) : undefined)} className="w-full rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-white outline-none focus:border-blue-400"><option value="">All categories</option>{categoriesQuery.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label className="text-sm text-slate-400"><span className="mb-1 block">Completion</span><select value={completionFilter} onChange={(event) => setCompletionFilter(event.target.value as typeof completionFilter)} className="w-full rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-white outline-none focus:border-blue-400"><option value="available">Not completed</option><option value="all">All surveys</option><option value="completed">Completed</option></select></label>
          </div>
        </section>

        {(surveysQuery.isLoading || categoriesQuery.isLoading || completedQuery.isLoading) ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />)}</div>
        ) : surveysQuery.isError ? (
          <Card className="border-red-400/20 bg-red-500/10"><CardHeader><CardTitle>Unable to load surveys</CardTitle><CardDescription className="text-red-100">Please refresh and try again. The catalog is served from the project database.</CardDescription></CardHeader></Card>
        ) : filteredSurveys.length === 0 ? (
          <Card className="border-white/10 bg-white/[0.04]"><CardContent className="flex flex-col items-center justify-center py-16 text-center"><Search className="mb-4 h-10 w-10 text-slate-500" /><h2 className="text-xl font-semibold">No surveys match these filters</h2><p className="mt-2 max-w-md text-slate-400">Try clearing a filter or check back after an administrator publishes a new active survey.</p><Button variant="outline" className="mt-6 border-white/15 bg-transparent text-white hover:bg-white/10" onClick={() => { setSearchTerm(""); setSelectedLevel(undefined); setSelectedCategory(undefined); setCompletionFilter("available"); }}>Clear filters</Button></CardContent></Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredSurveys.map((survey) => {
            const questions = parseQuestions(survey.questions);
            const isCompleted = completedIds.has(survey.id);
            return <Card key={survey.id} className="group flex flex-col border-white/10 bg-white/[0.045] transition duration-200 hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-white/[0.07]">
              <CardHeader><div className="mb-3 flex items-start justify-between gap-3"><Badge className="border border-blue-400/20 bg-blue-500/15 text-blue-200">Level {survey.levelRequired}</Badge>{isCompleted ? <Badge className="border border-emerald-400/20 bg-emerald-500/15 text-emerald-200"><CheckCircle2 className="mr-1 h-3 w-3" /> Completed</Badge> : <Badge variant="outline" className="border-white/15 text-slate-300">Active</Badge>}</div><CardTitle className="line-clamp-2 text-xl">{survey.title}</CardTitle><CardDescription className="line-clamp-3 text-slate-400">{survey.description || "Share your opinion in this research survey."}</CardDescription></CardHeader>
              <CardContent className="mt-auto"><div className="mb-5 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-slate-950/30 p-3 text-center text-xs"><div><p className="text-slate-500">Time</p><p className="mt-1 font-semibold text-white">{survey.estimatedTime ?? "—"} min</p></div><div><p className="text-slate-500">Reward</p><p className="mt-1 font-semibold text-emerald-300">{survey.pointsReward} pts</p></div><div><p className="text-slate-500">Questions</p><p className="mt-1 font-semibold text-white">{questions.length}</p></div></div><Button disabled={isCompleted} onClick={() => navigate(`/survey/${survey.id}`)} className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-50">{isCompleted ? "Already completed" : "Start survey"}<ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Button></CardContent>
            </Card>;
          })}</div>
        )}

        {selectedLevel && selectedLevel > currentLevel && <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-400"><LockKeyhole className="h-4 w-4" /> This level is locked until you progress.</div>}
      </main>
    </div>
  );
}

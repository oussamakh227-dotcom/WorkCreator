import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, LockKeyhole, LogOut, ShieldCheck, Sparkles } from "lucide-react";

type SurveyQuestion = {
  id?: number;
  text?: string;
  type?: string;
  options?: string[];
  required?: boolean;
};

type AnswerValue = string | string[];

function parseQuestions(value: string | null) {
  if (!value) return [] as SurveyQuestion[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as SurveyQuestion[]) : [];
  } catch {
    return [] as SurveyQuestion[];
  }
}

function isEmptyAnswer(value: AnswerValue | undefined) {
  return value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

export default function SurveyDetail() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/survey/:id");
  const surveyId = Number(params?.id);
  const [showAd, setShowAd] = useState(true);
  const [adTimeLeft, setAdTimeLeft] = useState(26);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [adViewRequested, setAdViewRequested] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [authLoading, navigate, user]);

  const surveyQuery = trpc.survey.getById.useQuery({ id: surveyId }, {
    enabled: Boolean(user && Number.isInteger(surveyId) && surveyId > 0),
    retry: false,
  });
  const completionQuery = trpc.survey.checkCompletion.useQuery({ surveyId }, {
    enabled: Boolean(user && Number.isInteger(surveyId) && surveyId > 0),
    retry: false,
  });
  const adQuery = trpc.advertisement.list.useQuery({ limit: 1, offset: 0 }, {
    enabled: Boolean(user && Number.isInteger(surveyId) && surveyId > 0),
    retry: false,
  });
  const utils = trpc.useUtils();
  const recordAdViewMutation = trpc.advertisement.recordSurveyView.useMutation({
    onSuccess: () => {
      setShowAd(false);
      setStartedAt(Date.now());
    },
    onError: (error) => {
      setAdViewRequested(false);
      setAdTimeLeft(1);
      toast.error(`The sponsor view could not be verified: ${error.message}`);
    },
  });
  const submitMutation = trpc.survey.submit.useMutation({
    onSuccess: async (result) => {
      toast.success(`Survey completed. ${result.pointsEarned} points were added to your account.`);
      await utils.survey.completedIds.invalidate();
      await utils.auth.me.invalidate();
      navigate("/surveys");
    },
    onError: (error) => toast.error(error.message),
  });

  const survey = surveyQuery.data;
  const questions = useMemo(() => parseQuestions(survey?.questions ?? null), [survey?.questions]);
  const question = questions[currentQuestion];
  const currentQuestionId = question?.id ?? currentQuestion + 1;
  const requiredQuestionsAnswered = questions
    .filter((item) => item.required !== false)
    .every((item, index) => !isEmptyAnswer(answers[item.id ?? index + 1]));

  useEffect(() => {
    if (!showAd && startedAt === null) setStartedAt(Date.now());
  }, [showAd, startedAt]);

  useEffect(() => {
    if (!showAd || adTimeLeft <= 0) return;
    const timer = window.setTimeout(() => setAdTimeLeft((time) => time - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [adTimeLeft, showAd]);

  useEffect(() => {
    if (!showAd || adTimeLeft !== 0 || adViewRequested || recordAdViewMutation.isPending) return;
    setAdViewRequested(true);
    recordAdViewMutation.mutate({
      surveyId,
      adId: adQuery.data?.[0]?.id ?? null,
      viewDuration: 26,
    });
  }, [adQuery.data, adTimeLeft, adViewRequested, recordAdViewMutation, showAd, surveyId]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const setAnswer = (questionId: number, value: AnswerValue) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (!survey || !requiredQuestionsAnswered) {
      toast.error("Please answer every required question before submitting.");
      return;
    }
    const payload = Object.entries(answers).map(([questionId, answer]) => ({ questionId: Number(questionId), answer }));
    submitMutation.mutate({
      surveyId: survey.id,
      answers: payload,
      adWatchedSeconds: 26,
      timeSpentSeconds: startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0,
    });
  };

  if (authLoading || !user || surveyQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 animate-pulse" /> Loading survey…</div></div>;
  }

  if (surveyQuery.isError || !survey) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white"><Card className="max-w-lg border-red-400/20 bg-red-500/10"><CardHeader><CardTitle>Survey unavailable</CardTitle><CardDescription className="text-red-100">This survey could not be found or is no longer available.</CardDescription></CardHeader><CardContent><Button onClick={() => navigate("/surveys")} className="w-full">Back to surveys</Button></CardContent></Card></div>;
  }

  if (completionQuery.data?.isCompleted) {
    return <div className="min-h-screen bg-slate-950 px-4 py-16 text-white"><div className="mx-auto max-w-xl"><Card className="border-emerald-400/20 bg-emerald-500/10 text-center"><CardHeader><CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-emerald-300" /><CardTitle>You already completed this survey</CardTitle><CardDescription className="text-slate-300">This response is protected from duplicate submissions. You earned {completionQuery.data.pointsEarned} points.</CardDescription></CardHeader><CardContent><Button onClick={() => navigate("/surveys")} className="w-full">Return to survey marketplace</Button></CardContent></Card></div></div>;
  }

  if (showAd) {
    return <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_38%),#020617] px-4 py-10 text-white"><nav className="mx-auto flex max-w-5xl justify-between"><Button onClick={() => navigate("/surveys")} variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white">← Back to surveys</Button><Button onClick={handleLogout} variant="outline" size="sm" className="border-white/15 bg-transparent text-slate-300 hover:bg-white/10 hover:text-white"><LogOut className="mr-2 h-4 w-4" /> Sign out</Button></nav><main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center"><Card className="w-full border-blue-400/20 bg-white/[0.05] text-center shadow-2xl shadow-blue-950/30"><CardHeader><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300"><ShieldCheck className="h-7 w-7" /></div><CardTitle className="text-3xl">Required sponsor message</CardTitle><CardDescription className="text-slate-300">Please keep this message open for 26 seconds. The survey unlocks only after the viewing record is verified.</CardDescription></CardHeader><CardContent><div className="rounded-2xl border border-white/10 bg-slate-950/60 p-10"><p className="text-xs uppercase tracking-[0.24em] text-slate-500">Sponsored content</p><p className="mt-5 text-7xl font-bold tabular-nums text-blue-300">{adTimeLeft}</p><p className="mt-2 text-sm text-slate-400">seconds remaining</p></div><div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-400"><LockKeyhole className="h-4 w-4" /> Skipping is disabled</div>{recordAdViewMutation.isPending && <p className="mt-4 text-sm text-blue-200">Verifying your completed sponsor view…</p>}</CardContent></Card></main></div>;
  }

  if (!question) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white"><Card className="max-w-lg border-amber-400/20 bg-amber-500/10"><CardHeader><CardTitle>Survey needs attention</CardTitle><CardDescription className="text-amber-100">This active survey has no valid questions yet. Please contact the administrator.</CardDescription></CardHeader><CardContent><Button onClick={() => navigate("/surveys")} className="w-full">Back to surveys</Button></CardContent></Card></div>;
  }

  const answer = answers[currentQuestionId];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const questionType = question.type?.toLowerCase() ?? "text";

  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(135deg,#020617,#0f172a)] text-white"><nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6"><div className="flex items-center gap-3"><Button onClick={() => navigate("/surveys")} variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white">← Exit</Button><div className="hidden h-6 w-px bg-white/10 sm:block" /><span className="text-sm text-slate-300">Question {currentQuestion + 1} of {questions.length}</span></div><div className="flex items-center gap-4"><div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"><Clock3 className="h-4 w-4 text-blue-300" /><span>{startedAt ? `${Math.floor((Date.now() - startedAt) / 60000)} min` : "Ready"}</span></div><Button onClick={handleLogout} variant="outline" size="sm" className="hidden border-white/15 bg-transparent text-slate-300 hover:bg-white/10 hover:text-white sm:inline-flex"><LogOut className="mr-2 h-4 w-4" /> Sign out</Button></div></div></nav><main className="mx-auto max-w-3xl px-4 py-8 sm:px-6"><div className="mb-6"><div className="mb-3 flex items-center justify-between text-sm text-slate-400"><span className="truncate pr-4">{survey.title}</span><span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} /></div></div><Card className="border-white/10 bg-white/[0.045] shadow-2xl"><CardHeader><div className="mb-3 flex flex-wrap gap-2"><span className="rounded-full border border-blue-400/20 bg-blue-500/15 px-3 py-1 text-xs text-blue-200">Level {survey.levelRequired}</span><span className="rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-200">{survey.pointsReward} points</span></div><CardTitle className="text-2xl leading-tight">{question.text || `Question ${currentQuestion + 1}`}</CardTitle><CardDescription className="text-slate-400">{question.required === false ? "Optional question" : "Required question"}</CardDescription></CardHeader><CardContent><div className="space-y-3">{questionType === "radio" || questionType === "select" ? (question.options ?? []).map((option) => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${answer === option ? "border-blue-400/70 bg-blue-500/15" : "border-white/10 bg-slate-950/30 hover:border-white/25"}`}><input type="radio" name={`question-${currentQuestionId}`} value={option} checked={answer === option} onChange={() => setAnswer(currentQuestionId, option)} className="h-4 w-4 accent-blue-500" /><span>{option}</span></label>) : questionType === "checkbox" ? (question.options ?? []).map((option) => { const selected = Array.isArray(answer) && answer.includes(option); return <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${selected ? "border-blue-400/70 bg-blue-500/15" : "border-white/10 bg-slate-950/30 hover:border-white/25"}`}><input type="checkbox" checked={selected} onChange={(event) => { const values = Array.isArray(answer) ? answer : []; setAnswer(currentQuestionId, event.target.checked ? [...values, option] : values.filter((value) => value !== option)); }} className="h-4 w-4 accent-blue-500" /><span>{option}</span></label>; }) : <textarea value={typeof answer === "string" ? answer : ""} onChange={(event) => setAnswer(currentQuestionId, event.target.value)} placeholder="Write your answer…" rows={5} className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-4 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400" />}</div>{question.required !== false && isEmptyAnswer(answer) && <p className="mt-4 text-sm text-amber-300">Please answer this question to continue.</p>}</CardContent></Card><div className="mt-6 flex gap-3"><Button onClick={() => setCurrentQuestion((current) => Math.max(0, current - 1))} disabled={currentQuestion === 0 || submitMutation.isPending} variant="outline" className="flex-1 border-white/15 bg-transparent text-white hover:bg-white/10"><ChevronLeft className="mr-2 h-4 w-4" /> Previous</Button>{isLastQuestion ? <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400">{submitMutation.isPending ? "Saving…" : "Submit survey"}<CheckCircle2 className="ml-2 h-4 w-4" /></Button> : <Button onClick={() => { if (question.required !== false && isEmptyAnswer(answer)) { toast.error("Please answer this required question before continuing."); return; } setCurrentQuestion((current) => Math.min(questions.length - 1, current + 1)); }} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-400 hover:to-indigo-400">Next<ChevronRight className="ml-2 h-4 w-4" /></Button>}</div><p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-slate-500"><ShieldCheck className="h-3.5 w-3.5" /> Your response is securely stored after submission.</p></main></div>;
}

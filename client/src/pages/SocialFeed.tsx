import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Heart, ImagePlus, MessageCircle, LogOut, Send, Sparkles, Users, X } from "lucide-react";

type FeedPost = {
  id: number;
  userId: number;
  content: string;
  imageUrl: string | null;
  postType: "text" | "image" | "poll" | "ad";
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: Date;
  authorName: string | null;
  authorAvatar: string | null;
  likedByViewer: boolean;
};

type CommentItem = {
  id: number;
  content: string;
  createdAt: Date;
  authorName: string | null;
  authorAvatar: string | null;
};

function initials(name: string | null) {
  return (name || "W").trim().slice(0, 1).toUpperCase();
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function PostCard({ post, onRefresh }: { post: FeedPost; onRefresh: () => void }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const utils = trpc.useUtils();
  const commentsQuery = trpc.social.comments.useQuery({ postId: post.id }, { enabled: showComments });
  const likeMutation = trpc.social.toggleLike.useMutation({
    onSuccess: () => onRefresh(),
    onError: (error) => toast.error(error.message),
  });
  const commentMutation = trpc.social.addComment.useMutation({
    onSuccess: async () => {
      setComment("");
      await utils.social.comments.invalidate({ postId: post.id });
      onRefresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Card className="border-white/10 bg-white/[0.045] text-white shadow-xl shadow-slate-950/20">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-11 w-11 border border-blue-400/30">
            <AvatarImage src={post.authorAvatar || undefined} alt={post.authorName || "User"} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">{initials(post.authorName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0"><p className="truncate font-semibold">{post.authorName || "WorkFriends member"}</p><p className="text-xs text-slate-500">{formatDate(post.createdAt)}</p></div>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500">{post.postType}</span>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-200">{post.content}</p>
        {post.imageUrl && <img src={post.imageUrl} alt="Post attachment" className="mt-4 max-h-96 w-full rounded-xl border border-white/10 object-cover" />}
        <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-3">
          <Button variant="ghost" size="sm" disabled={likeMutation.isPending} onClick={() => likeMutation.mutate({ postId: post.id })} className={post.likedByViewer ? "text-rose-300 hover:bg-rose-500/10 hover:text-rose-200" : "text-slate-400 hover:bg-white/10 hover:text-white"}>
            <Heart className={`mr-2 h-4 w-4 ${post.likedByViewer ? "fill-current" : ""}`} /> {post.likesCount}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowComments((open) => !open)} className="text-slate-400 hover:bg-white/10 hover:text-white"><MessageCircle className="mr-2 h-4 w-4" /> {post.commentsCount}</Button>
        </div>
        {showComments && <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
          {commentsQuery.isLoading ? <p className="text-sm text-slate-500">Loading comments…</p> : (commentsQuery.data as CommentItem[] | undefined)?.length ? (commentsQuery.data as CommentItem[]).map((item) => <div key={item.id} className="flex gap-2"><Avatar className="h-7 w-7"><AvatarImage src={item.authorAvatar || undefined} /><AvatarFallback className="bg-slate-700 text-xs">{initials(item.authorName)}</AvatarFallback></Avatar><div className="min-w-0 flex-1 rounded-lg bg-white/[0.05] px-3 py-2"><p className="text-xs font-semibold text-slate-300">{item.authorName || "Member"}</p><p className="whitespace-pre-wrap text-sm text-slate-200">{item.content}</p></div></div>) : <p className="text-sm text-slate-500">No comments yet. Start the conversation.</p>}
          <div className="flex gap-2"><Textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={2} placeholder="Write a respectful comment…" className="min-h-0 resize-none border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500" /><Button aria-label="Send comment" disabled={!comment.trim() || commentMutation.isPending} onClick={() => commentMutation.mutate({ postId: post.id, content: comment })} size="icon" className="shrink-0 self-end bg-blue-600 hover:bg-blue-500"><Send className="h-4 w-4" /></Button></div>
        </div>}
      </CardContent>
    </Card>
  );
}

export default function SocialFeed() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageField, setShowImageField] = useState(false);
  const feedInput = useMemo(() => ({ limit: 20, offset: 0 }), []);
  const feedQuery = trpc.social.feed.useQuery(feedInput, { enabled: Boolean(user), retry: false });
  const utils = trpc.useUtils();
  const createMutation = trpc.social.createPost.useMutation({
    onSuccess: async () => {
      setContent("");
      setImageUrl("");
      setShowImageField(false);
      await utils.social.feed.invalidate();
      toast.success("Your post is live in the community feed.");
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [authLoading, navigate, user]);

  const handleLogout = async () => { await logout(); navigate("/"); };
  const createPost = () => {
    if (!content.trim()) { toast.error("Write something before publishing."); return; }
    createMutation.mutate({ content, imageUrl: imageUrl.trim() || undefined, postType: imageUrl.trim() ? "image" : "text", visibility: "public" });
  };

  if (authLoading || !user) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300"><Sparkles className="mr-3 h-5 w-5 animate-pulse" /> Loading community…</div>;

  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.15),_transparent_34%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] text-white">
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6"><div className="flex items-center gap-3"><Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-slate-300 hover:bg-white/10 hover:text-white">← Dashboard</Button><div className="hidden h-6 w-px bg-white/10 sm:block" /><div><p className="font-semibold">Social Lite</p><p className="text-xs text-slate-500">Share ideas. Build trust. Stay professional.</p></div></div><Button onClick={handleLogout} variant="outline" size="sm" className="border-white/15 bg-transparent text-slate-300 hover:bg-white/10 hover:text-white"><LogOut className="mr-2 h-4 w-4" /> Sign out</Button></div></nav>
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_300px] sm:px-6">
      <div className="space-y-5">
        <Card className="border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 text-white"><CardContent className="p-5"><div className="mb-3 flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarImage src={user.profileImage || undefined} /><AvatarFallback className="bg-blue-600 text-white">{initials(user.name)}</AvatarFallback></Avatar><p className="font-semibold">Share an update with the community</p></div><Textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={5000} rows={4} placeholder="What would you like to share? Keep it helpful and professional…" className="resize-none border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setShowImageField((shown) => !shown)} className="text-slate-400 hover:bg-white/10 hover:text-white"><ImagePlus className="mr-2 h-4 w-4" /> Add image URL</Button>{showImageField && <Button type="button" variant="ghost" size="icon" onClick={() => { setImageUrl(""); setShowImageField(false); }} className="text-slate-500 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></Button>}</div><span className="text-xs text-slate-500">{content.length}/5000</span><Button disabled={!content.trim() || createMutation.isPending} onClick={createPost} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400">{createMutation.isPending ? "Publishing…" : "Publish post"}<Send className="ml-2 h-4 w-4" /></Button></div>{showImageField && <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} type="url" placeholder="https://example.com/image.jpg" className="mt-3 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400" />}</CardContent></Card>
        {feedQuery.isLoading ? <div className="space-y-5">{[1, 2].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />)}</div> : feedQuery.isError ? <Card className="border-red-400/20 bg-red-500/10 text-white"><CardContent className="p-6">The community feed is temporarily unavailable. Please try again.</CardContent></Card> : feedQuery.data?.length ? (feedQuery.data as FeedPost[]).map((post) => <PostCard key={post.id} post={post} onRefresh={() => utils.social.feed.invalidate()} />) : <Card className="border-white/10 bg-white/[0.04] text-center"><CardContent className="py-16"><Users className="mx-auto mb-4 h-10 w-10 text-slate-500" /><h2 className="text-xl font-semibold">The community is ready for your first post</h2><p className="mx-auto mt-2 max-w-md text-slate-400">Share a useful update or invite other WorkFriends members to start the conversation.</p></CardContent></Card>}
      </div>
      <aside className="h-fit space-y-4 lg:sticky lg:top-24"><Card className="border-white/10 bg-white/[0.045] text-white"><CardContent className="p-5"><div className="mb-3 flex items-center gap-2 text-blue-300"><Users className="h-5 w-5" /><span className="font-semibold">Community guidelines</span></div><ul className="space-y-3 text-sm leading-6 text-slate-400"><li>Be respectful and constructive.</li><li>Share only content you have permission to publish.</li><li>Never post private payment or account details.</li><li>Report suspicious activity to platform support.</li></ul></CardContent></Card><Card className="border-emerald-400/20 bg-emerald-500/10 text-white"><CardContent className="p-5"><p className="font-semibold text-emerald-200">Your voice matters</p><p className="mt-2 text-sm leading-6 text-slate-300">Social Lite is designed for lightweight community interaction alongside survey participation.</p></CardContent></Card></aside>
    </main>
  </div>;
}

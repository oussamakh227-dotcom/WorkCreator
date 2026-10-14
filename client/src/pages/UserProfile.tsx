import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/_core/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, Share2, MapPin, Globe, Users, FileText } from "lucide-react";
import { useState } from "react";

interface Post {
  id: number;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
}

interface UserProfileData {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  website?: string;
  location?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  posts: Post[];
}

export default function UserProfile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [followersCount, setFollowersCount] = useState(1250);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleFollowClick = async () => {
    setIsLoading(true);
    setShowAnimation(true);

    // Simulate API call
    setTimeout(() => {
      if (!isFollowing) {
        setFollowersCount((prev) => prev + 1);
        setIsFollowing(true);
      } else {
        setFollowersCount((prev) => prev - 1);
        setIsFollowing(false);
      }
      setIsLoading(false);
      setShowAnimation(false);
    }, 600);
  };

  // Mock user profile data - replace with API call
  const userProfile: UserProfileData = {
    id: user?.id || 1,
    name: user?.name || "User Name",
    email: user?.email || "user@example.com",
    avatarUrl: user?.profileImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user?.id,
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8e7b9b47?w=1200&h=400&fit=crop",
    bio: "Digital creator | Tech enthusiast | Always learning 🚀",
    website: "https://workfriends.com",
    location: "San Francisco, CA",
    followersCount: followersCount,
    followingCount: 342,
    postsCount: 48,
    posts: [
      {
        id: 1,
        content: "Just completed an amazing survey! Earned 50 points 🎉",
        imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
        likesCount: 234,
        commentsCount: 45,
        sharesCount: 12,
        createdAt: "2 hours ago",
      },
      {
        id: 2,
        content: "Loving the new features on WorkFriends! 💪",
        imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop",
        likesCount: 567,
        commentsCount: 89,
        sharesCount: 34,
        createdAt: "1 day ago",
      },
      {
        id: 3,
        content: "Referral bonus unlocked! 🎊 Thanks to all my friends",
        imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f70d504f0?w=400&h=300&fit=crop",
        likesCount: 890,
        commentsCount: 156,
        sharesCount: 78,
        createdAt: "3 days ago",
      },
      {
        id: 4,
        content: "Reached Level 3! Next milestone here I come 🚀",
        likesCount: 345,
        commentsCount: 67,
        sharesCount: 23,
        createdAt: "5 days ago",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden">
        <img
          src={userProfile.coverUrl}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Profile Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-40 h-40 rounded-2xl border-4 border-slate-900 shadow-2xl object-cover"
            />
          </div>

          {/* Profile Info */}
          <div className="flex-grow pt-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{userProfile.name}</h1>
                <p className="text-purple-300 text-lg mb-4">@{userProfile.email?.split("@")[0]}</p>

                {/* Bio */}
                {userProfile.bio && (
                  <p className="text-gray-300 text-base mb-4 max-w-2xl">{userProfile.bio}</p>
                )}

                {/* Location & Website */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  {userProfile.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {userProfile.location}
                    </div>
                  )}
                  {userProfile.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <a href={userProfile.website} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400">
                        {userProfile.website.replace("https://", "")}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleFollowClick}
                  disabled={isLoading}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all transform ${
                    isFollowing
                      ? "bg-slate-700 hover:bg-slate-600 text-white"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  } ${
                    showAnimation ? "scale-95" : "scale-100"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isFollowing ? "Unfollowing..." : "Following..."}
                    </span>
                  ) : isFollowing ? (
                    "Following"
                  ) : (
                    "Follow"
                  )}
                </Button>
                <Button className="px-6 py-2 rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-all hover:scale-105">
                  Message
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">{userProfile.postsCount}</div>
                <div className="text-sm text-gray-400 mt-2">Posts</div>
              </div>
            </CardContent>
          </Card>
          <Card className={`bg-slate-800/50 border-slate-700 transition-all ${
            showAnimation ? "scale-105 border-blue-500" : "scale-100"
          }`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 transition-all">
                  {userProfile.followersCount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400 mt-2">Followers</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{userProfile.followingCount}</div>
                <div className="text-sm text-gray-400 mt-2">Following</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="posts" className="data-[state=active]:bg-purple-600">
              <FileText className="w-4 h-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-purple-600">
              <FileText className="w-4 h-4 mr-2" />
              Media
            </TabsTrigger>
            <TabsTrigger value="likes" className="data-[state=active]:bg-purple-600">
              <Heart className="w-4 h-4 mr-2" />
              Likes
            </TabsTrigger>
          </TabsList>

          {/* Posts Grid */}
          <TabsContent value="posts" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProfile.posts.map((post) => (
                <Card key={post.id} className="bg-slate-800/50 border-slate-700 hover:border-purple-500 transition-all overflow-hidden group cursor-pointer">
                  {post.imageUrl && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
                    </div>
                  )}
                  <CardContent className={`${post.imageUrl ? "pt-4" : "pt-6"}`}>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">{post.content}</p>

                    {/* Post Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-slate-700">
                      <span>{post.createdAt}</span>
                      <span>{post.likesCount + post.commentsCount + post.sharesCount} interactions</span>
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center justify-between">
                      <button className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors">
                        <Heart className="w-4 h-4" />
                        <span className="text-xs">{post.likesCount}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs">{post.commentsCount}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span className="text-xs">{post.sharesCount}</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProfile.posts
                .filter((post) => post.imageUrl)
                .map((post) => (
                  <div key={post.id} className="relative h-64 rounded-lg overflow-hidden group cursor-pointer">
                    <img
                      src={post.imageUrl}
                      alt="Media"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Heart className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          {/* Likes Tab */}
          <TabsContent value="likes" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No liked posts yet</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

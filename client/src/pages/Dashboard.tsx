import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { DollarSign, TrendingUp, Award, Share2, Wallet, Clock, BarChart3, LogOut, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center font-bold text-white">
              W.F
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">WorkFriends</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300 hidden sm:block">{user.name || user.email}</span>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              خروج
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">أهلاً بك، {user.name || "صديقي"}! 👋</h1>
          <p className="text-slate-400">إليك ملخص أنشطتك وأرباحك</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-400/10 border-blue-500/30 hover:border-blue-500/50 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-400" />
                الرصيد المتاح
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">
                ${user.availableBalance || "0.00"}
              </p>
              <p className="text-xs text-slate-400 mt-2">جاهز للسحب</p>
            </CardContent>
          </Card>

          {/* Total Points Card */}
          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-400/10 border-purple-500/30 hover:border-purple-500/50 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                إجمالي النقاط
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{user.totalPoints || 0}</p>
              <p className="text-xs text-slate-400 mt-2">نقطة</p>
            </CardContent>
          </Card>

          {/* Level Card */}
          <Card className="bg-gradient-to-br from-green-600/20 to-green-400/10 border-green-500/30 hover:border-green-500/50 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                المستوى الحالي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">1</p>
              <p className="text-xs text-slate-400 mt-2">مبتدئ</p>
            </CardContent>
          </Card>

          {/* Withdrawn Card */}
          <Card className="bg-gradient-to-br from-pink-600/20 to-pink-400/10 border-pink-500/30 hover:border-pink-500/50 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-pink-400" />
                المسحوب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">
                ${user.totalWithdrawn || "0.00"}
              </p>
              <p className="text-xs text-slate-400 mt-2">إجمالي المسحوب</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                استطلاعات متاحة
              </CardTitle>
              <CardDescription>ابدأ الإجابة على الاستطلاعات الآن</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/surveys")}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                عرض الاستطلاعات
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Social Lite
              </CardTitle>
              <CardDescription>Share updates and connect with members</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/social")}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
              >
                Open community feed
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-400" />
                شارك واكسب
              </CardTitle>
              <CardDescription>شارك رابط الإحالة مع أصدقائك</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/referral")}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              >
                رابط الإحالة
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition-all">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-400" />
                طلب السحب
              </CardTitle>
              <CardDescription>اسحب أرباحك الآن</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/withdraw")}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                اطلب السحب
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-all">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-yellow-400" />
                الإحصائيات
              </CardTitle>
              <CardDescription>عرض تفاصيل أرباحك</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/statistics")}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
              >
                عرض الإحصائيات
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">نشاطك الأخير</CardTitle>
            <CardDescription>آخر الاستطلاعات والإحالات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-400">
              <p>لا توجد أنشطة حتى الآن</p>
              <p className="text-sm mt-2">ابدأ بالإجابة على الاستطلاعات الآن!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import {
  Copy,
  Share2,
  LogOut,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  TrendingUp,
  Award,
  Link as LinkIcon,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);

  // Mock referral link
  const referralLink = `https://workfriends.com/ref/${user?.id || "abc123xyz"}`;
  const referralCode = `WF${user?.id || "abc123xyz"}`;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("تم نسخ الرابط!");
    setTimeout(() => setCopied(false), 2000);
  };

  const supportTeamsLink = "https://teams.live.com/l/community/FEAnwIFHlUZlLKWtA?v=g1";
  const discordLink = "https://discord.gg/pFNQNCmy";

  const handleContactSupport = () => {
    window.open(supportTeamsLink, "_blank");
    toast.success("Opening Microsoft Teams support community...");
  };

  const handleJoinDiscord = () => {
    window.open(discordLink, "_blank");
    toast.success("Opening Discord community...");
  };

  const shareOnSocial = (platform: string) => {
    const message = `انضم إلى WorkFriends واكسب المال من الاستطلاعات! استخدم رابطي: ${referralLink}`;
    const encodedMessage = encodeURIComponent(message);

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedMessage}`,
      telegram: `https://t.me/share/url?url=${referralLink}&text=${encodedMessage}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${referralLink}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              className="text-slate-300 hover:text-white"
            >
              ← العودة
            </Button>
            <span className="text-white font-semibold">الملف الشخصي</span>
          </div>
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
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-700 mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-2xl">{user?.name || "المستخدم"}</CardTitle>
                <CardDescription className="text-slate-400">
                  عضو منذ {new Date().getFullYear()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Contact Information */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                معلومات الاتصال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">البريد الإلكتروني</label>
                <p className="text-white font-medium">{user?.email || "لم يتم تعيينه"}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">رقم الهاتف</label>
                <p className="text-white font-medium">+966 50 123 4567</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">الموقع</label>
                <div className="flex items-center gap-2 text-white font-medium">
                  <MapPin className="w-4 h-4 text-green-400" />
                  المملكة العربية السعودية
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                إحصائيات الحساب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">الاستطلاعات المكتملة</label>
                <p className="text-white font-medium text-lg">24</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">الأرباح الإجمالية</label>
                <p className="text-white font-medium text-lg">$12.50</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">المستوى الحالي</label>
                <p className="text-white font-medium text-lg">المستوى 2</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Section */}
        <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-purple-400" />
              رابط الإحالة الخاص بك
            </CardTitle>
            <CardDescription className="text-slate-400">
              شارك هذا الرابط مع أصدقائك واكسب 0.10 دولار لكل إحالة ناجحة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Referral Link Display */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
                <Button
                  onClick={() => copyToClipboard(referralLink)}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 whitespace-nowrap"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? "تم النسخ" : "نسخ"}
                </Button>
              </div>
            </div>

            {/* Referral Code */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <label className="text-sm text-slate-400 block mb-2">كود الإحالة</label>
              <div className="flex items-center justify-between gap-2">
                <div className="text-white font-mono text-lg font-bold">{referralCode}</div>
                <Button
                  onClick={() => copyToClipboard(referralCode)}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                onClick={() => shareOnSocial("whatsapp")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                onClick={() => shareOnSocial("telegram")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Telegram
              </Button>
              <Button
                onClick={() => shareOnSocial("twitter")}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Twitter
              </Button>
              <Button
                onClick={() => shareOnSocial("facebook")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Facebook
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referral Statistics */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              إحصائيات الإحالات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <label className="text-sm text-slate-400">الأصدقاء المدعوين</label>
                <p className="text-white font-bold text-2xl mt-2">12</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <label className="text-sm text-slate-400">الأصدقاء المسجلين</label>
                <p className="text-white font-bold text-2xl mt-2">8</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <label className="text-sm text-slate-400">الأرباح من الإحالات</label>
                <p className="text-white font-bold text-2xl mt-2 flex items-center gap-1">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  0.80
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="bg-slate-800/50 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              طرق الدفع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">حساب PayPal</p>
                  <p className="text-slate-400 text-sm">user@paypal.com</p>
                </div>
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                  تعديل
                </Button>
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">حساب بنكي</p>
                  <p className="text-slate-400 text-sm">لم يتم تعيينه</p>
                </div>
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                  إضافة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-700/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              Support & Help
            </CardTitle>
            <CardDescription className="text-slate-400">
              Need help? Contact our support team via Microsoft Teams
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300">
              Have questions or need assistance? Join our Microsoft Teams community to connect with our support team and other users.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={handleContactSupport}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Microsoft Teams
              </Button>
              <Button
                onClick={handleJoinDiscord}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Join Discord
              </Button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Click above to join our support community on Microsoft Teams or Discord
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

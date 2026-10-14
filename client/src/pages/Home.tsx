import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/_core/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  Sparkles,
  TrendingUp,
  Users,
  Award,
  DollarSign,
  Share2,
  Github,
  Zap,
  Code2,
} from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  // Show loading or redirect message while checking auth
  if (isAuthenticated && user) {
    return null;
  }

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
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              Sign In / Register
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Earn Money from{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Surveys
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users earning real money by sharing their opinions. Complete surveys,
            refer friends, and watch your earnings grow.
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-lg"
          >
            Get Started Now
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition">
            <CardHeader>
              <Sparkles className="w-8 h-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Easy Surveys</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Complete surveys in minutes and earn money instantly
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition">
            <CardHeader>
              <Share2 className="w-8 h-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">Referral Bonus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Invite friends and earn $0.10 for each successful referral
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition">
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
              <CardTitle className="text-white">Multiple Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Earn from surveys, Google Play downloads, and active users
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-orange-500/50 transition">
            <CardHeader>
              <DollarSign className="w-8 h-8 text-orange-400 mb-2" />
              <CardTitle className="text-white">Fast Withdrawal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Withdraw your earnings via PayPal or direct bank transfer
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { number: "1", title: "Sign Up", desc: "Create your account in seconds" },
              { number: "2", title: "Complete Surveys", desc: "Answer surveys and earn points" },
              { number: "3", title: "Earn More", desc: "Refer friends and get bonuses" },
              { number: "4", title: "Withdraw", desc: "Cash out anytime you want" },
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center font-bold text-white text-2xl mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Integrated with Developer Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* GitHub Integration */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700 hover:border-slate-600 transition">
              <CardHeader>
                <Github className="w-8 h-8 text-white mb-2" />
                <CardTitle className="text-white">GitHub Integration</CardTitle>
                <CardDescription className="text-slate-400">
                  Manage code versions and releases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm mb-4">
                  Connect your GitHub repository to track platform updates and manage code
                  deployments seamlessly.
                </p>
                <a
                  href="https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                    Connect GitHub
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Claude AI Integration */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700 hover:border-slate-600 transition">
              <CardHeader>
                <Zap className="w-8 h-8 text-yellow-400 mb-2" />
                <CardTitle className="text-white">Claude AI Integration</CardTitle>
                <CardDescription className="text-slate-400">
                  Intelligent survey analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm mb-4">
                  Leverage Claude AI for advanced survey analysis, report generation, and
                  intelligent insights.
                </p>
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                    Connect Claude
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* VS Code Integration */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700 hover:border-slate-600 transition">
              <CardHeader>
                <Code2 className="w-8 h-8 text-blue-400 mb-2" />
                <CardTitle className="text-white">VS Code Integration</CardTitle>
                <CardDescription className="text-slate-400">
                  Direct code editing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm mb-4">
                  Edit and manage platform code directly from VS Code with our extension and
                  development tools.
                </p>
                <a
                  href="https://marketplace.visualstudio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Install Extension
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <Card className="bg-slate-800/50 border-slate-700 text-center">
            <CardContent className="pt-6">
              <p className="text-4xl font-bold text-blue-400 mb-2">50K+</p>
              <p className="text-slate-400">Active Users</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 text-center">
            <CardContent className="pt-6">
              <p className="text-4xl font-bold text-purple-400 mb-2">$2M+</p>
              <p className="text-slate-400">Paid Out</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 text-center">
            <CardContent className="pt-6">
              <p className="text-4xl font-bold text-green-400 mb-2">1000+</p>
              <p className="text-slate-400">Active Surveys</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Start Earning?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Join our community of survey takers and start earning money today!
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-lg"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">About</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <a href="https://teams.live.com/l/community/FEAnwIFHlUZlLKWtA?v=g1" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                    Microsoft Teams Community
                  </a>
                </li>
                <li>
                  <a href="https://discord.gg/pFNQNCmy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                    Discord Community
                  </a>
                </li>
                <li>
                  <a href="mailto:rekhisachraf.com83@gmail.com" className="hover:text-white transition">
                    Email Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700/50 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2026 WorkFriends. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

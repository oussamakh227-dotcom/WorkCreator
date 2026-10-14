import { useLanguage } from "@/_core/hooks/useLanguage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shield, Network, Zap, TrendingUp, Lock } from "lucide-react";

export default function RootChainNetwork() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  const sections = [
    {
      icon: Network,
      title: "Network Stability",
      description: "Clear rules ensure consistent performance and prevent disruptions across the RootChain infrastructure."
    },
    {
      icon: Lock,
      title: "System Security",
      description: "Compliance protects the network from misuse, vulnerabilities, and harmful behaviors."
    },
    {
      icon: Zap,
      title: "Operational Clarity",
      description: "Defined terms help every participant understand their role and responsibilities within the chain."
    },
    {
      icon: TrendingUp,
      title: "Reliable Output",
      description: "Adhering to guidelines ensures accurate, trustworthy results across all RootChain processes."
    },
    {
      icon: Shield,
      title: "Scalable Growth",
      description: "A rule-based environment allows the network to expand safely and integrate with external systems."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Network RootChain Work
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            A structured digital network designed to ensure reliable operations, transparent workflows, and fair participation across all connected nodes.
          </p>
        </div>

        {/* Introduction */}
        <Card className="bg-slate-800 border-purple-500/30 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to RootChain</CardTitle>
            <CardDescription className="text-gray-300">
              Building Trust Through Integrity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-200">
            <p>
              By joining this network, every participant contributes to a secure, stable, and integrity-driven ecosystem where performance, trust, and compliance form the foundation of all activities.
            </p>
            <p>
              Network RootChain Work is built on structured operations, transparency, and integrity. Participation in this network requires full adherence to its rules and terms, ensuring stability, security, and fairness for all users.
            </p>
            <p className="text-purple-300 font-semibold">
              Integrity is not optional—it is the core principle that protects the network and empowers its growth.
            </p>
          </CardContent>
        </Card>

        {/* Importance of Rules */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Why Rules Matter</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Card key={index} className="bg-slate-800 border-purple-500/20 hover:border-purple-500/50 transition-all">
                  <CardHeader>
                    <Icon className="w-8 h-8 text-purple-400 mb-2" />
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300">{section.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Integrity Section */}
        <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Shield className="w-8 h-8 text-purple-400" />
              Integrity as a Core Value
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-200">
            <p>
              Integrity is the backbone of Network RootChain Work. It ensures fairness, transparency, and trust—allowing the system to operate without manipulation or unethical behavior.
            </p>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-purple-300 mb-1">Digital Integrity</h4>
                <p className="text-sm">Acting honestly within the network, without exploiting loopholes or harming others.</p>
              </div>
              <div>
                <h4 className="font-semibold text-purple-300 mb-1">Ethical Commitment</h4>
                <p className="text-sm">Respect for the system, its users, and the shared digital environment.</p>
              </div>
              <div>
                <h4 className="font-semibold text-purple-300 mb-1">Global Credibility</h4>
                <p className="text-sm">Strong integrity strengthens RootChain's global credibility and long-term reliability.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-6">
          <p className="text-lg text-gray-300">
            Help us improve the quality, stability, and fairness of the RootChain network by completing our survey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/surveys", { replace: false })}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold"
            >
              Take the Survey
            </Button>
            <Button
              onClick={() => window.open('https://discord.gg/pFNQNCmy', '_blank')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg font-semibold"
            >
              Join Discord Community
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

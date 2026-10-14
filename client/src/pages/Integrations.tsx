import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import {
  Github,
  Zap,
  Code2,
  ExternalLink,
  Check,
  AlertCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  longDescription: string;
  isConnected: boolean;
  connectUrl: string;
  documentation: string;
  status: "connected" | "disconnected" | "pending";
  lastConnected?: string;
  features: string[];
}

export default function Integrations() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "github",
      name: "GitHub",
      icon: <Github className="w-8 h-8" />,
      description: "Connect your GitHub repository",
      longDescription:
        "Integrate your GitHub repository to manage code versions, track commits, and automate deployments. Access your code directly from the platform.",
      isConnected: false,
      connectUrl: "https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID",
      documentation: "https://docs.github.com/en/apps/oauth-apps",
      status: "disconnected",
      features: [
        "Repository management",
        "Commit tracking",
        "Webhook integration",
        "Release management",
        "Code deployment",
        "Collaboration tools",
      ],
    },
    {
      id: "claude",
      name: "Claude AI",
      icon: <Zap className="w-8 h-8" />,
      description: "AI-powered survey analysis",
      longDescription:
        "Leverage Claude AI for intelligent survey analysis, report generation, and actionable insights. Automate data processing and get smart recommendations.",
      isConnected: false,
      connectUrl: "https://console.anthropic.com",
      documentation: "https://docs.anthropic.com",
      status: "disconnected",
      features: [
        "Survey analysis",
        "Report generation",
        "Sentiment detection",
        "Insight extraction",
        "Recommendation engine",
        "Data processing",
      ],
    },
    {
      id: "vscode",
      name: "VS Code",
      icon: <Code2 className="w-8 h-8" />,
      description: "Direct code editing",
      longDescription:
        "Edit and manage platform code directly from VS Code. Install our extension for seamless development workflow and real-time synchronization.",
      isConnected: false,
      connectUrl: "https://marketplace.visualstudio.com",
      documentation: "https://code.visualstudio.com/docs",
      status: "disconnected",
      features: [
        "Direct code editing",
        "Real-time sync",
        "Debug tools",
        "Terminal access",
        "Git integration",
        "Extension support",
      ],
    },
  ]);

  const handleConnect = (integrationId: string) => {
    const integration = integrations.find((i) => i.id === integrationId);
    if (!integration) return;

    if (integrationId === "github") {
      window.open(integration.connectUrl, "_blank");
    } else if (integrationId === "claude") {
      window.open(integration.connectUrl, "_blank");
    } else if (integrationId === "vscode") {
      window.open(integration.connectUrl, "_blank");
    }

    // Simulate connection after a delay
    setTimeout(() => {
      setIntegrations(
        integrations.map((i) =>
          i.id === integrationId
            ? {
                ...i,
                isConnected: true,
                status: "connected",
                lastConnected: new Date().toLocaleString(),
              }
            : i
        )
      );
      toast.success(`${integration.name} connected successfully!`);
    }, 2000);
  };

  const handleDisconnect = (integrationId: string) => {
    const integration = integrations.find((i) => i.id === integrationId);
    if (!integration) return;

    setIntegrations(
      integrations.map((i) =>
        i.id === integrationId
          ? {
              ...i,
              isConnected: false,
              status: "disconnected",
              lastConnected: undefined,
            }
          : i
      )
    );
    toast.success(`${integration.name} disconnected successfully!`);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
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
              ← Back to Dashboard
            </Button>
            <span className="text-white font-semibold">Integrations</span>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Developer Integrations</h1>
          <p className="text-slate-400 text-lg">
            Connect your favorite development tools to enhance your WorkFriends experience
          </p>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {integrations.map((integration) => (
            <Card
              key={integration.id}
              className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition overflow-hidden"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-slate-400">{integration.icon}</div>
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      integration.isConnected
                        ? "bg-green-900/30 text-green-400"
                        : "bg-slate-700/50 text-slate-400"
                    }`}
                  >
                    {integration.isConnected ? (
                      <>
                        <Check className="w-3 h-3" />
                        Connected
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        Not Connected
                      </>
                    )}
                  </div>
                </div>
                <CardTitle className="text-white text-2xl">{integration.name}</CardTitle>
                <CardDescription className="text-slate-400">
                  {integration.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <p className="text-slate-300">{integration.longDescription}</p>

                {/* Features */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Key Features</h4>
                  <ul className="grid grid-cols-2 gap-2">
                    {integration.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-400 text-sm">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Last Connected */}
                {integration.lastConnected && (
                  <p className="text-slate-500 text-xs">
                    Last connected: {integration.lastConnected}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  {integration.isConnected ? (
                    <>
                      <Button
                        onClick={() => handleDisconnect(integration.id)}
                        variant="outline"
                        className="flex-1 border-red-600 text-red-400 hover:bg-red-900/20"
                      >
                        Disconnect
                      </Button>
                      <Button
                        onClick={() => window.open(integration.documentation, "_blank")}
                        variant="outline"
                        className="flex-1 border-slate-600 text-slate-300"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Docs
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleConnect(integration.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Connect Now
                      </Button>
                      <Button
                        onClick={() => window.open(integration.documentation, "_blank")}
                        variant="outline"
                        className="flex-1 border-slate-600 text-slate-300"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Learn More
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Integration Status Overview */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Integration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400">{integration.icon}</div>
                    <div>
                      <p className="text-white font-medium">{integration.name}</p>
                      <p className="text-slate-400 text-sm">
                        {integration.isConnected
                          ? "Active and syncing"
                          : "Ready to connect"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      integration.isConnected ? "bg-green-500" : "bg-slate-500"
                    }`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-700/30 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-4">
              Check out our documentation and guides for setting up integrations:
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="https://docs.github.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-blue-600 text-blue-400">
                  GitHub Docs
                </Button>
              </a>
              <a href="https://docs.anthropic.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-yellow-600 text-yellow-400">
                  Claude Docs
                </Button>
              </a>
              <a href="https://code.visualstudio.com/docs" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-blue-600 text-blue-400">
                  VS Code Docs
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

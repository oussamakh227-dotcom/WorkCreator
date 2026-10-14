import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Surveys from "@/pages/Surveys";
import SurveyDetail from "@/pages/SurveyDetail";
import Profile from "@/pages/Profile";
import AdminPanel from "@/pages/AdminPanel";
import Integrations from "@/pages/Integrations";
import OnboardingSurvey from "@/pages/OnboardingSurvey";
import NotFound from "@/pages/NotFound";
import RootChainNetwork from "@/pages/RootChainNetwork";
import RootChainSurvey from "@/pages/RootChainSurvey";
import UserProfile from "@/pages/UserProfile";
import SocialFeed from "@/pages/SocialFeed";
import Referral from "@/pages/Referral";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/surveys"} component={Surveys} />
      <Route path={"/survey/:id"} component={SurveyDetail} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/user/:id"} component={UserProfile} />
      <Route path={"/user-profile"} component={UserProfile} />
      <Route path={"/social"} component={SocialFeed} />
      <Route path={"/referral"} component={Referral} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/integrations"} component={Integrations} />
      <Route path={"/rootchain"} component={RootChainNetwork} />
      <Route path={"/rootchain-survey"} component={RootChainSurvey} />
      <Route path={"/onboarding"} component={OnboardingSurvey} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

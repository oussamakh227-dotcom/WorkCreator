import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface SurveyData {
  reasonJoin: string;
  mainInterest: string;
  contentYouLike: string;
  contentYouPost: string;
  goal30Days: string;
  workStyle: string;
}

export default function OnboardingSurvey() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SurveyData>({
    reasonJoin: "",
    mainInterest: "",
    contentYouLike: "",
    contentYouPost: "",
    goal30Days: "",
    workStyle: "",
  });
  const completeOnboarding = trpc.user.completeOnboarding.useMutation();

  const handleInputChange = (field: keyof SurveyData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast.error("Pasting is not allowed in this survey");
  };

  const isFormValid = Object.values(formData).every(value => value.trim().length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!user) {
      toast.error("Please log in first");
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding.mutateAsync(formData);

      toast.success("Survey submitted successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit survey. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Welcome to WorkFriends!
          </h1>
          <p className="text-lg text-gray-300">
            Please complete this mandatory survey to get started
          </p>
        </div>

        {/* Info Card */}
        <Card className="bg-slate-800/50 border-blue-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              Mandatory Onboarding Survey
            </CardTitle>
            <CardDescription className="text-gray-300">
              This survey helps us understand you better and personalize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="text-gray-300">
            <p>
              Please answer all questions honestly and thoroughly. Your responses will help us provide you with better content and opportunities that match your interests.
            </p>
          </CardContent>
        </Card>

        {/* Survey Form */}
        <Card className="bg-slate-800 border-purple-500/30">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question 1 */}
              <div className="space-y-2">
                <label className="block text-white font-semibold">
                  Why did you join WorkFriends?
                </label>
                <Textarea
                  value={formData.reasonJoin}
                  onChange={(e) => handleInputChange("reasonJoin", e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Tell us your reason for joining..."
                  className="min-h-24 bg-slate-700 border-purple-500/30 text-white placeholder-gray-400 focus:border-purple-500"
                  disabled={isSubmitting}
                />
              </div>

              {/* Question 2 */}
              <div className="space-y-2">
                <label className="block text-white font-semibold">
                  What is your main interest?
                </label>
                <Textarea
                  value={formData.mainInterest}
                  onChange={(e) => handleInputChange("mainInterest", e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Describe your main interest..."
                  className="min-h-24 bg-slate-700 border-purple-500/30 text-white placeholder-gray-400 focus:border-purple-500"
                  disabled={isSubmitting}
                />
              </div>

              {/* Question 3 */}
              <div className="space-y-2">
                <label className="block text-white font-semibold">
                  What type of content interests you?
                </label>
                <Textarea
                  value={formData.contentYouLike}
                  onChange={(e) => handleInputChange("contentYouLike", e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Describe the content you like..."
                  className="min-h-24 bg-slate-700 border-purple-500/30 text-white placeholder-gray-400 focus:border-purple-500"
                  disabled={isSubmitting}
                />
              </div>

              {/* Question 4 */}
              <div className="space-y-2">
                <label className="block text-white font-semibold">
                  What type of content do you post?
                </label>
                <Textarea
                  value={formData.contentYouPost}
                  onChange={(e) => handleInputChange("contentYouPost", e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Describe the content you post..."
                  className="min-h-24 bg-slate-700 border-purple-500/30 text-white placeholder-gray-400 focus:border-purple-500"
                  disabled={isSubmitting}
                />
              </div>

              {/* Question 5 */}
              <div className="space-y-2">
                <label className="block text-white font-semibold">
                  What is your goal for the next 30 days?
                </label>
                <Textarea
                  value={formData.goal30Days}
                  onChange={(e) => handleInputChange("goal30Days", e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Tell us your 30-day goal..."
                  className="min-h-24 bg-slate-700 border-purple-500/30 text-white placeholder-gray-400 focus:border-purple-500"
                  disabled={isSubmitting}
                />
              </div>

              {/* Question 6 */}
              <div className="space-y-2">
                <label className="block text-white font-semibold">
                  How do you work when receiving a task?
                </label>
                <Textarea
                  value={formData.workStyle}
                  onChange={(e) => handleInputChange("workStyle", e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Describe your work style..."
                  className="min-h-24 bg-slate-700 border-purple-500/30 text-white placeholder-gray-400 focus:border-purple-500"
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`w-full py-3 font-semibold text-lg ${
                  isFormValid && !isSubmitting
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    : "bg-gray-600 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit Survey
                  </>
                )}
              </Button>

              {/* Info Text */}
              <p className="text-xs text-gray-400 text-center">
                All fields are required. Pasting content is not allowed.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>
            This survey is mandatory and must be completed to access your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

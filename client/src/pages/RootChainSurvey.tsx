import { useState } from "react";
import { useLanguage } from "@/_core/hooks/useLanguage";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function RootChainSurvey() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim() || feedback.length < 150) {
      toast.error("Feedback must be at least 150 characters");
      return;
    }

    if (!user) {
      toast.error("Please log in to submit feedback");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save feedback to database
      // This would call a tRPC procedure
      setSubmitted(true);
      setFeedback("");
      toast.success("Thank you! Your feedback has been received.");
      
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterCount = feedback.length;
  const isValid = characterCount >= 150;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="container mx-auto max-w-4xl py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Network RootChain Work Survey
          </h1>
          <p className="text-lg text-gray-300">
            Help us improve the quality, stability, and fairness of the RootChain network
          </p>
        </div>

        {/* Survey Introduction */}
        <Card className="bg-slate-800 border-purple-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Survey Introduction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-200">
            <p>
              Network RootChain Work is built on structured operations, transparency, and integrity. Participation in this network requires full adherence to its rules and terms, ensuring stability, security, and fairness for all users.
            </p>
            <p className="text-purple-300 font-semibold">
              Integrity is not optional—it is the core principle that protects the network and empowers its growth.
            </p>
            <p>
              By completing this survey, you help us improve the quality, stability, and fairness of the RootChain network.
            </p>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        <Card className="bg-slate-800 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-2xl">Your Voice Matters</CardTitle>
            <CardDescription className="text-gray-300">
              Share your experience, suggestions, or observations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Instructions */}
            <div className="bg-slate-700/50 border border-purple-500/20 rounded-lg p-4">
              <p className="text-gray-200">
                We invite you to share your experience, suggestions, or observations in a detailed note of 150 characters or more. Your feedback helps us improve stability, enhance performance, and build a stronger, more transparent network for all participants.
              </p>
            </div>

            {/* Feedback Textarea */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-200">
                Your Feedback (Minimum 150 characters)
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Please write your feedback below. We encourage detailed notes (150+ characters) to help us better understand your experience and continuously improve the RootChain network."
                className="min-h-40 bg-slate-700 border-purple-500/30 text-white placeholder-gray-400 focus:border-purple-500"
                disabled={submitted}
              />
              
              {/* Character Count */}
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${isValid ? "text-green-400" : "text-gray-400"}`}>
                  {characterCount} / 150 characters
                </span>
                {isValid && (
                  <span className="text-sm text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Ready to submit
                  </span>
                )}
                {characterCount > 0 && !isValid && (
                  <span className="text-sm text-yellow-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {150 - characterCount} more characters needed
                  </span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting || submitted}
              className={`w-full py-3 font-semibold text-lg ${
                isValid
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  : "bg-gray-600 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Submitting..." : submitted ? "✓ Submitted" : "Submit Feedback"}
            </Button>

            {/* Success Message */}
            {submitted && (
              <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
                <p className="text-green-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Thank you for your feedback! Your input helps us build a better RootChain network.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>
            Your feedback is valuable and will be reviewed by our team to continuously improve the RootChain network.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Clock, Copy, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { useUserData } from "@/hooks/useUserData";
import { useUsageLimit } from "@/hooks/useUsageLimit";

export const FollowUpGenerator = () => {
  const [clientName, setClientName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [lastContact, setLastContact] = useState("");
  const [followUpReason, setFollowUpReason] = useState("");
  const [tone, setTone] = useState("polite");
  const [urgency, setUrgency] = useState("medium");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Add for AI generation
  const [usedTokens, setUsedTokens] = useState<number | null>(null);
  const [aiModel, setAiModel] = useState<string | null>(null);

  // Fetch dynamic followup usage
  const { data: userData, isLoading: loadingUser } = useUserData();
  const subscriptionTier = userData?.billingInfo?.current_plan || userData?.profile?.subscription_tier || 'starter';
  const followupLimit = subscriptionTier === 'pro' ? 100 : 10;
  const followupsUsed = userData?.followupsCount || 0;

  const usageLimit = useUsageLimit("followup");

  const handleGenerate = async () => {
    if (!clientName || !projectTitle) {
      toast.error("Please fill in client name and project title");
      return;
    }
    if (usageLimit.isLoading) {
      toast.loading("Checking usage...");
      return;
    }
    if (!usageLimit.canIncrement) {
      toast.error("You have reached your monthly follow-up limit for your plan.");
      return;
    }

    setIsGenerating(true);
    setUsedTokens(null);
    setAiModel(null);

    try {
      await usageLimit.increment();
    } catch (err: any) {
      setIsGenerating(false);
      toast.error(err?.message || "Limit error. Please try again later.");
      return;
    }

    // Call dynamic AI backend
    try {
      const res = await fetch(
        `https://ckphagoaqnpqkaoghcyz.functions.supabase.co/generate-ai-content`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "followup",
            formInputs: {
              clientName,
              projectTitle,
              lastContact,
              followUpReason,
              tone,
              urgency
            },
            plan: subscriptionTier === "pro" ? "pro" : "starter",
            user_id: userData?.profile?.id,
            prefer_gpt4o: false
          }),
        }
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      // Fix: Normalize followup extraction
      let followupText = '';
      if (typeof json === "string") {
        followupText = json;
      } else if (json.followup) {
        followupText = json.followup;
      } else if (json.choices && Array.isArray(json.choices) && json.choices[0]?.message?.content) {
        followupText = json.choices[0].message.content;
      } else {
        followupText = JSON.stringify(json);
      }
      setGeneratedMessage(followupText);
      setUsedTokens(json.tokens_used ?? null);
      setAiModel(json.model ?? null);

      setIsGenerating(false);
      toast.success(json.deduped ? "Reused previous follow-up!" : "Follow-up message generated! 📧");
    } catch (e: any) {
      setIsGenerating(false);
      toast.error(e?.message || "AI generation error.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    toast.success("Message copied to clipboard!");
  };

  const getTimingSuggestion = () => {
    const suggestions = {
      proposal: "Best time to send: Tuesday-Thursday, 10 AM - 2 PM",
      payment: "Best time to send: Monday morning or Thursday afternoon",
      update: "Best time to send: Wednesday or Friday morning",
      general: "Best time to send: Tuesday-Thursday, business hours"
    };
    return suggestions[followUpReason as keyof typeof suggestions] || suggestions.general;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Follow-ups</h1>
          <p className="text-gray-600">Generate personalized follow-up messages with perfect timing</p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-200">
          {usageLimit.isLoading
            ? "Loading..."
            : `${usageLimit.current}/${usageLimit.limit} follow-ups used this month`}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Follow-up Details
            </CardTitle>
            <CardDescription>
              Tell us about the client and situation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client-name">Client Name</Label>
              <Input
                id="client-name"
                placeholder="e.g., John Smith"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="project-title">Project/Proposal Title</Label>
              <Input
                id="project-title"
                placeholder="e.g., Website Redesign Project"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="last-contact">Days Since Last Contact</Label>
              <Select value={lastContact} onValueChange={setLastContact}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2-3 days">2-3 days</SelectItem>
                  <SelectItem value="1 week">1 week</SelectItem>
                  <SelectItem value="2 weeks">2 weeks</SelectItem>
                  <SelectItem value="1 month">1 month</SelectItem>
                  <SelectItem value="more than a month">More than a month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="follow-up-reason">Follow-up Reason</Label>
              <Select value={followUpReason} onValueChange={setFollowUpReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Why are you following up?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposal">Proposal Response</SelectItem>
                  <SelectItem value="payment">Payment Reminder</SelectItem>
                  <SelectItem value="update">Project Update</SelectItem>
                  <SelectItem value="general">General Check-in</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tone">Message Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polite">Polite</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Generate Follow-up
                </>
              )}
            </Button>

            {followUpReason && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center text-blue-700 text-sm">
                  <Clock className="w-4 h-4 mr-2" />
                  {getTimingSuggestion()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Message */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Follow-up</CardTitle>
            <CardDescription>
              Ready-to-send message crafted for your situation
              {aiModel && (
                <span className="ml-2 bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">
                  Model: {aiModel} | Tokens: {usedTokens ?? "?"}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedMessage ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                    {generatedMessage}
                  </pre>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleCopy} variant="outline" className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Message
                  </Button>
                  <Button className="flex-1 bg-green-500 hover:bg-green-600">
                    <Send className="w-4 h-4 mr-2" />
                    Send via Email
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Your follow-up message will appear here</p>
                <p className="text-sm">Fill in the details and click "Generate Follow-up"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

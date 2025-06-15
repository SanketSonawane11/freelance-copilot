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

    // Increment usage BEFORE generating
    try {
      await usageLimit.increment();
    } catch (err: any) {
      setIsGenerating(false);
      toast.error(err?.message || "Limit error. Please try again later.");
      return;
    }

    // Simulate AI generation
    setTimeout(() => {
      const urgencyText = urgency === "high" ? "I wanted to quickly follow up" : 
                         urgency === "low" ? "I hope you're doing well and wanted to gently follow up" :
                         "I hope this message finds you well";

      const reasonText = followUpReason === "payment" ? "regarding the pending payment for" :
                        followUpReason === "proposal" ? "on the proposal I sent for" :
                        followUpReason === "update" ? "to provide an update on" :
                        "regarding";

      const sampleMessage = `Subject: ${urgency === "high" ? "Quick follow-up" : "Following up"} - ${projectTitle}

Hi ${clientName},

${urgencyText}. ${reasonText} ${projectTitle}.

${followUpReason === "payment" ? 
  "I wanted to check if you received the invoice and if there are any questions about the payment process. Please let me know if you need any additional information or documentation." :
  followUpReason === "proposal" ? 
  `It's been ${lastContact || "a few days"} since I submitted the proposal, and I wanted to see if you had a chance to review it. I'm excited about the possibility of working together and would be happy to discuss any questions or modifications you might have.` :
  `I wanted to touch base and see if there are any updates or if you need any additional information from my side. I'm here to help and ensure everything moves forward smoothly.`}

${tone === "friendly" ? "Looking forward to hearing from you soon! 😊" :
  tone === "formal" ? "I look forward to your response at your earliest convenience." :
  "Please let me know if you have any questions or need any clarification."}

Best regards,
[Your Name]
[Your Contact Information]`;

      setGeneratedMessage(sampleMessage);
      setIsGenerating(false);
      toast.success("Follow-up message generated! 📧");
    }, 1500);
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

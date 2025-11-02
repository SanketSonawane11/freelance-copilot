import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Sparkles, Copy, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useUserData } from "@/hooks/useUserData";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

export const FollowUpGenerator = () => {
  const [clientName, setClientName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [lastContact, setLastContact] = useState("");
  const [followUpReason, setFollowUpReason] = useState("");
  const [tone, setTone] = useState("polite");
  const [urgency, setUrgency] = useState("medium");
  const [generatedFollowUp, setGeneratedFollowUp] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [usedTokens, setUsedTokens] = useState<number | null>(null);
  const [aiModel, setAiModel] = useState<string | null>(null);

  const { data: userData } = useUserData();
  const subscriptionTier = userData?.billingInfo?.current_plan || userData?.profile?.subscription_tier || "starter";
  const usageLimit = useUsageLimit("followup");

  const handleGenerate = async () => {
    if (!clientName || !projectTitle || !lastContact || !followUpReason) {
      toast.error("Please fill in all fields.");
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

    try {
      const { data: json, error } = await supabase.functions.invoke("generate-ai-content", {
        body: {
          type: "followup",
          formInputs: {
            clientName,
            projectTitle,
            lastContact,
            followUpReason,
            tone,
            urgency,
            timestamp: Date.now(),
            randomSeed: Math.random().toString(36).substring(7),
          },
          plan: subscriptionTier === "pro" ? "pro" : "starter",
          user_id: userData?.profile?.id,
          prefer_gpt4o: false,
        },
      });

      if (error) throw new Error(error.message || "AI generation error");
      if (!json) throw new Error("Empty AI response");

      const followUpText = typeof json === "object" && (json.content || json.raw_content) ? json.content || json.raw_content : "";

      setGeneratedFollowUp(followUpText);
      setUsedTokens(json.tokens_used ?? null);
      setAiModel(json.model ?? null);

      setIsGenerating(false);
      toast.success("Follow-up generated successfully! ✨");
    } catch (e: any) {
      setIsGenerating(false);
      toast.error(e?.message || "AI generation error.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedFollowUp);
    toast.success("Follow-up copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([generatedFollowUp], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "followup.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Follow-up downloaded!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Smart Follow-Up Generator</h1>
          <p className="text-muted-foreground mt-1">Generate effective client follow-ups with AI</p>
        </div>
        <Badge variant="secondary" className="text-sm font-medium">
          {usageLimit.isLoading ? "Loading..." : `${usageLimit.current ?? 0}/${usageLimit.limit ?? 0} used`}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MessageSquare className="w-5 h-5 mr-2 text-primary" />
              Follow-Up Details
            </CardTitle>
            <CardDescription>Provide information about the client and reason for follow-up</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-sm font-medium">Client Name *</Label>
              <Input
                id="client-name"
                placeholder="e.g., Sanket"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-title" className="text-sm font-medium">Project / Proposal *</Label>
              <Input
                id="project-title"
                placeholder="e.g., Website Redesign"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-contact" className="text-sm font-medium">Last Contact *</Label>
              <Input
                id="last-contact"
                placeholder="e.g., 1 week ago"
                value={lastContact}
                onChange={(e) => setLastContact(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followup-reason" className="text-sm font-medium">Reason for Follow-Up *</Label>
              <Textarea
                id="followup-reason"
                placeholder="e.g., Payment update, project status check, etc."
                value={followUpReason}
                onChange={(e) => setFollowUpReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tone" className="text-sm font-medium">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polite">Polite</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="assertive">Assertive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency" className="text-sm font-medium">Urgency</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger className="h-11">
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
            <Button onClick={handleGenerate} className="w-full h-11 text-base font-medium" disabled={isGenerating} size="lg">
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Follow-Up
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Follow-Up */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Generated Follow-Up</CardTitle>
            <CardDescription>AI-crafted follow-up ready to send</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedFollowUp ? (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto border">
                  <div className="prose prose-sm max-w-none text-foreground">
                    <ReactMarkdown>{generatedFollowUp}</ReactMarkdown>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant="outline" className="flex-1 h-11 font-medium">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button onClick={handleDownload} variant="outline" className="flex-1 h-11 font-medium">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium">Your generated follow-up will appear here</p>
                <p className="text-sm mt-1">Fill in the details and click "Generate Follow-Up"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

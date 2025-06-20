import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Sparkles, Copy, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useUserData } from "@/hooks/useUserData";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import { supabase } from "@/integrations/supabase/client";

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

  // Fetch dynamic proposal usage
  const { data: userData, isLoading: loadingUser } = useUserData();
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

    // Use Supabase client to call edge function (with auth, to avoid 401)
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
            // Add timestamp to force regeneration
            timestamp: Date.now(),
            randomSeed: Math.random().toString(36).substring(7)
          },
          plan: subscriptionTier === "pro" ? "pro" : "starter",
          user_id: userData?.profile?.id,
          prefer_gpt4o: false,
        }
      });

      if (error) throw new Error(error.message || "AI generation error");
      if (!json) throw new Error("Empty AI response");

      // Normalize followup extraction
      let followUpText = '';
      if (typeof json === "string") {
        followUpText = json;
      } else if ((json as any).followup) {
        followUpText = (json as any).followup;
      } else if ((json as any).choices && Array.isArray((json as any).choices) && (json as any).choices[0]?.message?.content) {
        followUpText = (json as any).choices[0].message.content;
      } else {
        followUpText = JSON.stringify(json);
      }

      setGeneratedFollowUp(followUpText);
      setUsedTokens((json as any).tokens_used ?? null);
      setAiModel((json as any).model ?? null);

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Follow-Up Generator</h1>
          <p className="text-gray-600">Generate effective client follow-ups with AI</p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-200">
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
              <FileText className="w-5 h-5 mr-2" />
              Follow-Up Details
            </CardTitle>
            <CardDescription>
              Provide information about the client and reason for follow-up
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client-name">Client Name</Label>
              <Input
                id="client-name"
                placeholder="e.g., Sanket"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="project-title">Project / Proposal</Label>
              <Input
                id="project-title"
                placeholder="e.g., Website Redesign"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="last-contact">Last Contact</Label>
              <Input
                id="last-contact"
                placeholder="e.g., 1 week ago"
                value={lastContact}
                onChange={(e) => setLastContact(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="followup-reason">Reason for Follow-Up</Label>
              <Textarea
                id="followup-reason"
                placeholder="e.g., Payment update"
                value={followUpReason}
                onChange={(e) => setFollowUpReason(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polite">Polite</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="assertive">Assertive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="urgency">Urgency</Label>
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
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Follow-Up
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Follow-Up */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Follow-Up</CardTitle>
            <CardDescription>
              AI-crafted follow-up ready to send
              {aiModel && (
                <span className="ml-2 bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">
                  Model: {aiModel} | Tokens: {usedTokens ?? "?"}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedFollowUp ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                    {generatedFollowUp}
                  </pre>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleCopy} variant="outline" className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button onClick={handleDownload} variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Your generated follow-up will appear here</p>
                <p className="text-sm">Fill in the details and click "Generate Follow-Up"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

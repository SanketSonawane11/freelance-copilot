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

export const ProposalWriter = () => {
  const [projectDetails, setProjectDetails] = useState("");
  const [clientInfo, setClientInfo] = useState("");
  const [projectType, setProjectType] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [tone, setTone] = useState("professional");
  const [generatedProposal, setGeneratedProposal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [usedTokens, setUsedTokens] = useState<number | null>(null);
  const [aiModel, setAiModel] = useState<string | null>(null);

  const { data: userData } = useUserData();
  const subscriptionTier = userData?.billingInfo?.current_plan || userData?.profile?.subscription_tier || 'starter';
  const usageLimit = useUsageLimit("proposal");

  const handleGenerate = async () => {
    if (!projectDetails || !clientInfo) {
      toast.error("Please fill in project details and client information");
      return;
    }
    if (usageLimit.isLoading) {
      toast.loading("Checking usage...");
      return;
    }
    if (!usageLimit.canIncrement) {
      toast.error("You have reached your monthly proposal limit for your plan.");
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
          type: "proposal",
          formInputs: {
            clientInfo,
            projectType,
            projectDetails,
            budget,
            timeline,
            tone
          },
          plan: subscriptionTier === "pro" ? "pro" : "starter",
          user_id: userData?.profile?.id,
          prefer_gpt4o: false
        }
      });

      if (error) throw new Error(error.message || "AI generation error");
      if (!json) throw new Error("Empty AI response");

      const proposalText = json.content || "";
      setGeneratedProposal(proposalText);
      setUsedTokens(json.tokens_used ?? null);
      setAiModel(json.model ?? null);

      setIsGenerating(false);
      toast.success("Proposal generated successfully! ✨");
    } catch (e: any) {
      setIsGenerating(false);
      console.error('Error generating proposal:', e);
      toast.error(e?.message || "AI generation error.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedProposal);
    toast.success("Proposal copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([generatedProposal], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proposal.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Proposal downloaded!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">AI Proposal Writer</h1>
          <p className="text-muted-foreground mt-1">Generate compelling proposals that win clients</p>
        </div>
        <Badge variant="secondary" className="text-sm font-medium">
          {usageLimit.isLoading
            ? "Loading..."
            : `${usageLimit.current ?? 0}/${usageLimit.limit ?? 0} used`}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              Project Details
            </CardTitle>
            <CardDescription>
              Provide information about the project and client
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-info" className="text-sm font-medium">Client/Company Name *</Label>
              <Input
                id="client-info"
                placeholder="e.g., Tech Startup XYZ"
                value={clientInfo}
                onChange={(e) => setClientInfo(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-type" className="text-sm font-medium">Project Type</Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web-development">Web Development</SelectItem>
                  <SelectItem value="mobile-app">Mobile App</SelectItem>
                  <SelectItem value="content-writing">Content Writing</SelectItem>
                  <SelectItem value="graphic-design">Graphic Design</SelectItem>
                  <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                  <SelectItem value="video-editing">Video Editing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-details" className="text-sm font-medium">Project Requirements *</Label>
              <Textarea
                id="project-details"
                placeholder="Describe the project requirements, scope, and any specific details..."
                value={projectDetails}
                onChange={(e) => setProjectDetails(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm font-medium">Budget Range</Label>
                <Input
                  id="budget"
                  placeholder="e.g., ₹50,000 - ₹75,000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeline" className="text-sm font-medium">Timeline</Label>
                <Input
                  id="timeline"
                  placeholder="e.g., 2-3 weeks"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone" className="text-sm font-medium">Proposal Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerate} 
              className="w-full h-11 text-base font-medium"
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Proposal
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Proposal */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Generated Proposal</CardTitle>
            <CardDescription>
              AI-crafted proposal ready to send
              {aiModel && (
                <span className="ml-2 text-xs">
                  Model: {aiModel} | Tokens: {usedTokens ?? "?"}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedProposal ? (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto border">
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                    {generatedProposal}
                  </pre>
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
                  <FileText className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium">Your generated proposal will appear here</p>
                <p className="text-sm mt-1">Fill in the details and click "Generate Proposal"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

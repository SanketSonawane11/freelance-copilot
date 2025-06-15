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

  // Fetch dynamic proposal usage
  const { data: userData, isLoading: loadingUser } = useUserData();
  const subscriptionTier = userData?.billingInfo?.current_plan || userData?.profile?.subscription_tier || 'starter';
  const proposalLimit = subscriptionTier === 'pro' ? 100 : 10;
  const proposalsUsed = userData?.proposalsCount || 0;

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

    // Call dynamic AI backend
    try {
      const res = await fetch(
        `https://ckphagoaqnpqkaoghcyz.functions.supabase.co/generate-ai-content`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
          }),
        }
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      // Fix: Always set proposal, even if plain string fallback
      setGeneratedProposal(json.proposal || (typeof json === "string" ? json : ""));
      setUsedTokens(json.tokens_used ?? null);
      setAiModel(json.model ?? null);
      setIsGenerating(false);
      toast.success(json.deduped ? "Reused previous proposal!" : "Proposal generated successfully! ✨");
    } catch (e: any) {
      setIsGenerating(false);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Proposal Writer</h1>
          <p className="text-gray-600">Generate compelling proposals that win clients</p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          {usageLimit.isLoading
            ? "Loading..."
            : `${usageLimit.current}/${usageLimit.limit} proposals used this month`}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Project Details
            </CardTitle>
            <CardDescription>
              Provide information about the project and client
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client-info">Client/Company Name</Label>
              <Input
                id="client-info"
                placeholder="e.g., Tech Startup XYZ"
                value={clientInfo}
                onChange={(e) => setClientInfo(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="project-type">Project Type</Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger>
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

            <div>
              <Label htmlFor="project-details">Project Requirements</Label>
              <Textarea
                id="project-details"
                placeholder="Describe the project requirements, scope, and any specific details..."
                value={projectDetails}
                onChange={(e) => setProjectDetails(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Budget Range</Label>
                <Input
                  id="budget"
                  placeholder="e.g., ₹50,000 - ₹75,000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="timeline">Timeline</Label>
                <Input
                  id="timeline"
                  placeholder="e.g., 2-3 weeks"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tone">Proposal Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
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
                  Generate Proposal
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Proposal */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Proposal</CardTitle>
            <CardDescription>
              AI-crafted proposal ready to send
              {aiModel && (
                <span className="ml-2 bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">
                  Model: {aiModel} | Tokens: {usedTokens ?? "?"}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedProposal ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                    {generatedProposal}
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
                <p>Your generated proposal will appear here</p>
                <p className="text-sm">Fill in the details and click "Generate Proposal"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

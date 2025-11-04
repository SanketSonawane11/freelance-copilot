
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Sparkles, Zap, Check } from "lucide-react";
import { toast } from "sonner";
import { createInitialSubscription } from "@/utils/createInitialSubscription";
import { useNavigate } from "react-router-dom";
import { useRazorpaySubscription } from "@/hooks/useRazorpaySubscription";
import { getPlanLimits, getPlanPrice } from "@/utils/planLimits";
import AuthDiagnostics from "@/components/AuthDiagnostics";
import { ThemeToggle } from "@/components/ThemeToggle";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "basic" | "pro">("starter");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const navigate = useNavigate();
  const { createSubscription, isCreating } = useRazorpaySubscription();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) {
        // Better error handling for network issues
        if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
          console.error("Network error during signup:", error, "Origin:", window.location.origin);
          toast.error("Cannot reach Supabase Auth. Please check CORS configuration or try again.");
        } else {
          toast.error(error.message || "Failed to create account");
        }
        throw error;
      }

      if (data.user) {
        // Always create starter subscription first
        const { error: subscriptionError } = await createInitialSubscription(data.user.id, "starter");
        
        if (subscriptionError) {
          console.error("Failed to set initial subscription:", subscriptionError);
          toast.error("Account created but failed to set plan. Please contact support.");
          return;
        }

        // If user selected paid plan, trigger payment flow
        if (selectedPlan === "basic" || selectedPlan === "pro") {
          setPendingUser(data.user);
          toast.success("Account created! Please complete payment to activate your plan.");
          
          // Trigger Razorpay payment
          createSubscription(selectedPlan);
        } else {
          toast.success("Account created successfully! Please check your email to verify your account.");
          navigate("/");
        }
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Better error handling for network issues
        if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
          console.error("Network error during signin:", error, "Origin:", window.location.origin, "Endpoint: /auth/v1/token");
          toast.error("Cannot reach Supabase Auth from this origin. Please add your current origin to Auth → Allowed CORS origins and Additional Redirect URLs.");
        } else {
          toast.error(error.message || "Failed to sign in");
        }
        throw error;
      }
      toast.success("Signed in successfully!");
      navigate("/");
    } catch (error: any) {
      // Error already handled above
    } finally {
      setIsLoading(false);
    }
  };

  const PlanCard = ({ 
    plan, 
    title, 
    price, 
    features, 
    popular = false 
  }: { 
    plan: "starter" | "basic" | "pro";
    title: string;
    price: string;
    features: string[];
    popular?: boolean;
  }) => (
    <Card 
      className={`relative cursor-pointer transition-all duration-200 ${
        selectedPlan === plan 
          ? "ring-2 ring-primary bg-accent" 
          : "hover:shadow-md"
      } ${popular ? "border-primary" : ""}`}
      onClick={() => setSelectedPlan(plan)}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
            Most Popular
          </span>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center space-x-2">
          {plan === "starter" && <Brain className="w-5 h-5 text-muted-foreground" />}
          {plan === "basic" && <Sparkles className="w-5 h-5 text-primary" />}
          {plan === "pro" && <Zap className="w-5 h-5 text-primary" />}
          <span>{title}</span>
        </CardTitle>
        <div className="text-2xl font-bold text-foreground">
          {price}
          {plan !== "starter" && <span className="text-sm font-normal text-muted-foreground">/month</span>}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        {selectedPlan === plan && (
          <div className="mt-4 p-2 bg-primary/10 rounded-lg text-center">
            <span className="text-primary font-semibold text-sm">Selected Plan</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Freelancer Copilot
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">Your AI-powered freelancing assistant</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-center mb-6">Choose Your Plan</h2>
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
                  <PlanCard
                    plan="starter"
                    title="Starter"
                    price={`₹${getPlanPrice('starter').amount}`}
                    features={[
                      `${getPlanLimits('starter').displayProposals} AI proposals/month`,
                      `${getPlanLimits('starter').displayFollowups} smart follow-ups/month`,
                      `Basic invoice generation (${getPlanLimits('starter').displayInvoices} Invoices/month)`,
                      `Upto ${getPlanLimits('starter').displayClients} clients`,
                    ]}
                  />
                  <PlanCard
                    plan="basic"
                    title="Basic"
                    price={`₹${getPlanPrice('basic').amount}`}
                    features={[
                      `${getPlanLimits('basic').displayProposals} AI proposals/month`,
                      `${getPlanLimits('basic').displayFollowups} smart follow-ups/month`,
                      `Added invoice generation limit (${getPlanLimits('basic').displayInvoices} Invoices/month)`,
                      "Tax estimation tools",
                      `Upto ${getPlanLimits('basic').displayClients} Clients`,
                      "Priority support",
                    ]}
                    popular={true}
                  />
                  <PlanCard
                    plan="pro"
                    title="Pro"
                    price={`₹${getPlanPrice('pro').amount}`}
                    features={[
                      `${getPlanLimits('pro').displayProposals} AI proposals/month`,
                      `${getPlanLimits('pro').displayFollowups} smart follow-ups/month`,
                      "All premium features",
                      `Maximum invoice generation limit (${getPlanLimits('pro').displayInvoices} invoices/month)`,
                      `Upto ${getPlanLimits('pro').displayClients} Clients`,
                      "Tax estimation tools",
                      "Priority support",
                    ]}
                  />
                </div>
              </div>

              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Start with {selectedPlan} plan • 
                    {selectedPlan !== "starter" ? " Payment required to activate" : " Free forever"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading || isCreating}
                    >
                      {isLoading || isCreating ? "Creating Account..." : 
                       selectedPlan === "starter" ? "Create Free Account" : `Create Account & Pay ₹${selectedPlan === "basic" ? "149" : "349"}`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <AuthDiagnostics />
      </div>
    </div>
  );
};

export default Auth;

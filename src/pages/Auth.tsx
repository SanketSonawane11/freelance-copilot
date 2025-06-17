
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

      if (error) throw error;

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

      if (error) throw error;
      toast.success("Signed in successfully!");
      navigate("/");
    } catch (error: any) {
      console.error("Signin error:", error);
      toast.error(error.message || "Failed to sign in");
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
          ? "ring-2 ring-blue-500 bg-blue-50/50" 
          : "hover:shadow-md"
      } ${popular ? "border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50" : ""}`}
      onClick={() => setSelectedPlan(plan)}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Most Popular
          </span>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center space-x-2">
          {plan === "starter" && <Brain className="w-5 h-5 text-gray-600" />}
          {plan === "basic" && <Sparkles className="w-5 h-5 text-blue-600" />}
          {plan === "pro" && <Zap className="w-5 h-5 text-purple-600" />}
          <span>{title}</span>
        </CardTitle>
        <div className="text-2xl font-bold">
          {price}
          {plan !== "starter" && <span className="text-sm font-normal text-gray-500">/month</span>}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-2 text-sm">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        {selectedPlan === plan && (
          <div className="mt-4 p-2 bg-blue-100 rounded-lg text-center">
            <span className="text-blue-700 font-semibold text-sm">Selected Plan</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-20 blur-xl"></div>
              <div className="relative w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Freelancer Copilot
            </h1>
          </div>
          <p className="text-slate-600 text-lg">Your AI-powered freelancing assistant</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card className="max-w-md mx-auto backdrop-blur-xl bg-white/40 border-white/20 shadow-lg shadow-purple-500/5">
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
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
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
                    price="Free"
                    features={[
                      "10 AI proposals/month",
                      "10 smart follow-ups/month",
                      "Basic invoice generation",
                      "Community support"
                    ]}
                  />
                  <PlanCard
                    plan="basic"
                    title="Basic"
                    price="₹149"
                    features={[
                      "50 AI proposals/month",
                      "50 smart follow-ups/month",
                      "Advanced invoice features",
                      "Priority support",
                      "Tax estimation tools"
                    ]}
                    popular={true}
                  />
                  <PlanCard
                    plan="pro"
                    title="Pro"
                    price="₹349"
                    features={[
                      "100 AI proposals/month",
                      "100 smart follow-ups/month",
                      "All premium features",
                      "Advanced AI customization",
                      "Dedicated support",
                      "Priority processing"
                    ]}
                  />
                </div>
              </div>

              <Card className="max-w-md mx-auto backdrop-blur-xl bg-white/40 border-white/20 shadow-lg shadow-purple-500/5">
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
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
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
      </div>
    </div>
  );
};

export default Auth;

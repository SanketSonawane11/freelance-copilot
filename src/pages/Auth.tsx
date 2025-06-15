import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { createInitialSubscription } from "@/utils/createInitialSubscription";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [signupPlan, setSignupPlan] = useState<"basic" | "pro">("basic");
  // Track if signup just happened, so we know to set subscription
  const [justSignedUp, setJustSignedUp] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    const { error } = await signUp(email, password, name);

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }
    // Signal that we JUST signed up. Wait for useAuth to update with user id.
    setJustSignedUp(true);

    toast.success("Account created successfully! Please check your email to verify your account.");
    setIsLoading(false);
  };

  // When user is present after signup, create subscription
  useEffect(() => {
    async function createSubIfNeeded() {
      if (justSignedUp && user?.id) {
        // Only create/update billing_info for this user
        const { error } = await createInitialSubscription(user.id, signupPlan);
        if (error) {
          toast.error("Failed to create subscription: " + (error.message || JSON.stringify(error)));
        } else {
          toast.success("Your plan is set up!");
        }
        setJustSignedUp(false);
      }
    }
    createSubIfNeeded();
  }, [user?.id, justSignedUp, signupPlan]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Link to="/" className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
        </div>
        
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Freelancer Copilot</span>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Sign in to your account to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create account</CardTitle>
                <CardDescription>Get started with your free account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" type="text" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required minLength={6} />
                  </div>
                  {/* Plan selection */}
                  <div className="space-y-2">
                    <Label>Choose Your Plan</Label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        className={`border px-3 py-2 rounded-lg ${signupPlan === "basic" ? "border-blue-600 bg-blue-50 font-bold" : "border-gray-200 bg-white"}`}
                        onClick={() => setSignupPlan("basic")}
                      >
                        Basic
                      </button>
                      <button
                        type="button"
                        className={`border px-3 py-2 rounded-lg ${signupPlan === "pro" ? "border-purple-600 bg-purple-50 font-bold" : "border-gray-200 bg-white"}`}
                        onClick={() => setSignupPlan("pro")}
                      >
                        Pro
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;

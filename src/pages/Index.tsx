import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, FileText, MessageSquare, Receipt, Calculator, Star, Users, Shield, Clock, Sparkles } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";
import { getPlanLimits, getPlanPrice } from "@/utils/planLimits";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 rounded-2xl opacity-20 blur-xl animate-pulse"></div>
            <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Brain className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">Initializing neural networks...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Header with enhanced glass effect */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="backdrop-blur-md bg-white/60 border-b border-white/30 sticky top-0 z-50 shadow-2xl shadow-purple-500/10 ring-1 ring-white/30 ring-inset"
        style={{
          WebkitBackdropFilter: 'blur(24px)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl opacity-20 blur-lg animate-pulse"></div>
              <div className="relative w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                Freelancer AI
              </span>
              <p className="text-xs text-slate-500 -mt-1">Neural Copilot</p>
            </div>
          </div>
          <Link to="/auth">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25 transition-all duration-300">
              <Sparkles className="w-4 h-4 mr-2" />
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </motion.header>

      {/* Hero Section with interactive animation */}
      <section className="py-20 px-4">
        <InteractiveHero />
      </section>

      {/* Features Grid with glass effects */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent mb-4">
              Neural-Enhanced Capabilities
            </h2>
            <p className="text-lg text-slate-600">Four AI-powered tools to transform your freelance intelligence</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-lg text-slate-800">Neural Proposals</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-slate-600">
                  AI-crafted proposals that understand context, tone, and client psychology to maximize win rates.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-lg text-slate-800">Smart Follow-ups</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-slate-600">
                  Intelligent follow-up sequences with perfect timing and personalized messaging.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Receipt className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-lg text-slate-800">Neural Invoicing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-slate-600">
                  Automated invoice generation with GST compliance and intelligent PDF creation.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-rose-400 rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Calculator className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-lg text-slate-800">Tax Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-slate-600">
                  AI-powered tax estimation with Indian freelancer-specific insights and compliance tips.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof with glass effect */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 backdrop-blur-xl bg-white/30 rounded-2xl border border-white/20">
              <div className="flex justify-center items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-2xl font-bold text-slate-900">1,200+</p>
              <p className="text-slate-600">Neural Sessions</p>
            </div>
            <div className="text-center p-6 backdrop-blur-xl bg-white/30 rounded-2xl border border-white/20">
              <Users className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <p className="text-2xl font-bold text-slate-900">₹5.2L+</p>
              <p className="text-slate-600">AI-Generated Revenue</p>
            </div>
            <div className="text-center p-6 backdrop-blur-xl bg-white/30 rounded-2xl border border-white/20">
              <Clock className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <p className="text-2xl font-bold text-slate-900">25 hrs</p>
              <p className="text-slate-600">Weekly Time Saved</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing with enhanced glass effect */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent mb-4">
            Neural Subscription Plans
          </h2>
          <p className="text-lg text-slate-600 mb-12">Choose your AI intelligence level</p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Card className="backdrop-blur-xl bg-white/40 border-white/20 hover:border-blue-200/50 transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-800">Starter Neural</CardTitle>
                <div className="text-3xl font-bold text-slate-900 mt-2">
                  ₹{getPlanPrice('basic').amount}<span className="text-lg font-normal text-slate-600">/month</span>
                </div>
                <CardDescription className="text-slate-600">Perfect for emerging minds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-slate-700">
                  <Shield className="w-4 h-4 text-emerald-500 mr-3" />
                  <span>{getPlanLimits('basic').displayProposals} AI proposals/month</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <Shield className="w-4 h-4 text-emerald-500 mr-3" />
                  <span>{getPlanLimits('basic').displayFollowups} neural follow-ups/month</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <Shield className="w-4 h-4 text-emerald-500 mr-3" />
                  <span>{getPlanLimits('basic').displayInvoices} smart invoicing</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <Shield className="w-4 h-4 text-emerald-500 mr-3" />
                  <span>{getPlanLimits('basic').displayClients} clients</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <Shield className="w-4 h-4 text-emerald-500 mr-3" />
                  <span>Tax intelligence</span>
                </div>
                <Link to="/auth">
                  <Button className="w-full mt-6 backdrop-blur-sm bg-white/50 border border-white/30 hover:bg-white/70 text-slate-700 transition-all duration-300">
                    Begin Neural Journey
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/40 border-2 border-purple-200/50 relative shadow-xl shadow-purple-500/10">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Most Neural
              </Badge>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-800">Pro Neural</CardTitle>
                <div className="text-3xl font-bold text-slate-900 mt-2">
                  ₹{getPlanPrice('pro').amount}<span className="text-lg font-normal text-slate-600">/month</span>
                </div>
                <CardDescription className="text-slate-600">For advanced neural networks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-slate-700">
                  <Shield className="w-4 h-4 text-emerald-500 mr-3" />
                  <span>{getPlanLimits('pro').displayProposals} AI proposals/month</span>
                </div>
                <div className="flex items-start text-left text-slate-700">
                  <Shield className="w-4 h-4 text-emerald-500 mr-3" />
                  <span>{getPlanLimits('pro').displayFollowups} neural follow-ups/month</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <Shield className="w-4 h-4 text-emerald-500 mr-3" />
                  <span>{getPlanLimits('pro').displayInvoices} smart invoicing</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <Shield className="w-4 h-4 text-emerald-500 mr-3" />
                  <span>{getPlanLimits('pro').displayClients} clients</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <Shield className="w-4 h-4 text-emerald-500 mr-3" />
                  <span>Advanced tax intelligence</span>
                </div>
                <div className="flex items-center text-slate-700">
                  <Shield className="w-4 h-4 text-emerald-500 mr-3" />
                  <span>Priority neural support</span>
                </div>
                <Link to="/auth">
                  <Button className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25 transition-all duration-300">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Activate Pro Neural
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer with glass effect */}
      <footer className="backdrop-blur-xl bg-slate-900/90 text-white py-12 px-4 border-t border-white/10">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-20 blur-lg"></div>
              <div className="relative w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold">Freelancer AI</span>
              <p className="text-xs text-slate-400 -mt-1">Neural Copilot</p>
            </div>
          </div>
          <p className="text-slate-400 mb-6">Empowering Indian freelancers with neural-enhanced productivity</p>
          <div className="flex justify-center space-x-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors duration-300">Neural Privacy</a>
            <a href="#" className="hover:text-white transition-colors duration-300">AI Terms</a>
            <a href="#" className="hover:text-white transition-colors duration-300">Neural Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// InteractiveHero component for animated hero section
const InteractiveHero = () => {
  const containerRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Mouse parallax effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = (containerRef.current as HTMLDivElement)?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMouse({ x, y });
  };

  // Animation variants
  const badgeVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.7, type: "spring" } },
    hover: (mouse: { x: number; y: number }) => ({
      x: mouse.x * 0.01,
      y: mouse.y * 0.01,
      scale: 1.05,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    }),
  };
  const headlineVariants = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.8, type: "spring" } },
    hover: (mouse: { x: number; y: number }) => ({
      x: mouse.x * 0.03,
      y: mouse.y * 0.03,
      scale: 1.02,
      transition: { type: "spring", stiffness: 180, damping: 18 },
    }),
  };
  const paraVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.7, type: "spring" } },
  };
  const buttonVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.7, type: "spring" } },
    hover: (mouse: { x: number; y: number }) => ({
      x: mouse.x * 0.01,
      y: mouse.y * 0.01,
      scale: 1.04,
      transition: { type: "spring", stiffness: 220, damping: 22 },
    }),
  };

  return (
    <motion.div
      ref={containerRef}
      className="container mx-auto text-center max-w-4xl relative"
      onMouseMove={handleMouseMove}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.7 }}
    >
      <motion.div
        className="inline-block"
        variants={badgeVariants}
        custom={mouse}
        whileHover="hover"
      >
        <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 hover:from-blue-200 hover:to-purple-200 border-blue-200 transition-all duration-300 cursor-pointer">
          <Brain className="w-4 h-4 mr-2" />
          🇮🇳 AI-Powered for Indian Freelancers
        </Badge>
      </motion.div>
      <motion.h1
        className="text-5xl font-bold text-slate-900 mb-6 leading-tight select-none"
        variants={headlineVariants}
        custom={mouse}
        whileHover="hover"
      >
        Your Neural-Powered
        <span className="bg-gradient-to-r from-blue-500 via-purple-700 bg-clip-text text-transparent block mt-2">
          Freelance Copilot
        </span>
      </motion.h1>
      <motion.p
        className="text-xl text-slate-600 mb-8 leading-relaxed"
        variants={paraVariants}
      >
        Harness the power of AI to eliminate mental overhead and amplify productivity. 
        Smart proposals, intelligent follow-ups, automated invoicing, and tax insights — 
        all in one serene, neural-enhanced workspace.
      </motion.p>
      <motion.div
        className="flex flex-col sm:flex-row gap-4 justify-center"
        variants={buttonVariants}
        custom={mouse}
        whileHover="hover"
      >
        <Link to="/auth">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-purple-500  hover:from-blue-600 hover:to-purple-700 text-white text-lg px-8 py-6 shadow-xl shadow-purple-500/25 transition-all duration-300"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Begin Neural Journey
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
        <Button variant="outline" size="lg" className="text-lg px-8 py-6 backdrop-blur-sm bg-white/50 border-white/30 hover:bg-white/70 transition-all duration-300">
          Watch AI Demo
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default Index;
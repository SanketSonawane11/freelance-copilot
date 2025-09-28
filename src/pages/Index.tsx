import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, FileText, MessageSquare, Receipt, Calculator, Star, Users, Clock, CheckCircle } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { getPlanLimits, getPlanPrice } from "@/utils/planLimits";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-text-secondary font-lexend">Initializing neural networks...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Clean, minimal header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border"
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-fraunces font-semibold text-brand-primary">
                Freelancer AI
              </span>
              <p className="text-xs text-text-secondary font-lexend -mt-1">Neural Copilot</p>
            </div>
          </div>
          <Link to="/auth">
            <Button variant="action" className="font-lexend">
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </motion.header>

      {/* Asymmetrical Hero Section */}
      <section className="py-20 px-6">
        <InteractiveHero />
      </section>

      {/* Features in 2x2 Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-fraunces font-semibold text-brand-primary mb-4">
              Neural-Enhanced Capabilities
            </h2>
            <p className="text-lg font-lexend text-text-secondary max-w-2xl mx-auto">
              Four AI-powered tools designed to transform your freelance workflow with calm intelligence
            </p>
          </div>
          
          {/* 2x2 Grid Layout as specified */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="h-full p-8 hover:shadow-md transition-shadow duration-200 border-border bg-card">
                <CardHeader className="text-left pb-6">
                  <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-brand-primary" />
                  </div>
                  <CardTitle className="text-xl font-fraunces font-semibold text-foreground">Neural Proposals</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-text-secondary font-lexend leading-relaxed">
                    AI-crafted proposals that understand context, tone, and client psychology to maximize your win rates with intelligent precision.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="h-full p-8 hover:shadow-md transition-shadow duration-200 border-border bg-card">
                <CardHeader className="text-left pb-6">
                  <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-brand-primary" />
                  </div>
                  <CardTitle className="text-xl font-fraunces font-semibold text-foreground">Smart Follow-ups</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-text-secondary font-lexend leading-relaxed">
                    Intelligent follow-up sequences with perfect timing and personalized messaging that nurtures relationships naturally.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="h-full p-8 hover:shadow-md transition-shadow duration-200 border-border bg-card">
                <CardHeader className="text-left pb-6">
                  <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <Receipt className="w-8 h-8 text-brand-primary" />
                  </div>
                  <CardTitle className="text-xl font-fraunces font-semibold text-foreground">Neural Invoicing</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-text-secondary font-lexend leading-relaxed">
                    Automated invoice generation with GST compliance and intelligent PDF creation that handles the complexity for you.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card className="h-full p-8 hover:shadow-md transition-shadow duration-200 border-border bg-card">
                <CardHeader className="text-left pb-6">
                  <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <Calculator className="w-8 h-8 text-brand-primary" />
                  </div>
                  <CardTitle className="text-xl font-fraunces font-semibold text-foreground">Tax Intelligence</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-text-secondary font-lexend leading-relaxed">
                    AI-powered tax estimation with Indian freelancer-specific insights and compliance guidance you can trust.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Clean Social Proof */}
      <section className="py-16 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-8"
            >
              <div className="text-4xl font-fraunces font-semibold text-brand-primary mb-2">1,200+</div>
              <p className="text-text-secondary font-lexend">Neural Sessions</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-8"
            >
              <div className="text-4xl font-fraunces font-semibold text-brand-primary mb-2">₹5.2L+</div>
              <p className="text-text-secondary font-lexend">AI-Generated Revenue</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-8"
            >
              <div className="text-4xl font-fraunces font-semibold text-brand-primary mb-2">25 hrs</div>
              <p className="text-text-secondary font-lexend">Weekly Time Saved</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Clean Pricing */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-fraunces font-semibold text-brand-primary mb-4">
            Neural Subscription Plans
          </h2>
          <p className="text-lg font-lexend text-text-secondary mb-16">Choose your AI intelligence level</p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full p-8 border-border">
                <CardHeader className="text-center pb-6">
                  <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-fraunces font-semibold text-foreground">Starter Neural</CardTitle>
                  <div className="text-4xl font-fraunces font-semibold text-brand-primary mt-4">
                    ₹{getPlanPrice('basic').amount}<span className="text-lg font-lexend font-normal text-text-secondary">/month</span>
                  </div>
                  <CardDescription className="text-text-secondary font-lexend mt-2">Perfect for emerging minds</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-text-primary font-lexend">
                    <CheckCircle className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                    <span>{getPlanLimits('basic').displayProposals} AI proposals/month</span>
                  </div>
                  <div className="flex items-center text-text-primary font-lexend">
                    <CheckCircle className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                    <span>{getPlanLimits('basic').displayFollowups} neural follow-ups/month</span>
                  </div>
                  <div className="flex items-center text-text-primary font-lexend">
                    <CheckCircle className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                    <span>{getPlanLimits('basic').displayInvoices} smart invoicing</span>
                  </div>
                  <div className="flex items-center text-text-primary font-lexend">
                    <CheckCircle className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                    <span>{getPlanLimits('basic').displayClients} clients</span>
                  </div>
                  <div className="flex items-center text-text-primary font-lexend">
                    <CheckCircle className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                    <span>Tax intelligence</span>
                  </div>
                  <Link to="/auth" className="block pt-4">
                    <Button variant="secondary" className="w-full font-lexend">
                      Begin Neural Journey
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full p-8 border-2 border-brand-primary relative">
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand-primary text-white font-lexend">
                  Most Neural
                </Badge>
                <CardHeader className="text-center pb-6">
                  <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-fraunces font-semibold text-foreground">Pro Neural</CardTitle>
                  <div className="text-4xl font-fraunces font-semibold text-brand-primary mt-4">
                    ₹{getPlanPrice('pro').amount}<span className="text-lg font-lexend font-normal text-text-secondary">/month</span>
                  </div>
                  <CardDescription className="text-text-secondary font-lexend mt-2">For advanced neural networks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-text-primary font-lexend">
                    <CheckCircle className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                    <span>{getPlanLimits('pro').displayProposals} AI proposals/month</span>
                  </div>
                  <div className="flex items-center text-text-primary font-lexend">
                    <CheckCircle className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                    <span>{getPlanLimits('pro').displayFollowups} neural follow-ups/month</span>
                  </div>
                  <div className="flex items-center text-text-primary font-lexend">
                    <CheckCircle className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                    <span>{getPlanLimits('pro').displayInvoices} smart invoicing</span>
                  </div>
                  <div className="flex items-center text-text-primary font-lexend">
                    <CheckCircle className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                    <span>{getPlanLimits('pro').displayClients} clients</span>
                  </div>
                  <div className="flex items-center text-text-primary font-lexend">
                    <CheckCircle className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                    <span>Advanced tax intelligence</span>
                  </div>
                  <div className="flex items-center text-text-primary font-lexend">
                    <CheckCircle className="w-5 h-5 text-brand-primary mr-3 flex-shrink-0" />
                    <span>Priority neural support</span>
                  </div>
                  <Link to="/auth" className="block pt-4">
                    <Button variant="action" className="w-full font-lexend">
                      Activate Pro Neural
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="bg-card border-t border-border py-12 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-fraunces font-semibold text-brand-primary">Freelancer AI</span>
              <p className="text-xs text-text-secondary font-lexend -mt-1">Neural Copilot</p>
            </div>
          </div>
          <p className="text-text-secondary font-lexend mb-6">Empowering Indian freelancers with neural-enhanced productivity</p>
          <div className="flex justify-center space-x-8 text-sm text-text-secondary font-lexend">
            <a href="#" className="hover:text-brand-primary transition-colors duration-200">Privacy</a>
            <a href="#" className="hover:text-brand-primary transition-colors duration-200">Terms</a>
            <a href="#" className="hover:text-brand-primary transition-colors duration-200">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Asymmetrical Hero with strategic whitespace
const InteractiveHero = () => {
  const containerRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = (containerRef.current as HTMLDivElement)?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - rect.width / 2) * 0.01;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.01;
    setMouse({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="container mx-auto grid lg:grid-cols-12 gap-12 items-center min-h-[600px]"
    >
      {/* Left column: 5-6 columns for content */}
      <div className="lg:col-span-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            transform: `translate(${mouse.x * 5}px, ${mouse.y * 5}px)`,
          }}
        >
          <h1 className="text-5xl lg:text-6xl font-fraunces font-bold text-brand-primary leading-tight">
            Your Neural-Powered
            <br />
            <span className="text-foreground">Freelance Copilot</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          style={{
            transform: `translate(${mouse.x * 3}px, ${mouse.y * 3}px)`,
          }}
          className="text-xl font-lexend text-text-secondary leading-relaxed max-w-lg"
        >
          Transform your freelance business with AI that understands your workflow. 
          Create proposals, manage follow-ups, handle invoicing, and estimate taxes with calm intelligence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link to="/auth">
            <Button variant="action" size="lg" className="font-lexend text-lg px-8 py-3">
              Begin Neural Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="lg" className="font-lexend text-lg px-8 py-3 text-brand-primary hover:text-brand-primary-light">
            Watch AI Demo
          </Button>
        </motion.div>
      </div>

      {/* Right column: 6-7 columns for illustration */}
      <div className="lg:col-span-6 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          style={{
            transform: `translate(${mouse.x * -8}px, ${mouse.y * -8}px)`,
          }}
          className="relative w-full h-96 lg:h-[500px] bg-gradient-to-br from-brand-primary/5 to-brand-primary/10 rounded-3xl flex items-center justify-center border border-brand-primary/20"
        >
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <p className="font-lexend text-text-secondary text-sm">Neural Copilot Ready</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, FileText, MessageSquare, Receipt, Calculator, Zap, TrendingUp, Target, CheckCircle } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getPlanLimits, getPlanPrice } from "@/utils/planLimits";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-20 blur-xl animate-pulse"></div>
            <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center backdrop-blur-sm">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 overflow-hidden">
      {/* Header with glassmorphism */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg shadow-purple-500/5"
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-20 blur-lg"></div>
              <div className="relative w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
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
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg shadow-blue-500/25">
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </motion.header>

      {/* Hero Section with Parallax */}
      <ParallaxHero />

      {/* Horizontal Scroll Features */}
      <HorizontalScrollSection />

      {/* Stats with Glass Cards */}
      <section className="py-20 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-4">
              Proven Neural Impact
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Real results from AI-powered freelance operations
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { number: "1,200+", label: "Neural Sessions", gradient: "from-blue-400 to-cyan-400" },
              { number: "₹5.2L+", label: "AI-Generated Revenue", gradient: "from-emerald-400 to-teal-400" },
              { number: "25 hrs", label: "Weekly Time Saved", gradient: "from-purple-400 to-pink-400" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-2xl p-8 text-center shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group"
              >
                <div className={`text-5xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2 group-hover:scale-105 transition-transform duration-300`}>
                  {stat.number}
                </div>
                <p className="text-slate-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing with Enhanced Glass Effect */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
        <div className="container mx-auto max-w-4xl text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-4">
              Choose Your Neural Power
            </h2>
            <p className="text-xl text-slate-600">Simple pricing for powerful AI assistance</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-2xl p-8 shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter Neural</h3>
                <div className="text-4xl font-bold text-slate-900 mb-2">
                  ₹{getPlanPrice('basic').amount}<span className="text-lg font-normal text-slate-600">/month</span>
                </div>
                <p className="text-slate-600">Perfect for emerging freelancers</p>
              </div>
              
              <div className="space-y-4 mb-8">
                {[
                  `${getPlanLimits('basic').displayProposals} AI proposals/month`,
                  `${getPlanLimits('basic').displayFollowups} smart follow-ups/month`,
                  `${getPlanLimits('basic').displayInvoices} intelligent invoicing`,
                  `${getPlanLimits('basic').displayClients} clients`,
                  "Tax intelligence"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center text-slate-700">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              <Link to="/auth" className="block">
                <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                  Start Neural Journey
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-xl bg-white/40 border-2 border-purple-300 rounded-2xl p-8 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 relative"
            >
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                Most Popular
              </Badge>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro Neural</h3>
                <div className="text-4xl font-bold text-slate-900 mb-2">
                  ₹{getPlanPrice('pro').amount}<span className="text-lg font-normal text-slate-600">/month</span>
                </div>
                <p className="text-slate-600">For advanced freelance operations</p>
              </div>
              
              <div className="space-y-4 mb-8">
                {[
                  `${getPlanLimits('pro').displayProposals} AI proposals/month`,
                  `${getPlanLimits('pro').displayFollowups} smart follow-ups/month`,
                  `${getPlanLimits('pro').displayInvoices} intelligent invoicing`,
                  `${getPlanLimits('pro').displayClients} clients`,
                  "Advanced tax intelligence",
                  "Priority neural support"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center text-slate-700">
                    <CheckCircle className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              <Link to="/auth" className="block">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-purple-500/25">
                  Activate Pro Neural
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="backdrop-blur-xl bg-white/40 border-t border-white/20 py-12 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-20 blur-lg"></div>
              <div className="relative w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
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
          <p className="text-slate-600 mb-6">Empowering Indian freelancers with AI-powered productivity</p>
          <div className="flex justify-center space-x-8 text-sm text-slate-600">
            <a href="#" className="hover:text-blue-600 transition-colors duration-200">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors duration-200">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors duration-200">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Parallax Hero Section
const ParallaxHero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    setMousePosition({ x, y });
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            x: mousePosition.x * 50,
            y: mousePosition.y * 30,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 100 }}
          className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            x: mousePosition.x * -30,
            y: mousePosition.y * -40,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 100 }}
          className="absolute bottom-20 right-20 w-48 h-48 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl"
        />
      </div>

      <div className="container mx-auto grid lg:grid-cols-2 gap-16 items-center max-w-7xl relative z-10">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <motion.div
            animate={{
              x: mousePosition.x * 10,
              y: mousePosition.y * 5,
            }}
            transition={{ type: "spring", damping: 25, stiffness: 100 }}
          >
            <h1 className="text-6xl lg:text-7xl font-bold leading-none">
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                Your AI
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                Freelance
              </span>
              <br />
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                Copilot
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            animate-mouse={{
              x: mousePosition.x * 5,
              y: mousePosition.y * 3,
            }}
            className="text-xl text-slate-600 leading-relaxed max-w-xl"
          >
            Generate winning proposals, automate follow-ups, create professional invoices, 
            and handle taxes—all powered by AI that understands your freelance business.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg px-8 py-4 rounded-xl border-0 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" className="text-lg px-8 py-4 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50">
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>

        {/* Right Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          <motion.div
            animate={{
              x: mousePosition.x * -20,
              y: mousePosition.y * -15,
              rotateX: mousePosition.y * 10,
              rotateY: mousePosition.x * 10,
            }}
            transition={{ type: "spring", damping: 25, stiffness: 100 }}
            className="relative w-full h-[500px] backdrop-blur-xl bg-white/30 border border-white/20 rounded-3xl shadow-2xl shadow-purple-500/10 overflow-hidden"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Neural network visualization */}
            <div className="absolute inset-0 p-8">
              <div className="grid grid-cols-3 gap-8 h-full">
                {[
                  { icon: FileText, gradient: "from-blue-400 to-cyan-400", delay: 0 },
                  { icon: MessageSquare, gradient: "from-emerald-400 to-teal-400", delay: 0.2 },
                  { icon: Receipt, gradient: "from-purple-400 to-pink-400", delay: 0.4 },
                  { icon: Calculator, gradient: "from-orange-400 to-rose-400", delay: 0.6 },
                  { icon: TrendingUp, gradient: "from-blue-500 to-purple-500", delay: 0.8 },
                  { icon: Target, gradient: "from-emerald-500 to-cyan-500", delay: 1.0 }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: item.delay, duration: 0.5 }}
                      className={`w-16 h-16 bg-gradient-to-r ${item.gradient} rounded-2xl flex items-center justify-center shadow-lg animate-float`}
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Central brain */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/25 animate-neural-pulse">
                <Brain className="w-10 h-10 text-white" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

// Horizontal Scrolling Features Section
const HorizontalScrollSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const features = [
    {
      title: "AI Proposals",
      description: "Generate compelling proposals that win clients with context-aware AI",
      icon: FileText,
      gradient: "from-blue-400 to-cyan-400",
      metrics: "95% Win Rate"
    },
    {
      title: "Smart Follow-ups", 
      description: "Automated follow-up sequences that nurture leads naturally",
      icon: MessageSquare,
      gradient: "from-emerald-400 to-teal-400",
      metrics: "3x Response Rate"
    },
    {
      title: "Neural Invoicing",
      description: "Professional invoices with GST compliance and payment tracking",
      icon: Receipt,
      gradient: "from-purple-400 to-pink-400",
      metrics: "Instant Generation"
    },
    {
      title: "Tax Intelligence",
      description: "AI-powered tax estimation with Indian freelancer insights",
      icon: Calculator,
      gradient: "from-orange-400 to-rose-400",
      metrics: "100% Compliant"
    }
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent mb-4">
            Neural-Enhanced Tools
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Four powerful AI tools designed to transform your freelance workflow
          </p>
        </motion.div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-8 px-6 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 w-80 backdrop-blur-xl bg-white/40 border border-white/20 rounded-2xl p-8 shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group"
            >
              <div className="relative mb-6">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <Badge className={`absolute -top-2 -right-2 bg-gradient-to-r ${feature.gradient} text-white border-0 text-xs`}>
                  {feature.metrics}
                </Badge>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-slate-700 transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Scroll indicator */}
      <div className="flex justify-center mt-8">
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          Scroll to explore tools
        </p>
      </div>
    </section>
  );
};

export default Index;
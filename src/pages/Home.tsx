import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Users, 
  Briefcase, 
  MessageCircle, 
  Star,
  Zap,
  Shield,
  Globe
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function Home() {
  const features = [
    {
      icon: Users,
      title: 'Connect with Talent',
      description: 'Find skilled freelancers or discover your next opportunity',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Protected transactions with milestone-based payments',
    },
    {
      icon: MessageCircle,
      title: 'Real-time Communication',
      description: 'Chat instantly with clients and freelancers',
    },
    {
      icon: Zap,
      title: 'AI-Powered Proposals',
      description: 'Generate winning proposals with AI assistance',
    },
  ];

  const stats = [
    { label: 'Active Users', value: '10K+' },
    { label: 'Projects Completed', value: '25K+' },
    { label: 'Success Rate', value: '95%' },
    { label: 'Countries', value: '50+' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-teal-600/20" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">Freelance</span>
              <br />
              <span className="text-silver-100">Your Way</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-silver-300 mb-8 max-w-3xl mx-auto">
              Connect with top talent or find your next opportunity on the world's 
              most advanced freelancing platform
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register?role=client">
                <Button size="lg" className="w-full sm:w-auto">
                  Hire Talent <ArrowRight className="ml-2 w-5 h-5 inline-block" />
                </Button>
              </Link>
              
              <Link to="/register?role=freelancer">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Find Work <Briefcase className="ml-2 w-5 h-5 inline-block" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Floating Elements */}
          <motion.div
            animate={{ y: [-20, 0, -20] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-10 opacity-20"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl" />
          </motion.div>
          
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-40 right-10 opacity-20"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-silver-400 text-sm md:text-base">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-silver-100 mb-4">
              Why Choose <span className="gradient-text">FreelanceHub</span>
            </h2>
            <p className="text-xl text-silver-400 max-w-2xl mx-auto">
              Experience the future of freelancing with our cutting-edge platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card hover className="h-full text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-silver-100 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-silver-400">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="glass-card p-12 hero-glow"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-silver-100 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-silver-400 mb-8">
              Join thousands of professionals already using FreelanceHub
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Sign Up Free
                  <ArrowRight className="ml-2 w-5 h-5 inline-block" />
                </Button>
              </Link>
              
              <Link to="/login">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Zap,
  Users,
  Github,
  Lock,
  Layers,
  Gauge,
  Brain,
  Shield,
  Clock,
} from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

export function FeatureShowcase() {
  const features: Feature[] = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'AI-Powered Analysis',
      description: '5 specialized agents analyze your code in parallel',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Real-time Collaboration',
      description: 'Debug together with live code synchronization',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Github className="w-6 h-6" />,
      title: 'GitHub Integration',
      description: 'Create pull requests with AI-suggested fixes',
      color: 'from-slate-500 to-gray-600',
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Enterprise Security',
      description: 'Role-based access control with audit logs',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: 'Multi-language Support',
      description: 'JavaScript, Python, Java, C++, Rust, and more',
      color: 'from-orange-500 to-yellow-500',
    },
    {
      icon: <Gauge className="w-6 h-6" />,
      title: 'Performance Insights',
      description: 'Get actionable recommendations for optimization',
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Feedback',
      description: 'Get analysis results within seconds',
      color: 'from-yellow-500 to-amber-500',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Data Privacy',
      description: 'Your code stays secure with encryption',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Audit Trails',
      description: 'Complete history of all team activities',
      color: 'from-teal-500 to-cyan-500',
    },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Powerful Features for Modern Teams
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Everything you need to debug code faster and collaborate better
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors group"
            >
              <CardHeader className="space-y-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} p-2 text-white group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-white text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

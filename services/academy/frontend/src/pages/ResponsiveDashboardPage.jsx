import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  FileText,
  Upload,
  BarChart3,
  Brain,
  ArrowRight,
  User,
} from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';
import InstallButton from '@/components/InstallButton';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';


const actions = [
  { icon: Upload, title: 'Upload PDFs', description: 'Quickly add new study materials.' },
  { icon: FileText, title: 'View Questions', description: 'Review questions from uploaded materials.' },
  { icon: BookOpen, title: 'Study Materials', description: 'Access lessons, quizzes, and resources.' },
  { icon: Calendar, title: 'Timetable', description: 'See your schedule at a glance.' },
  { icon: BarChart3, title: 'Track Progress', description: 'Monitor your performance over time.' },
  { icon: Brain, title: 'Ask AI Tutor', description: 'Get instant help from the AI assistant.' },
];

const subjects = [
  { name: 'Mathematics' },
  { name: 'Physics' },
  { name: 'Biology' },
  { name: 'English' },
];

const progressData = [
  { label: 'Topics Completed', value: '34' },
  { label: 'Average Score', value: '82%' },
  { label: 'AI Tutor Questions', value: '12' },
];

const upcomingEvents = [
  '🧪 Chemistry Quiz – Monday, July 8',
  '📘 Literature Assignment Due – Wednesday, July 10',
  '🧠 Physics AI Practice Session – Friday, July 12',
];

const ResponsiveDashboardPage = () => {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedMode = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialMode = storedMode || (prefersDark ? 'dark' : 'light');

    if (initialMode === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const newIsDark = !isDarkMode;
    html.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    setIsDarkMode(newIsDark);
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Navigation (simplified for dashboard) */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Academy Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <DarkModeToggle isDark={isDarkMode} onToggle={toggleTheme} />
            <InstallButton />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 space-y-16 pb-16">
        {/* Hero Section */}
        <section className="py-12 text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent leading-tight">
            Welcome, {user?.fullName || 'Student'} 👋
          </h1>
          <p className="text-lg text-muted-foreground mb-4">{today}</p>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            "Education is the most powerful weapon which you can use to change the world." — Nelson Mandela
          </p>
        </section>

        <hr className="my-10" />

        {/* Quick Actions */}
        <section className="space-y-8">
          <h2 className="text-4xl font-bold text-foreground text-center">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {actions.map((action, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <action.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base leading-relaxed">
                    {action.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <hr className="my-10" />

        {/* Featured Subjects */}
        <section className="space-y-6 text-center">
          <h2 className="text-4xl font-bold text-foreground">Featured Subjects</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {subjects.map(({ name }, idx) => (
              <div key={idx} className="px-6 py-3 rounded-full font-medium shadow-sm hover:scale-105 transition-transform cursor-pointer bg-card/50 backdrop-blur-sm text-foreground">
                {name}
              </div>
            ))}
          </div>
        </section>

        <hr className="my-10" />

        {/* Progress Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {progressData.map((data, idx) => (
            <Card key={idx} className="bg-card/50 backdrop-blur-sm p-6 text-center shadow-md">
              <h4 className="text-xl font-semibold text-muted-foreground">{data.label}</h4>
              <p className="text-4xl font-bold text-primary">{data.value}</p>
            </Card>
          ))}
        </section>

        <hr className="my-10" />

        {/* Upcoming Events & Mission Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" /> Upcoming Events
              </h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground text-lg">
                {upcomingEvents.map((event, idx) => (
                  <li key={idx}>{event}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <h3 className="text-2xl font-bold">Our Mission</h3>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe every student deserves a personalized, joyful learning experience. Our platform empowers you to grow, track, and thrive — at your own pace.
              </p>
            </CardContent>
          </Card>
        </div>

        <hr className="my-10" />

        {/* Student Info */}
        <section className="max-w-xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-6 text-foreground">Your Profile</h2>
          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg p-6 flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{user?.fullName || 'John Doe'}</p>
              <p className="text-lg text-muted-foreground">{user?.level || 'SS2'} – {user?.department || 'Science Class'}</p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default ResponsiveDashboardPage;
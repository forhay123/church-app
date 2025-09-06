import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Calendar, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ThemeToggle from "@/components/ThemeToggle"; 

export default function Landing() {
  const features = [
    {
      icon: Users,
      title: "Member Management",
      description: "Organize and manage your congregation with ease. Track member information and engagement."
    },
    {
      icon: Calendar,
      title: "Attendance Tracking",
      description: "Monitor attendance patterns and generate insights to better serve your community."
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Get detailed analytics and reports to make data-driven decisions for your church."
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Secure access controls with different permission levels for various church roles."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-primary-foreground">C</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Church Connect
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent leading-tight">
            Strengthen Your Church Community
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            A comprehensive church management system designed to help you track attendance, 
            manage members, and build stronger connections within your congregation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="group">
                Start Your Journey
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Already a Member? Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Everything You Need to Manage Your Church
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From attendance tracking to member management, we've got all the tools 
            your church needs to thrive in the digital age.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="bg-gradient-to-r from-primary to-secondary border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold text-primary-foreground mb-4">
              Ready to Transform Your Church Management?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Join hundreds of churches already using Church Connect to build stronger, 
              more engaged communities.
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="group">
                Get Started Today
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 Church Connect. Built with love for church communities.</p>
          </div>
        </div>
      </footer>
      
      {/* Fixed Theme Toggle */}
      <ThemeToggle />
    </div>
  );
}
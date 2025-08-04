import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building } from "lucide-react";

export default function Landing() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [token, setToken] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleRegistration = async () => {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          registrationToken: token,
        }),
      });

      if (res.ok) {
        window.location.href = '/api/login';
      }
    } catch (error) {
      console.error('Registration failed', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-blue-600 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="text-white text-2xl" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">FantasyCompanions</h2>
            <p className="mt-2 text-gray-600">Club Management Platform</p>
          </div>

          {authMode === 'login' ? (
            <div className="space-y-6">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </Label>
                <Input 
                  type="email" 
                  className="w-full" 
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </Label>
                <Input 
                  type="password" 
                  className="w-full" 
                  placeholder="Enter your password"
                />
              </div>
              
              <Button 
                onClick={handleLogin}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  New employee?{" "}
                  <button 
                    onClick={() => setAuthMode('register')}
                    className="text-primary hover:underline font-medium"
                  >
                    Register with token
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Token
                </Label>
                <Input
                  type="text"
                  className="w-full"
                  placeholder="Enter invitation token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </Label>
                  <Input
                    type="text"
                    className="w-full"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </Label>
                  <Input
                    type="text"
                    className="w-full"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </Label>
                <Input
                  type="email"
                  className="w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Create Password
                </Label>
                <Input
                  type="password"
                  className="w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleRegistration}
                className="w-full bg-success text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Complete Registration
              </Button>
              
              <div className="text-center">
                <button 
                  onClick={() => setAuthMode('login')}
                  className="text-primary hover:underline font-medium text-sm"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

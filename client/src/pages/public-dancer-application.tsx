import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserPlus, Upload, Shield, Sparkles, Wand2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertDancerApplicationSchema, type InsertDancerApplication } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function PublicDancerApplication() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    experience?: string;
    availability?: string;
    stageName?: string;
  }>({});
  const [loadingAI, setLoadingAI] = useState(false);

  const form = useForm<InsertDancerApplication>({
    resolver: zodResolver(insertDancerApplicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      address: "",
      dateOfBirth: undefined,
      ssn: "",
      emergencyContact: "",
      emergencyPhone: "",
      stageName: "",
      experience: "",
      availability: "",
      clubLocation: "club_1",
      idDocumentType: "",
    },
  });

  const createApplication = useMutation({
    mutationFn: async (data: InsertDancerApplication & { idDocumentUrl?: string }) => {
      return await apiRequest("/api/dancer-applications/public", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "Thank you for your application. We'll review it and get back to you soon.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  // AI-powered suggestions
  const getAISuggestions = async (field: string, currentValue: string) => {
    if (!currentValue.trim() || currentValue.length < 10) return;
    
    setLoadingAI(true);
    try {
      const response = await apiRequest("/api/ai/application-help", {
        method: "POST",
        body: JSON.stringify({
          field,
          value: currentValue,
          context: {
            firstName: form.getValues("firstName"),
            lastName: form.getValues("lastName"),
          }
        }),
      });
      
      if (response.suggestion) {
        setAiSuggestions(prev => ({
          ...prev,
          [field]: response.suggestion
        }));
      }
    } catch (error) {
      console.error("AI suggestion error:", error);
    } finally {
      setLoadingAI(false);
    }
  };

  const applySuggestion = (field: keyof typeof aiSuggestions) => {
    const suggestion = aiSuggestions[field];
    if (suggestion) {
      form.setValue(field as any, suggestion);
      setAiSuggestions(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "id_document");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("File upload failed");
    }

    const result = await response.json();
    return result.url;
  };

  const onSubmit = async (data: InsertDancerApplication) => {
    try {
      setUploading(true);
      let idDocumentUrl = "";

      if (selectedFile) {
        idDocumentUrl = await uploadFile(selectedFile);
      }

      const applicationData = {
        ...data,
        ...(idDocumentUrl && { idDocumentUrl }),
      };

      createApplication.mutate(applicationData);
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card className="text-center">
            <CardContent className="p-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
              <p className="text-gray-600 mb-6">
                Thank you for your interest in joining our team. We've received your application and will review it carefully.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>What's next?</strong><br />
                  • We'll review your application within 2-3 business days<br />
                  • If selected, we'll contact you to schedule an interview<br />
                  • You'll receive an email update on your application status
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Join Our Team</h1>
          <p className="text-xl text-gray-600">Apply to become a dancer at our premium venue</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-purple-600 font-medium">AI-Powered Application Assistant</span>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <UserPlus className="h-6 w-6" />
              Dancer Application Form
            </CardTitle>
            <CardDescription className="text-purple-100">
              Complete all required fields below. Our AI assistant will help you craft the best possible application.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Club Location Selection */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <FormField
                    control={form.control}
                    name="clubLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Preferred Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select your preferred club location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="wiggles_gentlemens_club">Wiggles Gentlemen's Club</SelectItem>
                            <SelectItem value="fantasy_gentlemens_club">Fantasy Gentlemen's Club</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your address" {...field} value={field.value || ''} className="bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              className="bg-white"
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ssn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Security Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="XXX-XX-XXXX" 
                              maxLength={11}
                              {...field} 
                              className="bg-white"
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, '');
                                if (value.length >= 6) {
                                  value = `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5, 9)}`;
                                } else if (value.length >= 4) {
                                  value = `${value.slice(0, 3)}-${value.slice(3)}`;
                                }
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Emergency Contact</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...field} value={field.value || ''} className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="emergencyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} value={field.value || ''} className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Stage Name with AI Suggestion */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Performance Details</h3>
                  
                  <FormField
                    control={form.control}
                    name="stageName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Stage Name (Optional)
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Suggestions Available
                          </Badge>
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input 
                              placeholder="Enter your preferred stage name" 
                              {...field} 
                              value={field.value || ''}
                              className="bg-white"
                              onBlur={() => getAISuggestions('stageName', field.value || '')}
                            />
                            {aiSuggestions.stageName && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900 mb-1">AI Suggestion:</p>
                                    <p className="text-sm text-blue-800">{aiSuggestions.stageName}</p>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => applySuggestion('stageName')}
                                    className="ml-2"
                                  >
                                    <Wand2 className="h-3 w-3 mr-1" />
                                    Use
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ID Document Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Identity Verification</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="idDocumentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="drivers_license">Driver's License</SelectItem>
                              <SelectItem value="state_id">State ID</SelectItem>
                              <SelectItem value="passport">Passport</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <Label>Upload Document *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="flex-1 bg-white"
                        />
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {selectedFile && (
                        <p className="text-sm text-green-600">
                          ✓ Selected: {selectedFile.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, GIF, or PDF. Max 10MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Experience with AI Enhancement */}
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Previous Experience
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Enhancement Available
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Textarea 
                            placeholder="Describe any relevant experience in the entertainment industry, customer service, performance arts, or related fields..."
                            className="min-h-[120px] bg-white"
                            {...field} 
                            onBlur={() => getAISuggestions('experience', field.value)}
                          />
                          {aiSuggestions.experience && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-green-900 mb-1">AI Enhanced Version:</p>
                                  <p className="text-sm text-green-800">{aiSuggestions.experience}</p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => applySuggestion('experience')}
                                  className="ml-2"
                                  disabled={loadingAI}
                                >
                                  <Wand2 className="h-3 w-3 mr-1" />
                                  Use Enhanced
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Availability with AI Enhancement */}
                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Availability
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Suggestions Available
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Textarea 
                            placeholder="Describe your availability including preferred days, times, and any scheduling constraints..."
                            className="min-h-[100px] bg-white"
                            {...field} 
                            onBlur={() => getAISuggestions('availability', field.value)}
                          />
                          {aiSuggestions.availability && (
                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-purple-900 mb-1">AI Improved Format:</p>
                                  <p className="text-sm text-purple-800">{aiSuggestions.availability}</p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => applySuggestion('availability')}
                                  className="ml-2"
                                  disabled={loadingAI}
                                >
                                  <Wand2 className="h-3 w-3 mr-1" />
                                  Use Improved
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Privacy Notice */}
                <Alert className="bg-blue-50 border-blue-200">
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-blue-900">
                    <strong>Privacy & Security:</strong> All information provided will be kept confidential and used solely for employment purposes. 
                    By submitting this application, you consent to a background check if your application is approved for further review.
                    We use AI to help enhance your application, but all your personal data remains secure and private.
                  </AlertDescription>
                </Alert>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={createApplication.isPending || uploading || loadingAI}
                    className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {createApplication.isPending || uploading ? (
                      "Submitting Application..."
                    ) : loadingAI ? (
                      "AI Processing..."
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
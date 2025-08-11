import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Save, User, MessageCircle, DollarSign } from "lucide-react";

const CREATOR_ID = "creator_123";

const personaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  voiceKeywords: z.array(z.string()).min(1, "At least one voice keyword is required"),
  doSay: z.array(z.string()).min(1, "At least one 'do say' item is required"),
  dontSay: z.array(z.string()).min(1, "At least one 'don't say' item is required"),
  disclosure: z.string().min(1, "Disclosure is required"),
});

type PersonaFormData = z.infer<typeof personaSchema>;

export default function Persona() {
  const { toast } = useToast();
  const [newKeyword, setNewKeyword] = useState("");
  const [newDoSay, setNewDoSay] = useState("");
  const [newDontSay, setNewDontSay] = useState("");
  const [newOffer, setNewOffer] = useState({ sku: "", label: "", priceCents: 0 });

  const { data: persona, isLoading } = useQuery({
    queryKey: ["/api/personas/creator", CREATOR_ID],
    queryFn: () => api.getPersona(CREATOR_ID),
  });

  const form = useForm<PersonaFormData>({
    resolver: zodResolver(personaSchema),
    defaultValues: {
      name: "",
      bio: "",
      voiceKeywords: [],
      doSay: [],
      dontSay: [],
      disclosure: "",
    },
  });

  // Update form when persona data loads
  useState(() => {
    if (persona) {
      form.reset({
        name: persona.name,
        bio: persona.bio || "",
        voiceKeywords: persona.voiceKeywords || [],
        doSay: persona.doSay || [],
        dontSay: persona.dontSay || [],
        disclosure: persona.disclosure || "",
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createPersona({ ...data, creatorId: CREATOR_ID }),
    onSuccess: () => {
      toast({ title: "Success", description: "AI persona created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/personas/creator", CREATOR_ID] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create persona",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updatePersona(persona!.id, data),
    onSuccess: () => {
      toast({ title: "Success", description: "AI persona updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/personas/creator", CREATOR_ID] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update persona",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PersonaFormData) => {
    const submitData = {
      ...data,
      offerMenu: persona?.offerMenu || [],
    };

    if (persona) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      const currentKeywords = form.getValues("voiceKeywords");
      form.setValue("voiceKeywords", [...currentKeywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (index: number) => {
    const currentKeywords = form.getValues("voiceKeywords");
    form.setValue("voiceKeywords", currentKeywords.filter((_, i) => i !== index));
  };

  const addDoSay = () => {
    if (newDoSay.trim()) {
      const currentDoSay = form.getValues("doSay");
      form.setValue("doSay", [...currentDoSay, newDoSay.trim()]);
      setNewDoSay("");
    }
  };

  const removeDoSay = (index: number) => {
    const currentDoSay = form.getValues("doSay");
    form.setValue("doSay", currentDoSay.filter((_, i) => i !== index));
  };

  const addDontSay = () => {
    if (newDontSay.trim()) {
      const currentDontSay = form.getValues("dontSay");
      form.setValue("dontSay", [...currentDontSay, newDontSay.trim()]);
      setNewDontSay("");
    }
  };

  const removeDontSay = (index: number) => {
    const currentDontSay = form.getValues("dontSay");
    form.setValue("dontSay", currentDontSay.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Persona Management</h1>
            <p className="text-gray-600 mt-1">Configure your AI companion's personality and behavior</p>
          </div>
          {persona && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Active
            </Badge>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Define your AI persona's core identity and characteristics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Persona Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Nova, Luna, etc." {...field} />
                      </FormControl>
                      <FormDescription>
                        Choose a memorable name for your AI companion
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio / Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., Playful, warm, and attentive. Loves to make people smile..."
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        A brief description of your persona's personality
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="disclosure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disclosure Statement</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., You're chatting with Nova, my AI assistant 💬"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Required disclaimer shown to users (for transparency)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Personality & Voice */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Personality & Voice
                </CardTitle>
                <CardDescription>
                  Define how your AI should communicate and behave
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Voice Keywords */}
                <FormField
                  control={form.control}
                  name="voiceKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voice Keywords</FormLabel>
                      <FormDescription>
                        Personality traits that define your AI's communication style
                      </FormDescription>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {field.value.map((keyword, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="flex items-center gap-1"
                          >
                            {keyword}
                            <button
                              type="button"
                              onClick={() => removeKeyword(index)}
                              className="text-xs hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., warm, playful, teasing"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                        />
                        <Button type="button" onClick={addKeyword} variant="outline" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Do Say */}
                <FormField
                  control={form.control}
                  name="doSay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do Say (Encouraged Topics)</FormLabel>
                      <FormDescription>
                        Topics and conversation styles your AI should use
                      </FormDescription>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {field.value.map((item, index) => (
                          <Badge 
                            key={index} 
                            variant="outline"
                            className="flex items-center gap-1 border-green-200 text-green-700"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeDoSay(index)}
                              className="text-xs hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., compliments, light teasing, curiosity"
                          value={newDoSay}
                          onChange={(e) => setNewDoSay(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDoSay())}
                        />
                        <Button type="button" onClick={addDoSay} variant="outline" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Don't Say */}
                <FormField
                  control={form.control}
                  name="dontSay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Don't Say (Forbidden Topics)</FormLabel>
                      <FormDescription>
                        Topics and behaviors your AI should never engage with
                      </FormDescription>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {field.value.map((item, index) => (
                          <Badge 
                            key={index} 
                            variant="outline"
                            className="flex items-center gap-1 border-red-200 text-red-700"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeDontSay(index)}
                              className="text-xs hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., explicit content, age references, IRL meetings"
                          value={newDontSay}
                          onChange={(e) => setNewDontSay(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDontSay())}
                        />
                        <Button type="button" onClick={addDontSay} variant="outline" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Offer Menu */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Offer Menu
                </CardTitle>
                <CardDescription>
                  Products and services your AI can offer to fans
                </CardDescription>
              </CardHeader>
              <CardContent>
                {persona?.offerMenu && persona.offerMenu.length > 0 ? (
                  <div className="space-y-3">
                    {persona.offerMenu.map((offer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{offer.label}</p>
                          <p className="text-sm text-gray-500">SKU: {offer.sku}</p>
                        </div>
                        <p className="text-lg font-bold">${(offer.priceCents / 100).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No offer menu configured</p>
                    <p className="text-sm">Offers will be managed in the future</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {persona ? "Update Persona" : "Create Persona"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

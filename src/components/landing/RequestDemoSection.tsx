import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const demoRequestSchema = z.object({
  name: z.string().trim().min(2, "Full name is required").max(120),
  hospital: z.string().trim().min(2, "Hospital / facility is required").max(160),
  email: z.string().trim().email("Please enter a valid work email").max(255),
  phone: z.string().trim().max(40).optional(),
});

const RequestDemoSection = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    hospital: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = demoRequestSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: parsed.error.errors[0]?.message || "Please fill in required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("demo_requests").insert({
      name: parsed.data.name,
      hospital: parsed.data.hospital,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
    });
    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Demo request could not be saved",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setSubmitted(true);
    toast({
      title: "Demo request received",
      description: "Our team will reach out within 24 hours to schedule your walkthrough.",
    });
  };

  return (
    <section id="request-demo" className="py-20 md:py-28 bg-muted/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-3 block">
              Request a Demo
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-5 tracking-tight">
              See Hospital Flow in action
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              Schedule a personalized live walkthrough with our team before you subscribe.
              We'll tailor the demo to your facility's workflow and answer all your questions.
            </p>
            <ul className="space-y-3 text-foreground/90">
              {[
                "30-minute guided product tour",
                "Q&A with a healthcare specialist",
                "Custom subscription guidance",
                "No credit card required",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="shadow-xl border-border/40 backdrop-blur-sm">
              <CardContent className="p-8">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Thank you!</h3>
                    <p className="text-muted-foreground">
                      Your demo request has been received. We'll be in touch within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Full Name *
                      </label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Dr. Jane Doe"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Hospital / Facility *
                      </label>
                      <Input
                        value={form.hospital}
                        onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                        placeholder="General Hospital"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Work Email *
                      </label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@hospital.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Phone (optional)
                      </label>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+1 555 000 0000"
                      />
                    </div>
                    <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                      <Calendar className="w-4 h-4" />
                      {isSubmitting ? "Saving request..." : "Schedule My Demo"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      We'll respond within 24 hours to confirm your slot.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RequestDemoSection;

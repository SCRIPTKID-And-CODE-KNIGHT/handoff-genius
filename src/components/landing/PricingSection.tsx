import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Standard",
    price: "$199",
    period: "/month per facility",
    description: "Everything a hospital needs to run core referral workflows.",
    featured: false,
    features: [
      "Core referral management",
      "Up to 25 doctor accounts",
      "Hospital-to-hospital transfers",
      "Patient code lookup",
      "Email & in-app notifications",
      "Standard business-hours support",
    ],
    cta: "Choose Standard",
  },
  {
    name: "Premium",
    price: "$499",
    period: "/month per facility",
    description: "Advanced tooling, analytics and priority support for larger networks.",
    featured: true,
    features: [
      "Everything in Standard",
      "Unlimited doctor accounts",
      "Advanced analytics & reporting",
      "AI assistant & smart templates",
      "Custom integrations (HIS/EMR)",
      "Priority 24/7 support & SLA",
      "Dedicated success manager",
    ],
    cta: "Choose Premium",
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-3 block">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Choose Your Subscription
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Flexible plans built for hospitals and healthcare facilities of every size.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card
                className={`h-full relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${
                  plan.featured
                    ? "border-primary/60 shadow-lg bg-card"
                    : "border-border/40 bg-card/80"
                }`}
              >
                {plan.featured && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name} Plan</h3>
                  <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                  </div>
                  <Button
                    asChild
                    className="w-full mb-6"
                    variant={plan.featured ? "default" : "outline"}
                    size="lg"
                  >
                    <Link to="/login">{plan.cta}</Link>
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-foreground/90">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

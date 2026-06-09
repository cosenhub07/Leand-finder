import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function PricingPage({ onBack }) {
  const [currency, setCurrency] = useState("INR"); // INR or USD
  const [billing, setBilling] = useState("Monthly"); // Monthly or Annual
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const handlePayment = async (plan) => {
    if (plan.price === 0) return;
    setIsProcessing(true);
    try {
      const price = billing === "Annual" ? plan.annualPrice : plan.monthlyPrice;
      const { data: order } = await axios.post(`${API_BASE_URL}/payments/create-order`, {
        amount: price,
        currency: currency
      });

      const options = {
        key: "rzp_test_SeF3hCuxJwLbCM", // Razorpay Key ID
        amount: order.amount,
        currency: order.currency,
        name: "LeadFinder Pro",
        description: `${plan.name} Plan - ${billing}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await axios.post(`${API_BASE_URL}/payments/verify-payment`, response);
            alert("Payment successful! Welcome to LeadFinder Pro.");
          } catch (err) {
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
        },
        theme: {
          color: "#f97316", // orange accent
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert("Payment Failed: " + response.error.description);
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Failed to initiate payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPrice = (plan) => {
    if (plan.name === "Free") return 0;
    return billing === "Annual" ? plan.prices[currency].annual : plan.prices[currency].monthly;
  };

  const getAltPrice = (plan) => {
    if (plan.name === "Free") return "Forever free";
    if (currency === "USD") return ""; // Do not show INR equivalent
    const altValue = billing === "Annual" ? plan.prices["USD"].annual : plan.prices["USD"].monthly;
    return `Equivalent to $${altValue}/mo`;
  };

  const plans = [
    {
      name: "Free",
      icon: "🌱",
      description: "Perfect for testing the waters",
      leads: "50 lifetime leads",
      apiCost: "None",
      prices: { INR: { monthly: 0, annual: 0 }, USD: { monthly: 0, annual: 0 } },
      features: [
        { name: "Lead scoring", included: true },
        { name: "Website scraper (Step 1 only)", included: true },
        { name: "CSV export", included: true },
        { name: "WHOIS fallback", included: false },
        { name: "Serper.dev web search", included: false },
        { name: "Search history", included: false },
      ],
      cta: "Start Free →",
      ctaStyle: "bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10",
    },
    {
      name: "Starter",
      icon: "🚀",
      description: "For solo freelancers & small teams",
      leads: "1,500 leads/mo",
      apiCost: currency === "INR" ? "₹375" : "$4.50",
      prices: { INR: { monthly: 799, annual: 639 }, USD: { monthly: 9, annual: 7 } },
      features: [
        { name: "Lead scoring", included: true },
        { name: "Website scraper", included: true },
        { name: "CSV export", included: true },
        { name: "WHOIS fallback", included: true },
        { name: "Serper.dev web search", included: false },
        { name: "Search history", included: false },
      ],
      cta: "Get Started →",
      ctaStyle: "bg-transparent border border-slate-500 text-slate-300 hover:bg-slate-800",
    },
    {
      name: "Agency",
      icon: "⚡",
      description: "For growing marketing agencies",
      leads: "5,000 leads/mo",
      apiCost: currency === "INR" ? "₹1,440" : "$17.25",
      isPopular: true,
      prices: { INR: { monthly: 1999, annual: 1599 }, USD: { monthly: 23, annual: 18 } },
      features: [
        { name: "Everything in Starter", included: true },
        { name: "Full waterfall (Serper.dev)", included: true },
        { name: "CSV + Excel multi-sheet", included: true },
        { name: "Search history (last 30)", included: true },
        { name: "Priority support", included: true },
        { name: "Puppeteer JS rendering", included: false },
      ],
      cta: "Start 7-Day Trial →",
      ctaStyle: "bg-orange-500 hover:bg-orange-600 text-white font-semibold border border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)]",
    },
    {
      name: "Pro",
      icon: "👑",
      description: "Enterprise scale lead generation",
      leads: "15,000 leads/mo",
      apiCost: currency === "INR" ? "₹3,100" : "$37.10",
      prices: { INR: { monthly: 3999, annual: 3199 }, USD: { monthly: 47, annual: 37 } },
      features: [
        { name: "Everything in Agency", included: true },
        { name: "Puppeteer JS-rendered crawls", included: true },
        { name: "Email verification (MX+SMTP)", included: true },
        { name: "Unlimited search history", included: true },
        { name: "AI cold email gen (Gemini)", included: true },
        { name: "CRM export (HubSpot/Zoho)", included: true },
      ],
      cta: "Contact for Demo →",
      ctaStyle: "bg-transparent border border-slate-500 text-slate-300 hover:bg-slate-800",
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[#f1f5f9] font-inter py-12 px-4 selection:bg-orange-500/30">
      <div className="max-w-[1060px] mx-auto">
        
        {/* Header & Navigation */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
                ← Back
              </button>
            )}
            <h1 className="text-2xl font-bold font-space-grotesk tracking-tight">
              Lead<span className="text-[#f97316]">Finder</span> Pro
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Currency Toggle */}
            <div className="flex bg-[#1a2235] rounded-lg p-1 border border-[#1f2d45]">
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currency === "INR" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                onClick={() => setCurrency("INR")}
              >
                ₹ INR
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currency === "USD" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                onClick={() => setCurrency("USD")}
              >
                $ USD
              </button>
            </div>
            <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold px-2 py-1 rounded-full border border-indigo-500/30">BETA</span>
          </div>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-space-grotesk mb-4 tracking-tight">
            Find hot leads — not empty databases
          </h2>
          <p className="text-lg text-[#94a3b8] mb-8 max-w-2xl mx-auto">
            All API costs are covered by us. You only pay for results.
          </p>
          <div className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 rounded-full px-6 py-2 text-sm font-medium">
            🎁 FREE — Start with 50 free leads — no credit card required
          </div>

          {/* Billing Toggle */}
          <div className="mt-12 flex justify-center items-center gap-4">
            <span className={`text-sm font-medium ${billing === "Monthly" ? "text-white" : "text-slate-400"}`}>Monthly</span>
            <button 
              className="relative w-14 h-7 bg-[#1a2235] rounded-full border border-[#1f2d45] transition-colors focus:outline-none"
              onClick={() => setBilling(b => b === "Monthly" ? "Annual" : "Monthly")}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-[#f97316] transition-all duration-300 ${billing === "Annual" ? "left-8" : "left-1"}`} />
            </button>
            <span className={`text-sm font-medium flex items-center gap-2 ${billing === "Annual" ? "text-white" : "text-slate-400"}`}>
              Annual
              <span className="bg-orange-500/20 text-orange-400 text-[10px] uppercase px-2 py-0.5 rounded-full border border-orange-500/30 font-bold">Save 20%</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`relative bg-[#111827] rounded-2xl border flex flex-col p-6 transition-transform hover:-translate-y-1 duration-300 ${plan.isPopular ? 'border-[#f97316] shadow-[0_0_30px_rgba(249,115,22,0.1)]' : 'border-[#1f2d45]'}`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f97316] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  ⚡ Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <span className="text-2xl mb-3 block">{plan.icon}</span>
                <h3 className="text-xl font-bold mb-1 font-space-grotesk">{plan.name}</h3>
                <p className="text-[#64748b] text-sm h-10">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-space-grotesk tracking-tight">
                    {currency === "INR" ? "₹" : "$"}{getPrice(plan)}
                  </span>
                  <span className="text-[#64748b] text-sm">/mo</span>
                </div>
                <div className="text-xs text-[#64748b] mt-2 h-4">
                  {getAltPrice(plan)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 h-3">
                  {plan.name !== "Free" && currency === "INR" ? "+ 18% GST applicable" : ""}
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm font-semibold text-white mb-2 pb-2 border-b border-[#1f2d45]">{plan.leads}</div>
                <div className="bg-[#818cf8]/10 text-[#818cf8] text-xs py-1.5 px-3 rounded-lg border border-[#818cf8]/20 inline-block">
                  API cost covered: ~{plan.apiCost}/mo
                </div>
              </div>

              <div className="flex-1">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {feat.included ? (
                        <span className="text-green-500 mt-0.5">✓</span>
                      ) : (
                        <span className="text-slate-600 mt-0.5">–</span>
                      )}
                      <span className={feat.included ? "text-slate-300" : "text-slate-600"}>
                        {feat.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => handlePayment({ ...plan, monthlyPrice: plan.prices[currency].monthly, annualPrice: plan.prices[currency].annual })}
                disabled={isProcessing}
                className={`w-full py-2.5 rounded-lg text-sm transition-all text-center ${plan.ctaStyle}`}
              >
                {isProcessing ? "Processing..." : plan.cta}
              </button>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
}

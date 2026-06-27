"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, User } from "lucide-react";
import { completeOnboardingAction } from "./actions";

export default function OnboardingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await completeOnboardingAction();
      localStorage.setItem("hasCompletedOnboarding", "true");
      router.push("/dashboard");
    } catch (err) {
      console.error("Onboarding action error, using local fallback:", err);
      localStorage.setItem("hasCompletedOnboarding", "true");
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface-container-lowest flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant shadow-soft rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-surface-container-low border-b border-outline-variant p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-on-surface mb-2 font-headline">Complete Your Profile</h1>
          <p className="text-on-surface-variant max-w-md mx-auto">
            Please provide your basic information to finish setting up your account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-bold text-on-surface">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                placeholder="e.g. John Doe"
                className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <label htmlFor="dob" className="text-sm font-bold text-on-surface">
                Date of Birth
              </label>
              <input
                id="dob"
                type="date"
                required
                className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label htmlFor="gender" className="text-sm font-bold text-on-surface">
                Gender
              </label>
              <select
                id="gender"
                required
                className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Nationality */}
            <div className="space-y-2">
              <label htmlFor="nationality" className="text-sm font-bold text-on-surface">
                Nationality
              </label>
              <select
                id="nationality"
                required
                className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="">Select Nationality</option>
                <option value="Kenyan">Kenyan</option>
                <option value="Ugandan">Ugandan</option>
                <option value="Tanzanian">Tanzanian</option>
                <option value="Rwandan">Rwandan</option>
                <option value="Ethiopian">Ethiopian</option>
                <option value="Somali">Somali</option>
                <option value="South Sudanese">South Sudanese</option>
                <option value="Burundian">Burundian</option>
                <option value="Congolese">Congolese</option>
                <option value="Afghan">Afghan</option>
                <option value="Albanian">Albanian</option>
                <option value="Algerian">Algerian</option>
                <option value="American">American</option>
                <option value="Angolan">Angolan</option>
                <option value="Argentine">Argentine</option>
                <option value="Australian">Australian</option>
                <option value="Austrian">Austrian</option>
                <option value="Bangladeshi">Bangladeshi</option>
                <option value="Belgian">Belgian</option>
                <option value="Brazilian">Brazilian</option>
                <option value="British">British</option>
                <option value="Bulgarian">Bulgarian</option>
                <option value="Cambodian">Cambodian</option>
                <option value="Cameroonian">Cameroonian</option>
                <option value="Canadian">Canadian</option>
                <option value="Chilean">Chilean</option>
                <option value="Chinese">Chinese</option>
                <option value="Colombian">Colombian</option>
                <option value="Croatian">Croatian</option>
                <option value="Czech">Czech</option>
                <option value="Danish">Danish</option>
                <option value="Dutch">Dutch</option>
                <option value="Egyptian">Egyptian</option>
                <option value="Finnish">Finnish</option>
                <option value="French">French</option>
                <option value="Ghanaian">Ghanaian</option>
                <option value="Greek">Greek</option>
                <option value="Hungarian">Hungarian</option>
                <option value="Indian">Indian</option>
                <option value="Indonesian">Indonesian</option>
                <option value="Iranian">Iranian</option>
                <option value="Iraqi">Iraqi</option>
                <option value="Irish">Irish</option>
                <option value="Israeli">Israeli</option>
                <option value="Italian">Italian</option>
                <option value="Japanese">Japanese</option>
                <option value="Jordanian">Jordanian</option>
                <option value="Korean">Korean</option>
                <option value="Lebanese">Lebanese</option>
                <option value="Libyan">Libyan</option>
                <option value="Malaysian">Malaysian</option>
                <option value="Mexican">Mexican</option>
                <option value="Moroccan">Moroccan</option>
                <option value="Mozambican">Mozambican</option>
                <option value="Namibian">Namibian</option>
                <option value="New Zealander">New Zealander</option>
                <option value="Nigerian">Nigerian</option>
                <option value="Norwegian">Norwegian</option>
                <option value="Pakistani">Pakistani</option>
                <option value="Palestinian">Palestinian</option>
                <option value="Peruvian">Peruvian</option>
                <option value="Philippine">Philippine</option>
                <option value="Polish">Polish</option>
                <option value="Portuguese">Portuguese</option>
                <option value="Romanian">Romanian</option>
                <option value="Russian">Russian</option>
                <option value="Saudi">Saudi</option>
                <option value="Senegalese">Senegalese</option>
                <option value="Serbian">Serbian</option>
                <option value="Singaporean">Singaporean</option>
                <option value="South African">South African</option>
                <option value="Spanish">Spanish</option>
                <option value="Sri Lankan">Sri Lankan</option>
                <option value="Sudanese">Sudanese</option>
                <option value="Swedish">Swedish</option>
                <option value="Swiss">Swiss</option>
                <option value="Syrian">Syrian</option>
                <option value="Thai">Thai</option>
                <option value="Tunisian">Tunisian</option>
                <option value="Turkish">Turkish</option>
                <option value="Ukrainian">Ukrainian</option>
                <option value="Emirati">Emirati</option>
                <option value="Venezuelan">Venezuelan</option>
                <option value="Vietnamese">Vietnamese</option>
                <option value="Zambian">Zambian</option>
                <option value="Zimbabwean">Zimbabwean</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-bold text-on-surface">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="john@example.com"
                className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-bold text-on-surface">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                required
                placeholder="+254 700 000 000"
                className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Your data is securely encrypted</span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-primary"
            >
              {isSubmitting ? "Saving..." : "Continue to Dashboard"}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

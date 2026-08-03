import DemoSection from "../../components/marketing/DemoSection";
import FeaturesSection from "../../components/marketing/FeaturesSection";
import HeroSection from "../../components/marketing/HeroSection";
import IndustrySegmentsSection from "../../components/marketing/IndustrySegmentsSection";
import IndustryValueSection from "../../components/marketing/IndustryValueSection";
import MarketingFooter from "../../components/marketing/MarketingFooter";
import MarketingHeader from "../../components/marketing/MarketingHeader";
import MobileERPSection from "../../components/marketing/MobileERPSection";
import ProductShowcaseSection from "../../components/marketing/ProductShowcaseSection";
import TrustBadgeSection from "../../components/marketing/TrustBadgeSection";
import WorkflowSection from "../../components/marketing/WorkflowSection";
import "../../components/marketing/marketing.css";

export default function LandingPage() {
  return (
    <div className="marketing-root min-h-screen overflow-x-hidden bg-[#fffdf9] font-['Plus_Jakarta_Sans',Inter,sans-serif] text-[#0F172A] selection:bg-orange-500/20">
      <MarketingHeader />
      <main>
        <HeroSection />
        <TrustBadgeSection />
        <IndustryValueSection />
        <FeaturesSection />
        <ProductShowcaseSection />
        <WorkflowSection />
        <IndustrySegmentsSection />
        <MobileERPSection />
        <DemoSection />
      </main>
      <MarketingFooter />
    </div>
  );
}

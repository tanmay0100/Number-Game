import Header from "@/components/Header";
import WelcomeSection from "@/components/WelcomeSection";
import LuckyNumberSection from "@/components/LuckyNumberSection";
import LiveResultsSection from "@/components/LiveResultsSection";
import AppDownloadSection from "@/components/AppDownloadSection";
import GameResultsSection from "@/components/GameResultsSection";
import ResultTimingSection from "@/components/ResultTimingSection";
import DailyGamesZone from "@/components/DailyGamesZone";
import PlayNowSection from "@/components/PlayNowSection";
import ChartZone from "@/components/ChartZone";
import TalkToExpertSection from "@/components/TalkToExpertSection";
import AboutSattaMatka from "@/components/AboutSattaMatka";
import DisclaimerSection from "@/components/DisclaimerSection";
import FooterSection from "@/components/FooterSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        <WelcomeSection />
        <LuckyNumberSection />
        <LiveResultsSection />
        <AppDownloadSection />
        <GameResultsSection />
        <ResultTimingSection />
        <DailyGamesZone />
        <PlayNowSection />
        <ChartZone />
        <TalkToExpertSection />
        <AboutSattaMatka />
        <DisclaimerSection />
      </div>
      
      <FooterSection />
    </div>
  );
}

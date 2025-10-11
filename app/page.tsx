// app/page.tsx
import Navbar from '@/components/Navbar';
import HeroModern from '@/components/HeroModern';
import FeatureGrid from '@/components/FeatureGrid';
import HowItWorksSteps from '@/components/HowItWorksSteps';
import TestimonialCarousel from '@/components/TestimonialCarousel';
import CallToActionBlock from '@/components/CallToActionBlock';
import type { Metadata } from 'next';

// Metadata for SEO
export const metadata: Metadata = {
    title: 'SkillSwap: The Decentralized Learning Revolution | Trade Knowledge, Not Money',
    description: 'Join SkillSwap to trade your skills for others. A peer-to-peer marketplace for learning without cost barriers, empowering global community growth.',
};

export default function Home() {
    return (
        <div className="min-h-screen antialiased">
            <Navbar /> {/* Global Navigation */}

            <main>
                <HeroModern />           {/* The grand hero section */}
                <FeatureGrid />          {/* Why SkillSwap is powerful */}
                <HowItWorksSteps />      {/* Detailed steps on how it works */}
                <TestimonialCarousel />  {/* Social proof and real stories */}
                <CallToActionBlock />    {/* Final call to action */}
            </main>

        </div>
    );
}
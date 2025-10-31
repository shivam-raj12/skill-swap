
import Navbar from '@/components/Navbar';
import HeroModern from '@/components/HeroModern';
import FeatureGrid from '@/components/FeatureGrid';
import HowItWorksSteps from '@/components/HowItWorksSteps';
import TestimonialCarousel from '@/components/TestimonialCarousel';
import CallToActionBlock from '@/components/CallToActionBlock';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'SkillSwap: The Decentralized Learning Revolution | Trade Knowledge, Not Money',
    description: 'Join SkillSwap to trade your skills for others. A peer-to-peer marketplace for learning without cost barriers, empowering global community growth.',
};

export default function Home() {
    return (
        <div className="min-h-screen antialiased">
            <Navbar /> {}

            <main>
                <HeroModern />
                <FeatureGrid />
                <HowItWorksSteps />
                <TestimonialCarousel />
                <CallToActionBlock />
            </main>

        </div>
    );
}
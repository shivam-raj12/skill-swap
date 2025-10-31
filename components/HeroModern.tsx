
import Link from 'next/link';

const HeroModern: React.FC = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center text-center px-6 py-24 md:py-32 bg-gradient-to-br from-indigo-900 via-gray-900 to-black text-white overflow-hidden">
            {/* Background Visuals (Conceptual: glowing orbs, subtle animations) */}
            <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-400 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-3/4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                <p className="text-lg md:text-xl font-semibold text-emerald-300 uppercase tracking-wide mb-4 animate-fade-in-up delay-200">
                    Find Your Power. Share What You Know.
                </p>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight mb-8 animate-fade-in-up delay-400">
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-indigo-300">
            SkillSwap:
          </span>
                    <span className="block mt-4 text-white">The New Way to Learn.</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto animate-fade-in-up delay-600">
                    Trade your skills for knowledge you want. No money, just sharing knowledge with people all over the world.
                </p>

                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 animate-fade-in-up delay-800">
                    <Link href="#get-started" className="block">
                        <button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg transition duration-300 transform hover:scale-105 active:scale-95 ease-out focus:outline-none focus:ring-4 focus:ring-emerald-300">
                            Start Swapping Now
                        </button>
                    </Link>
                    <Link href="#features" className="block">
                        <button className="w-full sm:w-auto text-white border border-gray-400 hover:border-emerald-500 hover:text-emerald-300 font-semibold py-4 px-10 rounded-full text-lg transition duration-300 transform hover:scale-105 active:scale-95 ease-out focus:outline-none focus:ring-4 focus:ring-gray-600">
                            See What We Offer
                        </button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default HeroModern;
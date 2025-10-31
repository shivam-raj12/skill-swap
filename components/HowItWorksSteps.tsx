
import Image from 'next/image'; // We must import the Image component

type Step = {
    number: number;
    title: string;
    description: string;
    illustration: string; // This will now hold the actual file path
};

const steps: Step[] = [
    {
        number: 1,
        title: 'Show Your Skills',
        description: 'Make a profile that shows what you are good at and what you want to learn. Be clear!',

        illustration: '/images/step-1-show-skills.png',
    },
    {
        number: 2,
        title: 'Find Your Match',
        description: 'Our smart AI finds the best people to swap skills with you, connecting needs with offers everywhere.',

        illustration: '/images/step-2-find-match.png',
    },
    {
        number: 3,
        title: 'Talk and Work Together',
        description: 'Talk with your match, agree on how it will work, and start your fun journey of learning and getting better.',

        illustration: '/images/step-3-talk-work.png',
    },
    {
        number: 4,
        title: 'Swap and Get Better',
        description: 'Share what you know, learn new things, and see your skills grow without paying any money.',

        illustration: '/images/step-4-swap-grow.png',
    },
];

const HowItWorksSteps: React.FC = () => {
    return (
        <section id="how-it-works" className="py-24 bg-gradient-to-br from-indigo-700 to-indigo-900 text-white">
            <div className="container mx-auto px-6 max-w-7xl">
                <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-6">
                    How to Learn Anything You Want
                </h2>
                <p className="text-xl text-center text-indigo-200 mb-16 max-w-3xl mx-auto">
                    SkillSwap makes trading knowledge simple in four easy steps.
                </p>

                <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-16 items-center">
                    {steps.map((step, index) => (
                        <div
                            key={step.number}
                            className={`flex flex-col md:flex-row items-center gap-8 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                        >
                            {/* Step Number & Content */}
                            <div className="md:w-1/2 text-center md:text-left">
                <span className="text-6xl font-black text-emerald-400 opacity-70 mb-4 block">
                  0{step.number}
                </span>
                                <h3 className="text-3xl font-bold mb-3 text-white">
                                    {step.title}
                                </h3>
                                <p className="text-indigo-100 text-lg">
                                    {step.description}
                                </p>
                            </div>

                            {/* Picture Area (NEW CODE HERE) */}
                            <div className="md:w-1/2 flex justify-center p-4">
                                <div className="w-full max-w-md h-auto bg-transparent rounded-2xl shadow-xl overflow-hidden">
                                    <Image
                                        src={step.illustration}
                                        alt={`Illustration for ${step.title}`}
                                        width={450} // Set a size that looks good and loads fast
                                        height={450}
                                        priority={index === 0} // Load the first image fast
                                        className="w-full h-auto object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSteps;
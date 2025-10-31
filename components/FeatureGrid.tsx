
type Feature = {
    icon: string; // Emoji for simplicity, could be SVG paths
    title: string;
    description: string;
};

const features: Feature[] = [
    {
        icon: '🌍',
        title: 'World-Wide Group',
        description: 'Meet people and experts from every part of the world, growing your network like never before.',
    },
    {
        icon: '💡',
        title: 'Many Types of Skills',
        description: 'From coding to cooking, design to language, you can find and share a huge list of useful skills.',
    },
    {
        icon: '💰',
        title: '100% Free Exchange',
        description: 'No money problems. All skill trades are based on fair value, meaning everyone can learn.',
    },
    {
        icon: '🔒',
        title: 'Safe and You Can Trust Us',
        description: 'Our system and rules make sure your exchanges are safe, valuable, and respectful.',
    },
    {
        icon: '📈',
        title: 'Learn Faster',
        description: 'Get new skills faster by talking directly with experienced people and teaching what you know.',
    },
    {
        icon: '✨',
        title: 'Easy Matching',
        description: 'Our smart system finds the perfect people for you to trade skills with, based on what you need and what you offer.',
    },
];

const FeatureGrid: React.FC = () => {
    return (
        <section id="features" className="py-24 bg-gray-50 text-gray-800">
            <div className="container mx-auto px-6 max-w-6xl">
                <h2 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-6">
                    How SkillSwap Helps You Grow
                </h2>
                <p className="text-xl text-center text-gray-600 mb-16 max-w-3xl mx-auto">
                    We are making a platform where knowledge is your money and learning has no limits.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className="flex flex-col items-center p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-500 ease-in-out transform hover:-translate-y-2 border border-gray-100"
                        >
                            <div className="text-5xl mb-6 bg-emerald-100 p-4 rounded-full">
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 text-center">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeatureGrid;
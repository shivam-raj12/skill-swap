
const SocialProof: React.FC = () => {
    return (
        <section className="py-20 bg-emerald-50">
            <div className="container mx-auto px-6 max-w-6xl">

                {/* Statistics Counter */}
                <div className="text-center mb-16">
                    <h2 className="text-6xl md:text-8xl font-black text-emerald-600">
                        12,450+
                    </h2>
                    <p className="text-2xl text-gray-700 font-semibold mt-2">
                        Skills Traded Globally
                    </p>
                </div>

                {/* Example Swaps */}
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="p-4 bg-white rounded-lg shadow-md border-l-4 border-violet-400 text-gray-700">
                        <span className="font-semibold text-emerald-600">Alice</span> traded her <span className="font-bold">Spanish Tutoring</span> for <span className="font-semibold text-emerald-600">Bob&#39;s</span> <span className="font-bold">Figma Design Tips</span>.
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-md border-l-4 border-violet-400 text-gray-700">
                        <span className="font-semibold text-emerald-600">Marco</span> swapped his <span className="font-bold">Next.js Knowledge</span> for <span className="font-semibold text-emerald-600">Sarah&#39;s</span> <span className="font-bold">Advanced Photography skills</span>.
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-md border-l-4 border-violet-400 text-gray-700">
                        <span className="font-semibold text-emerald-600">Jane</span> offered her <span className="font-bold">Organic Gardening secrets</span> for <span className="font-semibold text-emerald-600">David&#39;s</span> <span className="font-bold">Basic Accounting lessons</span>.
                    </div>
                </div>

            </div>
        </section>
    );
};

export default SocialProof;
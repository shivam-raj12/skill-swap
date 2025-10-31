
import Link from 'next/link';

const CallToActionBlock: React.FC = () => {
    return (
        <section className="py-24 bg-indigo-700 text-white">
            <div className="container mx-auto px-6 max-w-5xl text-center">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                    Ready to Make Your Skills Better?
                </h2>
                <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
                    Join thousands of excited people who are trading knowledge and growing together. Your next skill is waiting for a swap.
                </p>
                <Link href="/register">
                    <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-12 rounded-full text-xl shadow-xl transition duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-300">
                        Sign Up For Free
                    </button>
                </Link>
            </div>
        </section>
    );
};

export default CallToActionBlock;

import Link from 'next/link';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-900 text-gray-300 py-16">
            <div className="container mx-auto px-6 max-w-7xl grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-12">
                {/* Brand Info */}
                <div className="col-span-1 md:col-span-2 lg:col-span-1">
                    <Link href="/" className="flex items-center space-x-2 mb-4">
                        <span className="text-3xl">✨</span> {/* Replace with actual logo SVG later */}
                        <span className="font-extrabold text-3xl text-white">Skill<span className="text-emerald-500">Swap</span></span>
                    </Link>
                    <p className="text-gray-400 text-sm">
                        The decentralized platform for skill exchange. Learn, teach, and grow with a global community, without financial barriers.
                    </p>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="font-semibold text-white text-lg mb-6">Quick Links</h4>
                    <ul className="space-y-3">
                        <li><Link href="#features" className="text-gray-400 hover:text-white transition duration-200">Features</Link></li>
                        <li><Link href="#how-it-works" className="text-gray-400 hover:text-white transition duration-200">How It Works</Link></li>
                        <li><Link href="#testimonials" className="text-gray-400 hover:text-white transition duration-200">Testimonials</Link></li>
                        <li><Link href="/faq" className="text-gray-400 hover:text-white transition duration-200">FAQ</Link></li>
                    </ul>
                </div>

                {/* Resources */}
                <div>
                    <h4 className="font-semibold text-white text-lg mb-6">Resources</h4>
                    <ul className="space-y-3">
                        <li><Link href="/blog" className="text-gray-400 hover:text-white transition duration-200">Blog</Link></li>
                        <li><Link href="/support" className="text-gray-400 hover:text-white transition duration-200">Support</Link></li>
                        <li><Link href="/terms" className="text-gray-400 hover:text-white transition duration-200">Terms of Service</Link></li>
                        <li><Link href="/privacy" className="text-gray-400 hover:text-white transition duration-200">Privacy Policy</Link></li>
                    </ul>
                </div>

                {/* Contact/Social (Placeholder) */}
                <div>
                    <h4 className="font-semibold text-white text-lg mb-6">Connect</h4>
                    <ul className="space-y-3">
                        <li><a href="#" className="text-gray-400 hover:text-white transition duration-200">Twitter</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-white transition duration-200">Discord</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-white transition duration-200">LinkedIn</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-white transition duration-200">Email Us</a></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} SkillSwap. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;

"use client"
import Link from 'next/link';
import React, { useState } from 'react';

const MobileMenu: React.FC<{ isOpen: boolean, closeMenu: () => void }> = ({ isOpen, closeMenu }) => {

    const linkClass = "block w-full text-center py-3 text-gray-800 hover:bg-gray-200 transition duration-300 border-b border-gray-300 last:border-b-0";

    return (
        <div

            className={`fixed top-20 left-0 h-full w-full bg-white z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            onClick={closeMenu}
        >
            <div className="flex flex-col items-center space-y-2 pt-6">

                {/* Main Links */}
                <Link href="#features" className={linkClass}>Features</Link>
                <Link href="#how-it-works" className={linkClass}>How It Works</Link>
                <Link href="#testimonials" className={linkClass}>Testimonials</Link>

                {/* Auth Links */}
                <div className="w-full pt-4">
                    <Link href="/login" className="block w-full text-center py-3 text-indigo-700 hover:bg-gray-100 transition duration-300">
                        Sign In
                    </Link>
                    <Link href="/register" className="block w-3/4 mx-auto my-4">
                        <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-full shadow-lg transition duration-300">
                            Join Free
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

const Navbar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <>
            <nav
                className="fixed w-full z-50 bg-white bg-opacity-90 backdrop-blur-sm shadow-md py-4 transition duration-300"
            >
                <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">

                    <Link href="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <span className="text-3xl">
              <span className="text-yellow-500">✨</span>
            </span>
                        <span className="font-extrabold text-3xl text-indigo-700">
              Skill<span className="text-emerald-500">Swap</span>
            </span>
                    </Link>

                    <div className="hidden md:flex space-x-8 items-center">
                        <Link href="#features" className="text-gray-700 hover:text-emerald-500 font-medium transition duration-300">
                            Features
                        </Link>
                        <Link href="#how-it-works" className="text-gray-700 hover:text-emerald-500 font-medium transition duration-300">
                            How It Works
                        </Link>
                        <Link href="#testimonials" className="text-gray-700 hover:text-emerald-500 font-medium transition duration-300">
                            Testimonials
                        </Link>

                        {/* Sign In Button */}
                        <Link href="/login" className="text-indigo-700 hover:text-indigo-900 font-semibold py-2 px-4 rounded-full transition duration-300">
                            Sign In
                        </Link>

                        <Link href="/register">
                            <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95">
                                Join Free
                            </button>
                        </Link>
                    </div>

                    <div className="md:hidden">
                        <button
                            onClick={toggleMenu}
                            className="text-gray-700 text-3xl focus:outline-none" // Use dark color
                            aria-label="Toggle Menu"
                        >
                            {isMenuOpen ? '✕' : '☰'}
                        </button>
                    </div>
                </div>
            </nav>

            <MobileMenu isOpen={isMenuOpen} closeMenu={closeMenu} />
        </>
    );
};

export default Navbar;
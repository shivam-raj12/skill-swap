
type Testimonial = {
    quote: string;
    author: string;
    skillOffered: string;
    skillReceived: string;
    avatar: string; // Placeholder for image path
};

const testimonials: Testimonial[] = [
    {
        quote: "SkillSwap changed my career path! I traded my marketing expertise for advanced Python lessons and landed my dream data science job.",
        author: "Aisha Khan",
        skillOffered: "Digital Marketing",
        skillReceived: "Python Programming",
        avatar: "/images/avatar-aisha.jpg",
    },
    {
        quote: "As a musician, I never thought I'd learn web design without huge costs. Thanks to SkillSwap, I swapped guitar lessons for a stunning portfolio website!",
        author: "Markus 'Strings' Miller",
        skillOffered: "Guitar Lessons",
        skillReceived: "Web Design",
        avatar: "/images/avatar-markus.jpg",
    },
    {
        quote: "The community on SkillSwap is incredible. I not only learned fluent Spanish but also made a lifelong friend by teaching English.",
        author: "Sophia Chen",
        skillOffered: "English Tutoring",
        skillReceived: "Spanish Fluency",
        avatar: "/images/avatar-sophia.jpg",
    },
];

const TestimonialCarousel: React.FC = () => {
    return (
        <section id="testimonials" className="py-24 bg-gradient-to-b from-emerald-50 to-white text-gray-800">
            <div className="container mx-auto px-6 max-w-6xl">
                <h2 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-6">
                    Real Stories. Real Growth.
                </h2>
                <p className="text-xl text-center text-gray-600 mb-16 max-w-3xl mx-auto">
                    Hear from our incredible community members who are transforming their lives through skill exchange.
                </p>

                {/* Testimonial Grid (can be a carousel with JS later) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="bg-white p-8 rounded-xl shadow-xl border-t-4 border-emerald-400 flex flex-col items-center text-center"
                        >
                            {/* Avatar placeholder */}
                            <div className="w-24 h-24 bg-gray-200 rounded-full mb-6 flex items-center justify-center text-gray-600 font-bold text-lg overflow-hidden">
                                {/* Image tag for actual avatars later */}
                                {/* <img src={testimonial.avatar} alt={testimonial.author} className="w-full h-full object-cover" /> */}
                                {testimonial.author.split(' ').map(n => n[0]).join('')}
                            </div>
                            <p className="text-xl italic text-gray-700 mb-6">
                                &ldquo;{testimonial.quote}&rdquo;
                            </p>
                            <p className="font-bold text-gray-900 text-lg">
                                - {testimonial.author}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Traded <span className="text-indigo-600 font-semibold">{testimonial.skillOffered}</span> for <span className="text-emerald-600 font-semibold">{testimonial.skillReceived}</span>
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialCarousel;
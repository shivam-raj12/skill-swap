import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Skill Swap – Learn & Teach</title>
        <meta name="description" content="A community to exchange skills and knowledge. Find partners to learn and teach together!" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-100 to-pink-50">
        <section className="flex flex-col items-center justify-center py-24 px-4">
          {/* Hero Section */}
          <div className="text-center max-w-2xl">
            <h1 className="text-5xl font-extrabold text-purple-700 mb-6 drop-shadow-lg">
              Skill Swap
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Exchange skills, connect, and grow together.<br />
              Post what you can teach. Share what you want to learn. Get matched instantly!
            </p>
            <a
              href="#how-it-works"
              className="inline-block px-8 py-4 text-lg font-semibold rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg hover:scale-105 transition"
            >
              Get Started
            </a>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 px-4 bg-white/70 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-purple-700 mb-10">
              How It Works
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="bg-purple-100 rounded-full p-4 mb-3">
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-purple-500">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m2 4H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-purple-700 mb-2">Post Your Skill</h3>
                <p className="text-gray-600 text-center max-w-xs">Let others know what you can teach or share.</p>
              </div>
              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="bg-pink-100 rounded-full p-4 mb-3">
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-pink-500">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-8m0 8l-4-4m4 4l4-4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-pink-700 mb-2">Find a Match</h3>
                <p className="text-gray-600 text-center max-w-xs">Get paired with people who want to learn from you or teach you.</p>
              </div>
              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 rounded-full p-4 mb-3">
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2 0 .74.4 1.38 1 1.73V17a2 2 0 104 0v-5.27c.6-.35 1-.99 1-1.73 0-1.1-.9-2-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-blue-700 mb-2">Learn & Teach</h3>
                <p className="text-gray-600 text-center max-w-xs">Grow your expertise and help others in the community.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Skills */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-purple-700 mb-8">
              Featured Skills
            </h2>
            <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-8">
              {[
                { skill: "Web Development", want: "UI/UX Design", color: "from-purple-400 to-pink-400" },
                { skill: "Spanish Language", want: "French Language", color: "from-yellow-300 to-red-300" },
                { skill: "Guitar", want: "Piano", color: "from-green-300 to-blue-300" },
              ].map(({ skill, want, color }, idx) => (
                <div key={idx} className={`rounded-xl shadow-lg p-6 bg-gradient-to-r ${color} text-white`}>
                  <h3 className="font-bold text-xl mb-2">{skill}</h3>
                  <div className="text-sm">Wants to learn: <span className="font-semibold">{want}</span></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-gray-500">
          Made with <span className="text-pink-500">♥</span> for learners & teachers.
        </footer>
      </main>
    </>
  );
}
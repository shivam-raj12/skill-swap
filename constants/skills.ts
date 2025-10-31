


interface SkillNode {
    id: string;
    name: string;
    subsections?: SkillNode[];
    subSubsections?: string[];
}
export const SKILL_HIERARCHY: SkillNode[] = [
    {
        id: 'tech',
        name: 'Technology & Development',
        subsections: [
            {
                id: 'webdev',
                name: 'Web Development',
                subSubsections: [
                    'HTML/CSS', 'JavaScript', 'TypeScript',
                    'React', 'Next.js', 'Vue.js', 'Angular',
                    'Svelte', 'Tailwind CSS',
                    'Node.js', 'Express.js', 'Django', 'Laravel',
                    'GraphQL', 'REST APIs',
                ],
            },
            {
                id: 'mobile',
                name: 'Mobile Development',
                subSubsections: [
                    'iOS (Swift)', 'Android (Kotlin/Java)',
                    'React Native', 'Flutter', 'Progressive Web Apps (PWAs)',
                ],
            },
            {
                id: 'data',
                name: 'Data Science & AI',
                subSubsections: [
                    'Python', 'R', 'SQL/Database Design',
                    'Data Analysis (Pandas)', 'Data Visualization',
                    'Machine Learning', 'Deep Learning',
                    'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision',
                    'Big Data (Hadoop, Spark)',
                ],
            },
            {
                id: 'cloud',
                name: 'Cloud & DevOps',
                subSubsections: [
                    'AWS', 'Azure', 'Google Cloud (GCP)',
                    'Docker', 'Kubernetes', 'CI/CD',
                    'Terraform', 'Linux/Unix', 'Cybersecurity',
                ],
            },
            {
                id: 'game',
                name: 'Game Development',
                subSubsections: [
                    'Unity', 'Unreal Engine', 'Game Design Principles',
                    '2D/3D Game Art', 'C# for Games', 'Shaders',
                ],
            },
            {
                id: 'cyber',
                name: 'Cybersecurity',
                subSubsections: [
                    'Ethical Hacking', 'Penetration Testing',
                    'Network Security', 'Cloud Security',
                    'Cybersecurity Fundamentals',
                ],
            },
        ],
    },
    {
        id: 'creative',
        name: 'Creative & Design',
        subsections: [
            {
                id: 'visual',
                name: 'Visual Design',
                subSubsections: [
                    'Photoshop', 'Illustrator', 'Figma', 'Sketch',
                    'UI/UX Design', 'Branding', 'Typography',
                    '3D Design (Blender, Maya)', 'Motion Graphics',
                ],
            },
            {
                id: 'media',
                name: 'Video & Audio',
                subSubsections: [
                    'Video Editing (Premiere Pro, DaVinci Resolve)',
                    'After Effects Animation',
                    'Photography', 'Cinematography',
                    'Podcasting', 'Music Production', 'Sound Design',
                ],
            },
            {
                id: 'writing',
                name: 'Writing & Content',
                subSubsections: [
                    'Copywriting', 'Creative Writing',
                    'Technical Writing', 'Blogging',
                    'SEO Content Writing', 'Storytelling',
                    'Scriptwriting', 'Academic Writing',
                ],
            },
            {
                id: 'art',
                name: 'Art & Digital Illustration',
                subSubsections: [
                    'Drawing (Digital)', 'Painting (Digital)',
                    'Character Design', 'Animation (2D/3D)',
                    'Concept Art', 'Comics & Manga Creation',
                ],
            },
        ],
    },
    {
        id: 'languages',
        name: 'Languages & Communication',
        subsections: [
            { id: 'english', name: 'English' },
            { id: 'spanish', name: 'Spanish' },
            { id: 'french', name: 'French' },
            { id: 'german', name: 'German' },
            { id: 'mandarin', name: 'Mandarin Chinese' },
            { id: 'japanese', name: 'Japanese' },
            { id: 'hindi', name: 'Hindi' },
            { id: 'arabic', name: 'Arabic' },
            { id: 'public', name: 'Public Speaking' },
            { id: 'negotiation', name: 'Negotiation Skills' },
            { id: 'debate', name: 'Debating & Persuasion' },
            { id: 'storytelling', name: 'Storytelling & Pitching' },
        ],
    },
    {
        id: 'business',
        name: 'Business & Finance',
        subsections: [
            {
                id: 'finance',
                name: 'Finance & Accounting',
                subSubsections: [
                    'Excel/Spreadsheets', 'Budgeting',
                    'Financial Accounting', 'Bookkeeping',
                    'Investment Strategy', 'Financial Modeling',
                    'Cryptocurrency Fundamentals',
                ],
            },
            {
                id: 'trading',
                name: 'Trading & Investments',
                subSubsections: [
                    'Stock Trading', 'Options Trading', 'Forex Trading',
                    'Cryptocurrency Trading', 'Commodities Trading',
                    'Technical Analysis', 'Fundamental Analysis',
                    'Day Trading', 'Swing Trading',
                    'Portfolio Diversification', 'Risk Management',
                ],
            },
            {
                id: 'marketing',
                name: 'Marketing',
                subSubsections: [
                    'Digital Marketing Basics', 'Social Media Marketing',
                    'Email Campaigns', 'Content Marketing',
                    'SEO', 'Paid Ads (Google, Facebook)',
                    'Market Research', 'Brand Strategy',
                ],
            },
            {
                id: 'management',
                name: 'Management & Leadership',
                subSubsections: [
                    'Project Management', 'Agile/Scrum',
                    'Team Leadership', 'Decision Making',
                    'Remote Team Management', 'Time Management',
                    'Conflict Resolution', 'Entrepreneurship',
                ],
            },
        ],
    },
    {
        id: 'personal',
        name: 'Personal Development',
        subsections: [
            {
                id: 'soft',
                name: 'Soft Skills',
                subSubsections: [
                    'Critical Thinking', 'Problem Solving',
                    'Adaptability', 'Creativity',
                    'Emotional Intelligence', 'Collaboration',
                    'Leadership Development', 'Decision Making',
                ],
            },
            {
                id: 'productivity',
                name: 'Productivity & Learning',
                subSubsections: [
                    'Time Management', 'Note-taking Methods',
                    'Study Skills', 'Mind Mapping',
                    'Speed Reading', 'Memory Techniques',
                ],
            },
            {
                id: 'wellness',
                name: 'Health & Wellness (Online)',
                subSubsections: [
                    'Yoga (Online Instruction)', 'Meditation & Mindfulness',
                    'Stress Management', 'Nutrition Basics',
                    'Fitness Coaching (Virtual)', 'Work-Life Balance',
                ],
            },
        ],
    },
    {
        id: 'science',
        name: 'Science & Research (Theory-focused)',
        subsections: [
            {
                id: 'natural',
                name: 'Natural Sciences',
                subSubsections: [
                    'Biology Basics', 'Chemistry Basics',
                    'Physics Fundamentals', 'Astronomy',
                    'Environmental Science', 'Climate Studies',
                ],
            },
            {
                id: 'social',
                name: 'Social Sciences',
                subSubsections: [
                    'Psychology', 'Sociology',
                    'Economics', 'Political Science',
                    'Anthropology', 'Philosophy',
                ],
            },
            {
                id: 'applied',
                name: 'Applied Sciences (Theory)',
                subSubsections: [
                    'Computer Science Concepts',
                    'Engineering Fundamentals',
                    'Biotechnology (Theory)',
                    'Medical Research Basics',
                ],
            },
        ],
    },
];
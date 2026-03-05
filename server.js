const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Custom DB Client (Handles Supabase or Local JSON)
const db = require('./supabaseClient.js');

// --- CONFIG ---
const app = express();
const PORT = process.env.PORT || 8000;
const SECRET_KEY = process.env.JWT_SECRET || "my_super_secret_key_12345";

// --- MIDDLEWARE ---
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for simpler vanilla JS development
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname, '.')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- FILE UPLOAD ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Only PDF allowed!'))
});

// --- RESUME PARSING LOGIC ---
const extractResumeData = (text) => {
    if (!text) return { email: "Not Found", phone: "Not Found", skills: [], workSnippet: "", educationSnippet: "" };
    // ... use existing regex logic ...
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emails = text.match(emailRegex) || [];
    const phoneRegex = /(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g; /* ... */
    const phones = text.match(phoneRegex) || [];
    const skillDictionary = ["JavaScript", "Python", "Java", "React", "Node.js", "SQL", "HTML", "CSS", "AWS", "Docker", "Git", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby", "Angular", "Vue", "Svelte", "Next.js", "Express", "Django", "Flask", "Spring", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Firebase", "Kubernetes", "Azure", "GCP", "CI/CD", "Jenkins", "Machine Learning", "AI", "Data Science", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Agile", "Scrum", "Communication", "Leadership", "Problem Solving", "Teamwork", "Management", "Sales", "Marketing", "SEO", "Content", "Writing", "Editing", "Design", "Figma", "Sketch", "Photoshop", "Finance", "Accounting", "HR", "Recruiting", "Legal", "Compliance"];
    const foundSkills = skillDictionary.filter(skill => {
        const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escapedSkill}\\b`, 'i').test(text);
    });
    const experienceMatch = text.match(/(?:Experience|Work History|Employment)([\s\S]*?)(?:Education|Skills|Projects|Reference|$)/i);
    const educationMatch = text.match(/(?:Education|Academic)([\s\S]*?)(?:Experience|Skills|Projects|Reference|$)/i);
    return {
        email: emails[0] || "Not Found",
        phone: phones[0] || "Not Found",
        skills: [...new Set(foundSkills)],
        workSnippet: experienceMatch ? experienceMatch[1].trim() : "No detailed work history found.",
        educationSnippet: educationMatch ? educationMatch[1].trim() : "No detailed education found."
    };
};

// --- SEED DEMO USER ---
async function seedDemoUser() {
    try {
        const existing = await db.findUserByEmail('demo@example.com');
        if (!existing) {
            const hashedPassword = bcrypt.hashSync('password', 8);
            await db.createUser({ name: 'Demo User', email: 'demo@example.com', password: hashedPassword, role: 'user' });
            console.log('✅  Demo user seeded: demo@example.com / password');
        } else {
            console.log('ℹ️   Demo user already exists');
        }
    } catch (e) {
        console.warn('⚠️  Could not seed demo user:', e.message);
    }
}

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;

    try {
        const existingUser = await db.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = bcrypt.hashSync(password, 8);
        const newUser = await db.createUser({
            name,
            email,
            password: hashedPassword,
            role: 'user'
        });

        const token = jwt.sign({ id: newUser.id }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
    } catch (e) {
        console.error("Register Error", e);
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Only return if exact match found
        // For array return from findUserByEmail, handle it (supabase returns single usually)
        let user = await db.findUserByEmail(email);

        // Supabase returns { data, error } inside findUserByEmail for local/remote abstraction?
        // Wait, my abstraction returns the user OBJECT or null/undefined.
        if (user && user.data) user = user.data; // Handle supabase response structure if leaked

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        let isMatch = false;
        if (user.password === password) isMatch = true; // Plaintext fallback
        else if (user.password.startsWith('$2a$') && bcrypt.compareSync(password, user.password)) isMatch = true;

        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (e) {
        console.error("Login Error", e);
        res.status(500).json({ error: "Login failed" });
    }
});


// --- JOB ROUTES ---
app.get('/api/jobs/search', async (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    try {
        const results = await db.searchJobs(query);
        res.json(results || []);
    } catch (e) {
        console.error("Job Search Error", e);
        res.status(500).json({ error: "Search failed" });
    }
});


// --- USER ROUTES ---
app.get('/api/user/profile', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        // Fetch User
        let user = await db.getUserById(decoded.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Fetch Resumes
        const userResumes = await db.getUserResumes(user.id); // Returns array

        res.json({
            user: { id: user.id, name: user.name, email: user.email },
            resumes: userResumes
        });
    } catch (e) {
        console.error("Profile Error", e);
        res.status(401).json({ error: "Invalid Token" });
    }
});

app.get('/api/user/saved-jobs', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const savedJobs = await db.getUserSavedJobs(decoded.id);
        res.json(savedJobs);
    } catch (e) {
        console.error("Saved Jobs Error", e);
        res.status(401).json({ error: "Invalid Token" });
    }
});

// --- ANALYZE ROUTE ---
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const userId = req.body.userId ? parseInt(req.body.userId) : null;
        const roleTarget = req.body.role || 'General';

        let extractedData = {
            email: "Not Found", phone: "Not Found", skills: [],
            workSnippet: "", educationSnippet: ""
        };

        try {
            const dataBuffer = fs.readFileSync(req.file.path);
            const pdfData = await pdfParse(dataBuffer);
            if (pdfData && pdfData.text) {
                extractedData = extractResumeData(pdfData.text);
            }
        } catch (parseError) {
            console.error("PDF Parsing Error:", parseError);
        }

        // Fetch Jobs for matching
        const allJobs = await db.getAllJobs();
        const jobMatches = allJobs.map(job => {
            const requiredSkills = job.requiredSkills || [];
            const matchedSkills = requiredSkills.filter(reqSkill =>
                extractedData.skills.some(userSkill => userSkill.toLowerCase() === reqSkill.toLowerCase())
            );

            // Calculate Missing Skills
            const missingSkills = requiredSkills.filter(reqSkill =>
                !extractedData.skills.some(userSkill => userSkill.toLowerCase() === reqSkill.toLowerCase())
            );

            let skillScore = requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) * 100 : 50;
            let titleBoost = job.title.toLowerCase().includes(roleTarget.toLowerCase()) ? 20 : 0;
            let finalScore = Math.min(99, Math.round(skillScore + titleBoost));

            if (extractedData.skills.length === 0) finalScore = 40;

            return {
                ...job,
                matchScore: finalScore,
                missingSkills: missingSkills.slice(0, 5), // Only show top 5 gaps
                scoreClass: finalScore > 90 ? 'high' : finalScore > 70 ? 'medium' : 'good'
            };
        }).sort((a, b) => b.matchScore - a.matchScore);

        // --- Production Persistence (Supabase Storage) ---
        let fileUrl = `/uploads/${req.file.filename}`;
        if (!db.useLocal && db.supabase) {
            try {
                const fileContent = fs.readFileSync(req.file.path);
                const { data: uploadData, error: uploadError } = await db.supabase.storage
                    .from('resumes')
                    .upload(`user_${userId || 'guest'}/${Date.now()}-${req.file.originalname}`, fileContent, {
                        contentType: 'application/pdf',
                        upsert: true
                    });

                if (uploadData) {
                    const { data: publicUrlData } = db.supabase.storage
                        .from('resumes')
                        .getPublicUrl(uploadData.path);
                    fileUrl = publicUrlData.publicUrl;
                }
            } catch (storageErr) {
                console.warn("⚠️ Supabase Storage Upload failed, falling back to local path:", storageErr.message);
            }
        }

        if (userId) {
            await db.saveResume({
                userId,
                fileName: req.file.originalname,
                fileUrl: fileUrl,
                roleTarget,
                uploadDate: new Date().toISOString(),
                extracted: extractedData,
                matches: jobMatches.slice(0, 5)
            });
        }

        res.json({
            success: true,
            analysis: {
                hardSkills: extractedData.skills.slice(0, 8),
                softSkills: ["Communication", "Adaptability", "Teamwork"],
                experienceSummary: extractedData.workSnippet ? extractedData.workSnippet.substring(0, 150) + "..." : "No detailed experience found.",
                educationSummary: extractedData.educationSnippet ? extractedData.educationSnippet.substring(0, 150) + "..." : "No detailed education found.",
                contact: { email: extractedData.email, phone: extractedData.phone }
            },
            matches: jobMatches.slice(0, 5)
        });

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: "Failed to analyze resume." });
    }
});

app.post('/api/jobs/save', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const { job } = req.body;
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        await db.saveJob(decoded.id, job);
        res.json({ success: true });
    } catch (e) {
        console.error("Save Job Error", e);
        res.status(500).json({ error: "Failed to save job" });
    }
});

app.get('/api/user/saved-jobs', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const savedJobs = await db.getUserSavedJobs(decoded.id);
        res.json(savedJobs);
    } catch (e) {
        res.status(501).json({ error: "Failed to fetch saved jobs" });
    }
});

// Initialize DB then start server
async function start() {
    await db.init();
    app.listen(PORT, async () => {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        if (db.useLocal) console.log("📂 Using Local database.json");
        else console.log("🔥 Using Supabase Cloud Database");
        await seedDemoUser();
    });
}
start();

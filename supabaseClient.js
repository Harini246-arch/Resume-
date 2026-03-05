const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase = null;
let useLocal = true;

const DB_FILE = path.join(__dirname, 'database.json');

// Helper to read/write local JSON
const readLocalDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], resumes: [], jobs: [] }));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
};
const writeLocalDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4));

const db = {
    get useLocal() { return useLocal; },
    get supabase() { return supabase; },

    // --- USERS ---
    async findUserByEmail(email) {
        if (useLocal) {
            return readLocalDB().users.find(u => u.email === email);
        }
        const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
        if (error && error.code !== 'PGRST116') console.error("Supabase findUserByEmail Error:", error.message);
        return data;
    },

    async getUserById(id) {
        if (useLocal) {
            return readLocalDB().users.find(u => u.id == id);
        }
        const { data } = await supabase.from('users').select('*').eq('id', id).single();
        return data;
    },

    async createUser(userData) {
        if (useLocal) {
            const db = readLocalDB();
            const newUser = { ...userData, id: Date.now() };
            db.users.push(newUser);
            writeLocalDB(db);
            return newUser;
        }
        const { data, error } = await supabase.from('users').insert([userData]).select();
        if (error) throw error;
        return data[0];
    },

    // --- JOBS ---
    async searchJobs(query) {
        if (useLocal) {
            const data = readLocalDB();
            if (!query) return data.jobs;
            const q = query.toLowerCase();
            return data.jobs.filter(job =>
                job.title.toLowerCase().includes(q) ||
                (job.company || '').toLowerCase().includes(q) ||
                (job.requiredSkills || []).some(s => s.toLowerCase().includes(q))
            );
        }
        let q = supabase.from('jobs').select('*');
        if (query) q = q.ilike('title', `%${query}%`);
        const { data } = await q;
        return data || [];
    },

    async getAllJobs() {
        if (useLocal) return readLocalDB().jobs;
        const { data } = await supabase.from('jobs').select('*');
        return data || [];
    },

    // --- RESUMES ---
    async saveResume(resumeData) {
        if (useLocal) {
            const data = readLocalDB();
            const newResume = { ...resumeData, id: Date.now() };
            data.resumes.push(newResume);
            writeLocalDB(data);
            return newResume;
        }
        const dbResume = {
            user_id: resumeData.userId,
            file_name: resumeData.fileName,
            role_target: resumeData.roleTarget,
            extracted_data: resumeData.extracted,
            matches: resumeData.matches
        };
        const { data, error } = await supabase.from('resumes').insert([dbResume]).select();
        if (error) console.error("Supabase Resume Save Error:", error);
        return data ? data[0] : null;
    },

    async getUserResumes(userId) {
        if (useLocal) {
            const data = readLocalDB();
            return data.resumes
                .filter(r => r.userId == userId)
                .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        }
        const { data } = await supabase.from('resumes').select('*').eq('user_id', userId).order('upload_date', { ascending: false });
        return (data || []).map(r => ({
            id: r.id, userId: r.user_id, fileName: r.file_name,
            roleTarget: r.role_target, uploadDate: r.upload_date || r.created_at,
            extracted: r.extracted_data, matches: r.matches
        }));
    },

    // --- SAVED JOBS ---
    async saveJob(userId, job) {
        if (useLocal) {
            const data = readLocalDB();
            if (!data.savedJobs) data.savedJobs = [];
            data.savedJobs.push({ ...job, userId, id: Date.now() });
            writeLocalDB(data);
            return true;
        }
        const dbSaved = { user_id: userId, job_title: job.title, company: job.company, location: job.location };
        const { error } = await supabase.from('saved_jobs').insert([dbSaved]);
        if (error) throw error;
        return true;
    },

    async getUserSavedJobs(userId) {
        if (useLocal) {
            const data = readLocalDB();
            return (data.savedJobs || []).filter(j => j.userId == userId);
        }
        const { data } = await supabase.from('saved_jobs').select('*').eq('user_id', userId);
        return (data || []).map(j => ({
            id: j.id, title: j.job_title, company: j.company,
            location: j.location, savedAt: j.saved_at
        }));
    },

    // Called once at startup to test Supabase connectivity
    async init() {
        if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http')) {
            try {
                const client = createClient(SUPABASE_URL, SUPABASE_KEY);
                const { error } = await client.from('users').select('id').limit(1);
                if (error && (error.message.includes('fetch') || error.message.includes('ENOTFOUND') || error.message.includes('network'))) {
                    throw new Error('Network unreachable: ' + error.message);
                }
                supabase = client;
                useLocal = false;
                console.log("🔥 Connected to Supabase");
            } catch (err) {
                console.warn("⚠️  Supabase unreachable — using local database.json instead:", err.message);
                useLocal = true;
            }
        } else {
            console.log("📂 No Supabase credentials — using local database.json");
        }
    }
};

module.exports = db;

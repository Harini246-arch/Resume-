# ResumeAI - Premium Resume Analyzer

A stunning, modern web application for AI-powered resume analysis with beautiful UI, smooth animations, and premium design aesthetics.

## 🎨 Features

### **4 Complete Pages:**
1. **Login Page** - Split-screen design with gradient background and social login options
2. **Upload Page** - Drag-and-drop resume upload with role selection
3. **Analysis Progress** - Real-time progress tracking with animated steps
4. **Results Dashboard** - Comprehensive analysis with job recommendations

### **Premium Design Elements:**
- ✨ Modern glassmorphism effects
- 🎨 Vibrant gradient color schemes
- 🌊 Smooth micro-animations
- 📱 Fully responsive design
- 🎯 Interactive hover effects
- 💫 Dynamic progress indicators
- 🎭 Professional dark theme

## 🚀 How to Run

### **Method 1: Local Full-Stack Server (Recommended)**
1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Setup Environment:**
   Create a `.env` file in the root directory (see `.env.example`).
3. **Start the Server:**
   ```bash
   npm start
   ```
4. **Access the App:**
   Navigate to `http://localhost:8000` in your browser.

### **Method 2: Development Mode (with Auto-Reload)**
```bash
npm run dev
```

### **Method 3: VS Code Live Server**
1. Open the folder in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## 📁 Project Structure

```
resume-analyzer/
│
├── index.html          # Main HTML file with all 4 pages
├── styles.css          # Premium CSS with modern design system
├── script.js           # Interactive JavaScript functionality
└── README.md           # This file
```

## 🎯 User Flow

1. **Login** → Enter credentials or use social login
2. **Upload** → Select target role and upload resume (PDF)
3. **Analysis** → Watch real-time AI processing with progress steps
4. **Results** → View extracted skills, experience, and job matches

## 🎨 Design Highlights

### **Color Palette:**
- Primary: Indigo (#4F46E5) to Purple (#7C3AED) gradients
- Success: Emerald (#10B981)
- Warning: Amber (#F59E0B)
- Dark Theme: Custom gray scale (950-50)

### **Typography:**
- Font: Inter (Google Fonts)
- Weights: 300-800
- Optimized for readability

### **Animations:**
- Page transitions with fade effects
- Progress bar shimmer animation
- Floating logo animation
- Card hover transformations
- Smooth scroll reveals
- Loading state animations

## 💡 Interactive Features

- **Drag & Drop** file upload
- **Social Login** buttons (Google, LinkedIn)
- **Role Selection** with quick chips
- **Password Toggle** visibility
- **Real-time Progress** tracking
- **Animated Steps** completion
- **Job Match Scores** with color coding
- **Skill Tags** with hover effects
- **Export PDF** functionality
- **Notification System** for user feedback

## 🔧 Technical Details

### **Technologies Used:**
- Pure HTML5 (Semantic markup)
- Vanilla CSS3 (No frameworks)
- Vanilla JavaScript (ES6+)
- Google Fonts (Inter)
- SVG Icons (Custom designed)

### **Browser Compatibility:**
- Chrome/Edge (Recommended)
- Firefox
- Safari
- Opera

### **Performance:**
- No external dependencies
- Optimized animations
- Lazy loading effects
- Smooth 60fps transitions

## 📱 Responsive Breakpoints

- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px

## 🎭 Page Details

### **1. Login Page**
- Split-screen layout
- Animated gradient background
- Social login (Google, LinkedIn)
- Email/password form
- Remember me checkbox
- Forgot password link
- Floating particles effect

### **2. Upload Page**
- Target role dropdown
- Quick role selection chips
- Drag-and-drop zone
- File browser button
- File preview with remove option
- Disabled state for analyze button
- Terms of service agreement

### **3. Analysis Progress**
- Animated progress bar (0-100%)
- 4 step indicators:
  - Scanning PDF content
  - Identifying Skills
  - Parsing Work History
  - Matching with Roles
- Real-time status updates
- Estimated time indicator
- Smooth transitions

### **4. Results Dashboard**
- Sidebar navigation
- User profile card
- Extracted skills (hard & soft)
- Work experience timeline
- Education details
- Job recommendations with match scores
- Export to PDF option
- Search functionality

## 🎨 Customization

### **Change Colors:**
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-600: #4F46E5;  /* Change primary color */
    --purple-600: #7C3AED;   /* Change accent color */
    /* ... more variables */
}
```

### **Modify Content:**
- Edit text directly in `index.html`
- Update profile information in the results section
- Add more job cards or skills as needed

### **Adjust Animations:**
- Timing: Edit `--transition-*` variables
- Duration: Modify animation durations in `script.js`
- Effects: Customize keyframes in `styles.css`

## 🐛 Troubleshooting

**Issue: Styles not loading**
- Ensure all files are in the same directory
- Check browser console for errors
- Clear browser cache

**Issue: Animations not smooth**
- Update to latest browser version
- Check hardware acceleration is enabled
- Reduce animation complexity if needed

**Issue: File upload not working**
- Only PDF files are accepted
- Maximum file size: 5MB
- Check browser file API support

## 📄 License

This is a demonstration project. Feel free to use and modify as needed.

## 👨‍💻 Credits

Built with ❤️ using modern web technologies
- Design inspiration: Modern SaaS applications
- Icons: Custom SVG designs
- Fonts: Google Fonts (Inter)

## 🚀 Future Enhancements

- Backend integration for real AI analysis
- User authentication system
- Database for storing resumes
- Email notifications
- PDF generation
- Job application tracking
- Cover letter generator
- Interview preparation tips

---

**Enjoy your premium Resume Analyzer! 🎉**

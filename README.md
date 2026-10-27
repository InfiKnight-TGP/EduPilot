# 🎓 EduPilot AI — Intelligent Student Success Platform

EduPilot AI is a modern, responsive web application and student success platform built with Flask, HTML5 semantic components, CSS3 design systems, and vanilla JavaScript. It empowers students with academic tracking, GPA forecasting, timetable optimization, assignment scheduling, wellness tracking, campus event discovery, and an intelligent campus assistant.

---

## 👤 Student Profile & Attribution

- **Student Name:** Dinesh Raj N
- **Registration Number:** `23MIC0051`
- **Program:** Integrated M.Tech Computer Science & Engineering
- **Current Semester:** 7<sup>th</sup> Semester
- **Institution:** VIT University

---

## 🌟 Key Features

- **📊 Central Academic Dashboard (`/`):** Real-time CGPA tracking (8.6), attendance summaries, degree completion milestones, and predictive workload digital twin simulations.
- **📈 Academic Performance & Forecaster (`/academics`):** Detailed semester grade breakdown with `colspan`/`rowspan` tables, and an interactive study-hour GPA prediction tool.
- **🗓️ Clash-Free Timetable Matrix (`/timetable`):** Weekly schedule grid showing 2-hour lab blocks and synchronized campus activities.
- **📝 Priority Assignment Planner (`/assignments`):** Deadline tracking categorized by urgency (urgent, upcoming, and completed).
- **✅ Attendance Forecast Engine (`/attendance`):** Course-by-course attendance status with smart threshold buffer calculation and leave simulation.
- **🚀 Career Roadmap & Skills Navigator (`/career`):** ML and Data Science career path recommendations, skill gap analysis, and placement trends.
- **🧘 Wellness & Focus Sanctuary (`/wellness`):** Burnout risk monitoring, mood logging, sleep tracking, Pomodoro focus guidelines, and guided breathing exercises.
- **🎪 Campus Events Hub (`/events`):** Interactive event discovery with category filters, live venue occupancy indicator, event gallery carousel, HTML5 audio chime, and official campus promo video (`promo.mp4`).
- **📋 Event Registration Portal (`/register`):** Responsive form with live regex validation (e.g. `23MIC0051`), instant error handling, and server-side submission.
- **💬 AI Campus Assistant (`/chat`):** Instant intelligent responses for exam schedules, hostel timings, attendance queries, fee alerts, and career advice.
- **🎨 Custom Favicon Suite & Theme Toggle:** Handcrafted vector SVG icon, multi-resolution ICO/PNGs, and one-click Dark/Light theme switching.
- **⚡ Quick Command Palette:** Accessible jump menu activated via `Jump to /` button or keyboard shortcut.

---

## 🛠️ Tech Stack

- **Backend:** Python 3.14+ · Flask
- **Frontend:** Semantic HTML5 · Vanilla CSS (Custom Design System with CSS Variables) · Vanilla JavaScript (ES6+)
- **Media & Assets:** HTML5 Audio & Video (`promo.mp4`), Scalable Vector Graphics (SVG), WebP / JPEG
- **Data & APIs:** RESTful JSON APIs with client-side `fetch()` integration

---

## 📂 Project Structure

```text
EduPilot/
├── app.py                     # Flask application, routing, and REST API endpoints
├── base.html                  # Shared layout template (Navbar, Sidebar, Footer, Favicons)
├── dashboard.html             # Main student dashboard & digital twin simulation
├── academics.html             # Academic grades ledger & interactive GPA predictor
├── timetable.html             # Weekly class & lab timetable matrix
├── assignments.html           # Course assignment tracker
├── attendance.html            # Attendance forecast & threshold calculator
├── career.html                # Career roadmap & skill gap analyzer
├── wellness.html              # Mental wellness, study tips & focus audio/video
├── events.html                # Campus events showcase, carousel, & promo video
├── register.html              # Interactive event registration form
├── chat.html                  # AI assistant conversation interface
├── lab.css                    # Root stylesheet reference
├── script.js                  # Root client script reference
├── static/
│   ├── css/
│   │   ├── lab.css            # Component design system, tokens, and dark/light modes
│   │   └── style.css          # Core stylesheet
│   ├── js/
│   │   └── script.js          # Interactive UI behaviors, API client, & form validation
│   ├── media/
│   │   ├── promo.mp4          # Campus promo video
│   │   ├── promo-poster.jpg   # High-resolution video poster thumbnail
│   │   ├── breathing_exercise.mp4
│   │   └── focus_ambient.wav
│   ├── images/                # Wellness & UI assets
│   ├── favicon.svg            # Scalable vector favicon
│   ├── favicon.ico            # Multi-size Windows / browser icon (16, 32, 48)
│   ├── favicon.png            # High-resolution PNG icon
│   └── favicon-32.png         # Standard 32x32 PNG icon
├── requirements.txt           # Python dependencies
└── README.md                  # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure Python 3.10+ (Python 3.14 recommended) is installed on your machine.

### 2. Install Dependencies
Clone the repository and install the required dependencies:

```powershell
pip install -r requirements.txt
```

### 3. Run the Application
Start the local Flask development server:

```powershell
python app.py
```

### 4. Open in Browser
Navigate to:
```text
http://127.0.0.1:5000
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | AI campus assistant query responder |
| `POST` | `/api/gpa-predict` | Predicts semester CGPA based on weekly study hours |
| `POST` | `/api/attendance-forecast` | Calculates projected attendance based on future missed classes |
| `POST` | `/api/register` | Processes and validates student campus event registration |

---

## 📄 License & Attribution

Developed by **Dinesh Raj N** (23MIC0051) for the **EduPilot AI** platform.  
© 2026 EduPilot AI. All rights reserved.

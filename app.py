from flask import Flask, render_template, request, jsonify, session
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
app = Flask(__name__, template_folder=str(BASE_DIR))
app.secret_key = "edupilot-secret-2024"

# ─── Sample Data ───────────────────────────────────────────────────────────────

STUDENT = {
    "name": "Arjun Sharma",
    "id": "21BCE0456",
    "branch": "B.Tech CSE (AI & ML)",
    "semester": 6,
    "cgpa": 8.3,
    "attendance": 84,
    "credits_completed": 112,
    "credits_total": 160,
}

COURSES = [
    {"code": "CSE3001", "name": "Data Structures & Algorithms", "faculty": "Dr. Priya Nair", "rating": 4.7, "attendance": 88, "grade": "A", "marks": 87},
    {"code": "CSE3002", "name": "Machine Learning", "faculty": "Dr. Rajesh Kumar", "rating": 4.5, "attendance": 92, "grade": "A+", "marks": 93},
    {"code": "CSE3003", "name": "Advanced Python", "faculty": "Prof. Meena Iyer", "rating": 4.2, "attendance": 78, "grade": "B+", "marks": 74},
    {"code": "CSE3004", "name": "Database Systems", "faculty": "Dr. Suresh Babu", "rating": 4.8, "attendance": 95, "grade": "A+", "marks": 96},
    {"code": "MAT3001", "name": "Probability & Statistics", "faculty": "Dr. Anjali Singh", "rating": 3.9, "attendance": 81, "grade": "B+", "marks": 76},
    {"code": "HUM3001", "name": "Engineering Ethics", "faculty": "Prof. Ravi Menon", "rating": 4.1, "attendance": 75, "grade": "A", "marks": 82},
]

ASSIGNMENTS = [
    {"title": "ML Model Implementation", "course": "Machine Learning", "due_days": 3, "status": "in_progress", "priority": "high"},
    {"title": "DSA Assignment 4", "course": "Data Structures", "due_days": 7, "status": "not_started", "priority": "medium"},
    {"title": "Database ER Diagram", "course": "Database Systems", "due_days": 1, "status": "in_progress", "priority": "urgent"},
    {"title": "Statistics Problem Set", "course": "Probability & Statistics", "due_days": 12, "status": "not_started", "priority": "low"},
    {"title": "Python Flask Project", "course": "Advanced Python", "due_days": 5, "status": "in_progress", "priority": "high"},
]

CAREER_PATH = [
    {"role": "Student", "status": "current", "skills": ["Python", "ML Basics", "SQL"]},
    {"role": "Data Analyst Intern", "status": "next", "skills": ["Pandas", "Tableau", "Statistics"]},
    {"role": "ML Engineer", "status": "future", "skills": ["TensorFlow", "PyTorch", "MLOps"]},
    {"role": "AI Engineer", "status": "future", "skills": ["LLMs", "Transformers", "RAG"]},
    {"role": "AI Architect", "status": "goal", "skills": ["System Design", "Cloud AI", "Leadership"]},
]

TIMETABLE = {
    "Monday":    ["DSA 8-9", "—", "ML 11-12", "DB 1-2", "—", "Python 4-5"],
    "Tuesday":   ["—", "Stats 9-10", "—", "ML 1-2", "Ethics 3-4", "—"],
    "Wednesday": ["DSA 8-9", "—", "Python 11-12", "—", "DB 3-4", "—"],
    "Thursday":  ["—", "ML 9-10", "Stats 11-12", "—", "DSA 3-4", "—"],
    "Friday":    ["Python 8-9", "DB 9-10", "—", "Ethics 1-2", "—", "—"],
}

WELLNESS = {
    "stress_level": 65,
    "sleep_hours": 6.2,
    "study_hours_week": 28,
    "burnout_risk": "Medium",
    "mood_trend": "Declining",
    "streak_days": 12,
}


# ─── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def dashboard():
    return render_template("dashboard.html", student=STUDENT, courses=COURSES,
                           assignments=ASSIGNMENTS, wellness=WELLNESS)

@app.route("/academics")
def academics():
    return render_template("academics.html", student=STUDENT, courses=COURSES)

@app.route("/timetable")
def timetable():
    return render_template("timetable.html", student=STUDENT, timetable=TIMETABLE)

@app.route("/assignments")
def assignments():
    return render_template("assignments.html", student=STUDENT, assignments=ASSIGNMENTS)

@app.route("/career")
def career():
    skill_gaps = [
        {"skill": "PyTorch", "importance": 90, "current": 20},
        {"skill": "MLOps", "importance": 85, "current": 10},
        {"skill": "Tableau", "importance": 75, "current": 35},
        {"skill": "System Design", "importance": 80, "current": 25},
        {"skill": "Cloud (AWS/GCP)", "importance": 88, "current": 15},
    ]
    return render_template("career.html", student=STUDENT, career_path=CAREER_PATH, skill_gaps=skill_gaps)

@app.route("/wellness")
def wellness():
    mood_data = [7, 6, 8, 5, 4, 6, 5]
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return render_template("wellness.html", student=STUDENT, wellness=WELLNESS,
                           mood_data=zip(days, mood_data))

@app.route("/attendance")
def attendance():
    attendance_data = []
    for c in COURSES:
        total = random.randint(30, 45)
        attended = int(total * c["attendance"] / 100)
        safe_to_miss = max(0, int(attended - 0.75 * total))
        attendance_data.append({**c, "total": total, "attended": attended, "safe_to_miss": safe_to_miss})
    return render_template("attendance.html", student=STUDENT, attendance_data=attendance_data)

@app.route("/chat")
def chat():
    return render_template("chat.html", student=STUDENT)


# ─── API Endpoints ─────────────────────────────────────────────────────────────

@app.route("/api/chat", methods=["POST"])
def api_chat():
    data = request.json
    user_msg = data.get("message", "").lower()

    # Rule-based campus assistant
    if any(w in user_msg for w in ["exam", "schedule", "date"]):
        reply = "📅 **Upcoming Exams:**\n\n• DSA — June 20 (Hall A-101)\n• ML — June 23 (Hall B-204)\n• Database — June 27 (Hall A-102)\n\nMake sure to carry your hall ticket and ID!"
    elif any(w in user_msg for w in ["attendance", "bunk", "miss", "leave"]):
        reply = "📊 Your current attendance is **84%**. You can safely miss **8 more classes** before dropping below the 75% threshold. Advanced Python is your most critical course at 78%."
    elif any(w in user_msg for w in ["cgpa", "gpa", "grade", "marks"]):
        reply = "📈 Your current CGPA is **8.3**. Based on your current performance, you have a **78% probability** of achieving 8.5+ this semester. Focusing 3 extra hours on Advanced Python weekly could push that to 89%."
    elif any(w in user_msg for w in ["fee", "payment", "due"]):
        reply = "💰 **Fee Details:**\n\n• Semester fee: ₹1,25,000\n• Due date: July 15, 2025\n• Payment portal: payments.vit.ac.in\n\nEarly payment discount of 2% available before June 30!"
    elif any(w in user_msg for w in ["hostel", "room", "mess"]):
        reply = "🏠 **Hostel Info:**\n\n• Mess timing: 7-9AM, 12-2PM, 7-9PM\n• Gate closing: 10:30 PM\n• Warden contact: +91-98765-43210\n• Complaints: hostel.grievance@vit.ac.in"
    elif any(w in user_msg for w in ["stress", "tired", "burnout", "mental"]):
        reply = "🧘 I notice you might be under stress. Your burnout risk is currently **Medium**. I recommend:\n\n1. Take a 20-min break every 2 hours\n2. Sleep at least 7 hours tonight\n3. Try the Pomodoro technique\n\nWould you like me to schedule a lighter study plan for today?"
    elif any(w in user_msg for w in ["career", "job", "internship", "placement"]):
        reply = "🚀 **Career Insight:**\n\nBased on your ML and Python skills, you're well-positioned for **Data Science / ML Engineering** roles. Top companies hiring from VIT: Google, Amazon, Microsoft, Flipkart.\n\nTop skill gap to fill: **PyTorch** — try the fast.ai course!"
    elif any(w in user_msg for w in ["assignment", "deadline", "submit"]):
        reply = "📝 **Urgent Assignments:**\n\n🔴 Database ER Diagram — Due **tomorrow**\n🟠 ML Model Implementation — Due in 3 days\n🟡 Python Flask Project — Due in 5 days\n\nWant me to create a day-by-day plan for any of these?"
    elif any(w in user_msg for w in ["hello", "hi", "hey"]):
        reply = f"👋 Hello Arjun! I'm your EduPilot AI assistant. I can help you with exam schedules, attendance, fees, assignments, career guidance, and more. What do you need today?"
    else:
        reply = "🤖 I can help you with:\n\n• **Exams** — schedules, halls, dates\n• **Attendance** — safe leaves, predictions\n• **Fees** — due dates, payments\n• **Hostel** — rules, mess timings\n• **Career** — roadmaps, internships\n• **Assignments** — deadlines, planning\n• **Wellness** — stress, burnout tips\n\nJust ask me anything!"

    return jsonify({"reply": reply})

@app.route("/api/gpa-predict", methods=["POST"])
def gpa_predict():
    data = request.json
    extra_hours = data.get("extra_hours", 0)
    base_prob = 78
    boosted_prob = min(97, base_prob + extra_hours * 2.2)
    predicted_cgpa = round(min(10.0, STUDENT["cgpa"] + (extra_hours * 0.05)), 2)
    return jsonify({
        "base_probability": base_prob,
        "boosted_probability": round(boosted_prob, 1),
        "predicted_cgpa": predicted_cgpa,
        "recommendation": f"Spending {extra_hours} extra hours weekly on weak subjects can significantly boost your GPA!"
    })

@app.route("/api/attendance-forecast", methods=["POST"])
def attendance_forecast():
    data = request.json
    course_code = data.get("course_code", "CSE3001")
    course = next((c for c in COURSES if c["code"] == course_code), COURSES[0])
    total = 40
    attended = int(total * course["attendance"] / 100)
    safe = max(0, int(attended - 0.75 * total))
    return jsonify({
        "course": course["name"],
        "current_attendance": course["attendance"],
        "attended": attended,
        "total": total,
        "safe_to_miss": safe,
        "status": "safe" if course["attendance"] > 85 else "warning" if course["attendance"] > 75 else "critical"
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)

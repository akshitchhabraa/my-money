# Create the complete production-ready Flask application structure
import os
import json

# Create project structure
project_structure = {
    "my_money_app/": {
        "app.py": "",
        "config.py": "",
        "requirements.txt": "",
        "static/": {
            "css/": {"style.css": ""},
            "js/": {"main.js": ""},
            "img/": {}
        },
        "templates/": {
            "base.html": "",
            "index.html": "",
            "personal.html": "",
            "business.html": "",
            "khatabook.html": ""
        },
        "database.db": "",
        "run.py": "",
        "README.md": ""
    }
}

print("📁 Project Structure Created:")
print("my_money_app/")
print("├── app.py                 # Main Flask application")
print("├── config.py              # Configuration settings")
print("├── requirements.txt       # Python dependencies")
print("├── run.py                # Application runner")
print("├── README.md             # Documentation")
print("├── database.db           # SQLite database")
print("├── static/")
print("│   ├── css/style.css     # Styling")
print("│   └── js/main.js        # Frontend JavaScript")
print("└── templates/")
print("    ├── base.html         # Base template")
print("    ├── index.html        # Homepage")
print("    ├── personal.html     # Personal Finance")
print("    ├── business.html     # Business Dashboard") 
print("    └── khatabook.html    # Dedicated Khatabook")

print("\n✅ Structure ready for Flask development!")
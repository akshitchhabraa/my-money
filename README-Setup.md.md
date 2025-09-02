# My Money Flask Application - Setup Instructions

## 🚀 Quick Start Guide

### Step 1: Create Project Folder
```bash
mkdir my_money_app
cd my_money_app
```

### Step 2: Download Files
Download and save these files in your project folder:
- `app.py` (main Flask application)
- `requirements.txt` (Python dependencies)
- `run.py` (application runner)

### Step 3: Create Folder Structure
Create these folders in your project directory:
```
my_money_app/
├── static/
│   ├── css/
│   └── js/
└── templates/
```

### Step 4: Install Python Dependencies
```bash
# Install Flask and dependencies
pip install -r requirements.txt
```

### Step 5: Create Templates Folder
Create a `templates` folder and add these template files:
- `base.html` (base template)
- `index.html` (homepage)
- `personal.html` (personal finance)
- `business.html` (business dashboard)
- `khatabook.html` (khatabook service)

### Step 6: Add Static Files
1. Copy the generated `style.css` to `static/css/`
2. Copy the generated `app.js` to `static/js/main.js`

### Step 7: Run the Application
```bash
python run.py
```

### Step 8: Open in Browser
Go to: http://localhost:5000

## 🎯 Application Features

### ✅ Working Features:
- **Zero Default Values**: Everything starts at ₹0.00
- **Fully Editable Amounts**: Click and edit any number field
- **Real-time Updates**: Changes reflect instantly
- **Personal Finance**: Track income and expenses
- **Business Dashboard**: Manage business finances
- **Khatabook Service**: Customer ledger management
- **API Integration**: RESTful Flask backend

### 📱 Key Sections:
1. **Personal Finance**: Track personal transactions
2. **Business Dashboard**: Business overview and KPIs
3. **Khatabook Service**: Customer credit/payment management
4. **Invoice Management**: Create and track invoices
5. **Tax Center**: GST calculations and reports

## 🔧 Database

The application uses SQLite database with these tables:
- `transactions`: Personal finance transactions
- `customers`: Customer information
- `customer_transactions`: Khatabook transactions

Database file: `database.db` (created automatically)

## 🌐 API Endpoints

- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Add new transaction
- `PUT /api/transactions/<id>` - Update transaction
- `DELETE /api/transactions/<id>` - Delete transaction
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Add new customer
- `POST /api/customers/<id>/transactions` - Add customer transaction
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🚀 Production Deployment

### For Heroku:
1. Create `Procfile`: `web: python run.py`
2. Add `gunicorn` to requirements.txt
3. Deploy to Heroku

### For Railway/Render:
1. Push code to GitHub
2. Connect GitHub repo to Railway/Render
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python run.py`

## 💡 Development Tips

- Use `debug=True` for development
- Change `SECRET_KEY` for production
- Add environment variables for database URL
- Use proper logging in production
- Add data validation and error handling

## 🆘 Troubleshooting

**Error: Module not found**
```bash
pip install flask
```

**Database error**
- Delete `database.db` file
- Restart application (database recreates automatically)

**Port already in use**
- Change port in `run.py`: `app.run(port=5001)`

**Template not found**
- Check templates folder exists
- Check template files are in correct location

## 📝 Next Steps

1. ✅ Get basic app running
2. ✅ Test all features work
3. Add authentication (login/signup)
4. Add data export features
5. Deploy to production server
6. Add email notifications
7. Create mobile app version

## 🎓 Learning Resources

- Flask Documentation: https://flask.palletsprojects.com/
- SQLite Tutorial: https://www.sqlitetutorial.net/
- JavaScript Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

---
**Ready to launch your financial management platform! 🚀**
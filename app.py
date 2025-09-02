# Updated Flask App with AI-Powered Transaction Categorization - COMPLETE

from flask import Flask, render_template, request, jsonify, redirect, url_for
import sqlite3
import json
from datetime import datetime, date, timedelta
import os
from collections import defaultdict
import calendar
import random
import re

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'

# AI Transaction Categorizer Class
class TransactionCategorizer:
    def __init__(self):
        # Rule-based categorization patterns
        self.category_patterns = {
            'Food & Dining': [
                r'restaurant|food|dining|cafe|pizza|burger|coffee|lunch|dinner|breakfast|meal|zomato|swiggy|dominos|mcdonalds|kfc|subway|starbucks',
                r'grocery|supermarket|mart|store|market|vegetables|fruits|milk|bread|rice|dal|oil'
            ],
            'Transportation': [
                r'uber|ola|taxi|cab|bus|metro|train|petrol|diesel|fuel|gas|parking|toll|auto|rickshaw|transport',
                r'bike|car|vehicle|maintenance|service|repair|insurance|emi'
            ],
            'Shopping': [
                r'amazon|flipkart|myntra|shopping|mall|clothes|dress|shoes|electronics|mobile|laptop|book|gift',
                r'online|purchase|buy|order|delivery|store|retail|fashion|beauty|cosmetics'
            ],
            'Bills & Utilities': [
                r'electricity|electric|power|water|gas|internet|wifi|broadband|phone|mobile|recharge|bill|utility',
                r'rent|maintenance|society|housing|apartment|flat|home|mortgage'
            ],
            'Health & Medical': [
                r'doctor|hospital|medical|medicine|pharmacy|health|dental|clinic|checkup|treatment|surgery',
                r'insurance|mediclaim|apollo|fortis|max|care|wellness'
            ],
            'Entertainment': [
                r'movie|cinema|theater|netflix|amazon prime|spotify|game|gaming|entertainment|fun|party|club',
                r'sports|gym|fitness|membership|subscription|youtube|music'
            ],
            'Education': [
                r'school|college|university|education|course|training|book|study|tuition|fees|exam|learning',
                r'certification|degree|diploma|workshop|seminar'
            ],
            'Investment': [
                r'investment|mutual fund|sip|fd|deposit|share|stock|trading|crypto|bitcoin|portfolio|returns',
                r'bank|savings|ppf|nps|elss|bond|gold|silver'
            ],
            'Salary & Income': [
                r'salary|income|bonus|incentive|commission|freelance|payment|received|credit|earning|wages',
                r'dividend|interest|cashback|refund|reimbursement'
            ],
            'Business': [
                r'business|office|supplies|equipment|software|service|client|vendor|supplier|inventory',
                r'marketing|advertising|professional|consultant|lawyer|accountant'
            ],
            'Travel': [
                r'travel|trip|vacation|holiday|hotel|flight|train|bus|booking|tourism|airbnb|oyo',
                r'visa|passport|luggage|tour|destination|resort'
            ],
            'Personal Care': [
                r'salon|spa|haircut|grooming|personal|care|hygiene|cosmetics|skincare|beauty|parlor',
                r'massage|therapy|wellness|selfcare'
            ]
        }
        # Load user learning data
        self.user_corrections = defaultdict(dict)
        self.load_user_learning()

    def categorize_transaction(self, description, amount=None, user_id=None):
        """Auto-categorize a transaction based on description and learned patterns"""
        description_lower = description.lower()
        
        # First, check user-specific learned patterns
        if user_id and user_id in self.user_corrections:
            user_patterns = self.user_corrections[user_id]
            for pattern, category in user_patterns.items():
                if re.search(pattern, description_lower):
                    return {
                        'suggested_category': category,
                        'confidence': 0.95,
                        'source': 'user_learned'
                    }
        
        # Rule-based categorization
        category_scores = {}
        for category, patterns in self.category_patterns.items():
            score = 0
            matches = 0
            for pattern in patterns:
                if re.search(pattern, description_lower):
                    matches += 1
                    # Boost score for exact matches
                    if any(word in description_lower.split() for word in pattern.split('|')):
                        score += 2
                    else:
                        score += 1
            
            if matches > 0:
                category_scores[category] = score
        
        # Determine best category
        if category_scores:
            best_category = max(category_scores.items(), key=lambda x: x[1])
            confidence = min(0.9, best_category[1] * 0.15)  # Scale confidence
            return {
                'suggested_category': best_category[0],
                'confidence': confidence,
                'source': 'rule_based',
                'alternatives': [cat for cat, score in sorted(category_scores.items(), key=lambda x: x[1], reverse=True)[:3]]
            }
        
        # Default category for unknown transactions
        default_category = 'Other'
        if amount and amount > 0:
            default_category = 'Income' if self._is_likely_income(description_lower) else 'Other'
        
        return {
            'suggested_category': default_category,
            'confidence': 0.3,
            'source': 'default',
            'alternatives': ['Food & Dining', 'Shopping', 'Transportation']
        }

    def _is_likely_income(self, description):
        """Helper to detect if transaction is likely income"""
        income_indicators = ['salary', 'income', 'bonus', 'payment received', 'credit', 'refund', 'cashback', 'dividend']
        return any(indicator in description for indicator in income_indicators)

    def learn_from_user_correction(self, user_id, description, correct_category):
        """Learn from user's manual category corrections"""
        description_lower = description.lower()
        # Extract key words from description
        key_words = [word for word in description_lower.split() if len(word) > 3]
        pattern = '|'.join(key_words[:3])  # Use first 3 significant words
        
        if user_id not in self.user_corrections:
            self.user_corrections[user_id] = {}
        
        self.user_corrections[user_id][pattern] = correct_category
        self.save_user_learning()

    def load_user_learning(self):
        """Load user learning data from file"""
        try:
            with open('user_learning.json', 'r') as f:
                data = json.load(f)
                self.user_corrections = defaultdict(dict, data)
        except (FileNotFoundError, json.JSONDecodeError):
            pass

    def save_user_learning(self):
        """Save user learning data to file"""
        try:
            with open('user_learning.json', 'w') as f:
                json.dump(dict(self.user_corrections), f, indent=2)
        except Exception as e:
            print(f"Error saving user learning data: {e}")

    def get_spending_insights(self, transactions, user_id=None):
        """Generate AI-powered spending insights"""
        if not transactions:
            return {
                'insights': [],
                'recommendations': [],
                'category_breakdown': {}
            }
        
        # Categorize all transactions
        categorized = defaultdict(list)
        category_totals = defaultdict(float)
        
        for transaction in transactions:
            amount = float(transaction.get('amount', 0))
            if transaction.get('type') == 'expense' and amount > 0:
                result = self.categorize_transaction(
                    transaction.get('description', ''),
                    amount,
                    user_id
                )
                category = result['suggested_category']
                categorized[category].append(transaction)
                category_totals[category] += amount
        
        # Generate insights
        insights = []
        recommendations = []
        
        if category_totals:
            # Top spending category
            top_category = max(category_totals.items(), key=lambda x: x[1])
            insights.append(f"Your highest spending category is {top_category[0]} (₹{top_category[1]:,.2f})")
            
            # Spending pattern analysis
            total_expenses = sum(category_totals.values())
            for category, amount in category_totals.items():
                percentage = (amount / total_expenses) * 100
                if percentage > 40:
                    insights.append(f"⚠️ {category} accounts for {percentage:.1f}% of your spending")
                    recommendations.append(f"Consider reviewing your {category} expenses for potential savings")
                elif percentage > 25:
                    insights.append(f"📊 {category} is a major expense category ({percentage:.1f}%)")
            
            # Budget recommendations
            if 'Food & Dining' in category_totals and category_totals['Food & Dining'] > total_expenses * 0.3:
                recommendations.append("💡 Food expenses seem high. Try cooking more at home!")
            
            if 'Shopping' in category_totals and category_totals['Shopping'] > total_expenses * 0.25:
                recommendations.append("🛍️ Consider setting a monthly shopping budget to control expenses")
            
            if len([cat for cat, amt in category_totals.items() if amt > total_expenses * 0.15]) > 5:
                recommendations.append("📈 You have diverse spending. Consider consolidating similar categories")
        
        return {
            'insights': insights[:5],  # Top 5 insights
            'recommendations': recommendations[:3],  # Top 3 recommendations
            'category_breakdown': dict(category_totals)
        }

# Initialize AI Categorizer
transaction_categorizer = TransactionCategorizer()

# Database initialization
def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # Personal transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            type TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Customers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            business TEXT,
            email TEXT,
            balance REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Customer transactions (Khatabook)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customer_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            type TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    # Business invoices table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number TEXT NOT NULL UNIQUE,
            customer_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            quantity REAL NOT NULL,
            rate REAL NOT NULL,
            subtotal REAL NOT NULL,
            gst_rate REAL NOT NULL,
            gst_amount REAL NOT NULL,
            total REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            date TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Routes
@app.route('/')
def index():
    """Homepage route"""
    return render_template('index.html')

@app.route('/personal')
def personal():
    """Personal finance page"""
    return render_template('personal.html')

@app.route('/personal/analytics')
def personal_analytics():
    """Personal analytics page"""
    return render_template('personal-analytics.html')

@app.route('/business')
def business():
    """Business dashboard page"""
    return render_template('business.html')

@app.route('/business/analytics')
def business_analytics():
    """Business analytics page"""
    return render_template('business-analytics.html')

@app.route('/khatabook')
def khatabook():
    """Dedicated Khatabook service page"""
    return render_template('khatabook.html')

@app.route('/reports')
def reports():
    """Advanced Reports page"""
    return render_template('reports.html')

# AI Categorization API Routes
@app.route('/api/ai/categorize-transaction', methods=['POST'])
def categorize_transaction_api():
    """AI-powered transaction categorization endpoint"""
    try:
        data = request.get_json()
        description = data.get('description', '').strip()
        amount = data.get('amount')
        user_id = data.get('user_id', 'default')  # For demo purposes
        
        if not description:
            return jsonify({
                'success': False,
                'error': 'Description is required'
            }), 400
        
        # Get AI categorization
        result = transaction_categorizer.categorize_transaction(
            description, amount, user_id
        )
        
        return jsonify({
            'success': True,
            'suggestion': result
        })
        
    except Exception as e:
        print(f"Error in AI categorization: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to categorize transaction'
        }), 500

@app.route('/api/ai/learn-correction', methods=['POST'])
def learn_correction_api():
    """Learn from user's manual category corrections"""
    try:
        data = request.get_json()
        description = data.get('description', '').strip()
        correct_category = data.get('correct_category', '').strip()
        user_id = data.get('user_id', 'default')
        
        if not description or not correct_category:
            return jsonify({
                'success': False,
                'error': 'Description and correct category are required'
            }), 400
        
        # Learn from correction
        transaction_categorizer.learn_from_user_correction(
            user_id, description, correct_category
        )
        
        return jsonify({
            'success': True,
            'message': 'AI has learned from your correction'
        })
        
    except Exception as e:
        print(f"Error in AI learning: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to learn from correction'
        }), 500

@app.route('/api/ai/spending-insights', methods=['GET'])
def spending_insights_api():
    """Get AI-powered spending insights"""
    try:
        user_id = request.args.get('user_id', 'default')
        
        # Get user transactions
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM transactions ORDER BY date DESC')
        transactions = cursor.fetchall()
        conn.close()
        
        # Convert to dict format
        transaction_dicts = []
        for t in transactions:
            transaction_dicts.append({
                'id': t[0],
                'date': t[1],
                'amount': t[2],
                'description': t[3],
                'category': t[4],
                'type': t[5]
            })
        
        # Get insights
        insights = transaction_categorizer.get_spending_insights(
            transaction_dicts, user_id
        )
        
        return jsonify({
            'success': True,
            'insights': insights
        })
        
    except Exception as e:
        print(f"Error getting insights: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate insights'
        }), 500

# API Routes for Personal Finance
@app.route('/api/transactions', methods=['GET', 'POST'])
def transactions_api():
    """Handle personal transactions"""
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.get_json()
        cursor.execute('''
            INSERT INTO transactions (date, amount, description, category, type)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['date'], data['amount'], data['description'], 
              data['category'], data['type']))
        conn.commit()
        
        # Get the new transaction ID
        transaction_id = cursor.lastrowid
        
        # Return the created transaction
        cursor.execute('SELECT * FROM transactions WHERE id = ?', (transaction_id,))
        transaction = cursor.fetchone()
        
        conn.close()
        return jsonify({
            'success': True,
            'transaction': {
                'id': transaction[0],
                'date': transaction[1],
                'amount': transaction[2],
                'description': transaction[3],
                'category': transaction[4],
                'type': transaction[5],
                'created_at': transaction[6]
            }
        })
    
    # GET request - return all transactions
    cursor.execute('SELECT * FROM transactions ORDER BY date DESC')
    transactions = cursor.fetchall()
    
    result = []
    for t in transactions:
        result.append({
            'id': t[0],
            'date': t[1],
            'amount': t[2],
            'description': t[3],
            'category': t[4],
            'type': t[5],
            'created_at': t[6]
        })
    
    conn.close()
    return jsonify({'transactions': result})

@app.route('/api/transactions/<int:transaction_id>', methods=['PUT', 'DELETE'])
def transaction_detail(transaction_id):
    """Handle individual transaction updates/deletes"""
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    if request.method == 'PUT':
        data = request.get_json()
        cursor.execute('''
            UPDATE transactions 
            SET date=?, amount=?, description=?, category=?, type=? 
            WHERE id=?
        ''', (data['date'], data['amount'], data['description'],
              data['category'], data['type'], transaction_id))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    
    if request.method == 'DELETE':
        cursor.execute('DELETE FROM transactions WHERE id=?', (transaction_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})

# Analytics API Routes
@app.route('/api/analytics/personal')
def personal_analytics_api():
    """Get personal finance analytics data"""
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    period = request.args.get('period', '30d')
    
    # Calculate date range
    end_date = datetime.now()
    if period == '7d':
        start_date = end_date - timedelta(days=7)
    elif period == '30d':
        start_date = end_date - timedelta(days=30)
    elif period == '90d':
        start_date = end_date - timedelta(days=90)
    elif period == '1y':
        start_date = end_date - timedelta(days=365)
    else:
        start_date = end_date - timedelta(days=30)
    
    start_date_str = start_date.strftime('%Y-%m-%d')
    
    # Get transactions in period
    cursor.execute('''
        SELECT * FROM transactions 
        WHERE date >= ? 
        ORDER BY date DESC
    ''', (start_date_str,))
    
    transactions = cursor.fetchall()
    
    # Process data
    income_total = sum(t[2] for t in transactions if t[5] == 'income')
    expense_total = sum(t[2] for t in transactions if t[5] == 'expense')
    
    # Daily spending trend
    daily_spending = defaultdict(float)
    for t in transactions:
        if t[5] == 'expense':
            daily_spending[t[1]] += t[2]
    
    # Category breakdown
    category_spending = defaultdict(float)
    for t in transactions:
        if t[5] == 'expense':
            category_spending[t[4]] += t[2]
    
    # Top categories
    top_categories = sorted(category_spending.items(), key=lambda x: x[1], reverse=True)[:5]
    
    conn.close()
    
    return jsonify({
        'success': True,
        'data': {
            'income_total': income_total,
            'expense_total': expense_total,
            'balance': income_total - expense_total,
            'daily_spending': dict(daily_spending),
            'category_spending': dict(category_spending),
            'top_categories': top_categories,
            'transaction_count': len(transactions)
        }
    })

# API Routes for Customers (Khatabook)
@app.route('/api/customers', methods=['GET', 'POST'])
def customers_api():
    """Handle customer management"""
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.get_json()
        cursor.execute('''
            INSERT INTO customers (name, phone, business, email, balance)
            VALUES (?, ?, ?, ?, 0.0)
        ''', (data['name'], data.get('phone', ''), 
              data.get('business', ''), data.get('email', '')))
        conn.commit()
        
        customer_id = cursor.lastrowid
        cursor.execute('SELECT * FROM customers WHERE id = ?', (customer_id,))
        customer = cursor.fetchone()
        
        conn.close()
        return jsonify({
            'success': True,
            'customer': {
                'id': customer[0],
                'name': customer[1],
                'phone': customer[2],
                'business': customer[3],
                'email': customer[4],
                'balance': customer[5],
                'created_at': customer[6]
            }
        })
    
    # GET request
    cursor.execute('SELECT * FROM customers ORDER BY name')
    customers = cursor.fetchall()
    
    result = []
    for c in customers:
        result.append({
            'id': c[0],
            'name': c[1],
            'phone': c[2],
            'business': c[3],
            'email': c[4],
            'balance': c[5],
            'created_at': c[6]
        })
    
    conn.close()
    return jsonify({'customers': result})

@app.route('/api/customers/<int:customer_id>/transactions', methods=['GET', 'POST'])
def customer_transactions_api(customer_id):
    """Handle customer transactions (Give Credit / Receive Payment)"""
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.get_json()
        
        # Add transaction
        cursor.execute('''
            INSERT INTO customer_transactions (customer_id, date, amount, description, type)
            VALUES (?, ?, ?, ?, ?)
        ''', (customer_id, data['date'], data['amount'], 
              data['description'], data['type']))
        
        # Update customer balance
        if data['type'] == 'credit':
            # You gave credit - they owe you more
            cursor.execute('UPDATE customers SET balance = balance + ? WHERE id = ?',
                         (data['amount'], customer_id))
        else:  # payment
            # You received payment - they owe you less
            cursor.execute('UPDATE customers SET balance = balance - ? WHERE id = ?',
                         (data['amount'], customer_id))
        
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    
    # GET request - return customer's transactions
    cursor.execute('''
        SELECT * FROM customer_transactions 
        WHERE customer_id = ? 
        ORDER BY date DESC
    ''', (customer_id,))
    
    transactions = cursor.fetchall()
    
    result = []
    for t in transactions:
        result.append({
            'id': t[0],
            'customer_id': t[1],
            'date': t[2],
            'amount': t[3],
            'description': t[4],
            'type': t[5],
            'created_at': t[6]
        })
    
    conn.close()
    return jsonify({'transactions': result})

@app.route('/api/dashboard/stats')
def dashboard_stats():
    """Get dashboard statistics"""
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # Personal finance stats
    cursor.execute('''
        SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
            COUNT(*) as total_transactions
        FROM transactions
    ''')
    personal_stats = cursor.fetchone()
    
    # Business stats
    cursor.execute('SELECT COUNT(*) FROM customers')
    total_customers = cursor.fetchone()[0]
    
    cursor.execute('''
        SELECT 
            SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END) as total_receivables,
            SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END) as total_payables
        FROM customers
    ''')
    business_stats = cursor.fetchone()
    
    conn.close()
    
    return jsonify({
        'personal': {
            'total_income': personal_stats[0] or 0,
            'total_expenses': personal_stats[1] or 0,
            'current_balance': (personal_stats[0] or 0) - (personal_stats[1] or 0),
            'total_transactions': personal_stats[2] or 0
        },
        'business': {
            'total_customers': total_customers,
            'total_receivables': business_stats[0] or 0,
            'total_payables': business_stats[1] or 0
        }
    })

if __name__ == '__main__':
    # Initialize database on first run
    init_db()
    
    # Run the Flask app
    print("🚀 Starting AI-Powered Personal Finance Management System...")
    print("🤖 AI Transaction Categorization: ENABLED")
    print("📊 Analytics Dashboard: ENABLED")
    print("💼 Khatabook Integration: ENABLED")
    app.run(debug=True, host='0.0.0.0', port=5000)
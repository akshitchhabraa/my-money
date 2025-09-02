# Simple script to run the Flask application
from app import app

if __name__ == '__main__':
    print("🚀 Starting My Money Flask Application...")
    print("📱 Open your browser and go to: http://localhost:5000")
    print("✨ Press Ctrl+C to stop the server")
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)
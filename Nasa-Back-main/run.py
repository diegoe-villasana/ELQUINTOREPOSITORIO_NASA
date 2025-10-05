# run.py (compat wrapper)
# Import the Flask `app` instance from legacy_app.py to avoid package/module name conflicts
from legacy_app import app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

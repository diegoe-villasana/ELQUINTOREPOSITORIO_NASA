
from flask import Flask, jsonify, request, render_template
import sys, os
from Controllers import calculos
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder="static", template_folder="templates\\HTML")
# Load Gemini API key into app config (if present in environment or .env)
app.config['GEMINI_API_KEY'] = os.getenv('GEMINI_API_KEY')

CORS(app)

# Register API blueprint (routes.py defines blueprint `bp`)
try:
    from routes import bp as api_bp
    app.register_blueprint(api_bp)
except Exception:
    # If blueprint registration fails, continue; API endpoints may be unavailable.
    pass

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/simulacion")
def simulacion():
    return render_template("simulacion.html")

@app.route("/meteoritos")
def meteoritos():
    return render_template("meteoritos.html")

@app.route("/index")
def index():
    return render_template("index.html")

@app.route("/fuentes")
def fuerntes():
    return render_template("fuentes.html")
    

@app.route("/lista", methods=["GET"])
def lista_meteoros():
    names = calculos.Listameteoros()
    if names:
        return jsonify(names)
    return jsonify({"error": "No encontrado"})

@app.route("/infoasteroide", methods=["GET"])
def info_asteroide():#no pasar parametro ya esta en si en la peticion
    name = request.args.get("name")
    info = calculos.infoasteroide(name)
    if info:
        return jsonify(info)
    return jsonify({"error": "No encontrado"}), 404



@app.route("/lista_mayor_impacto", methods=["GET"])
def lista_mayor_impacto():
    top5 = calculos.top_impacto(5)
    return jsonify(top5)


@app.route('/api/simulate', methods=['POST'])
def simulate_impact_api():
    """Compatibilidad: endpoint de API cuando se ejecuta `app.py` directamente."""
    data = request.get_json()

    if not data or 'meteorite' not in data or 'location' not in data:
        return jsonify({"error": "Datos de entrada inválidos"}), 400

    try:
        location = data['location']
        meteorite_params = data['meteorite']
        diameter = float(meteorite_params.get('diameter', 0))
        velocity = float(meteorite_params.get('velocity', 0))
        density = float(meteorite_params.get('density', 0))

        # import helpers
        from utils import calculate_impact_energy, calculate_crater_diameter
        from services import get_gemini_analysis

        energy = calculate_impact_energy(diameter, velocity, density)
        crater_diameter = calculate_crater_diameter(energy)

        meteorite_data_for_gemini = {
            "diameter": diameter, "velocity": velocity, "density": density,
            "energy": energy, "crater_diameter": crater_diameter
        }
        try:
            gemini_analysis = get_gemini_analysis(meteorite_data_for_gemini, location)
        except Exception:
            gemini_analysis = "Gemini analysis unavailable"

        response_data = {
            "impact_effects": {
                "energy_megatons": round(energy, 2),
                "crater_diameter_meters": round(crater_diameter, 2)
            },
            "location": location,
            "gemini_analysis": gemini_analysis
        }
        return jsonify(response_data)
    except (ValueError, KeyError) as e:
        return jsonify({"error": f"Formato de parámetro inválido o faltan 'lat'/'lng': {e}"}), 400

if __name__ == "__main__":
    app.run(debug=True)

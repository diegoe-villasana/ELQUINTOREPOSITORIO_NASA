# app/routes.py (Versión sin Google Maps)

from flask import request, jsonify, Blueprint
from . import services, utils

bp = Blueprint('api', __name__, url_prefix='/api')

@bp.route('/neos', methods=['GET'])
def get_neos():
    """Endpoint para obtener la lista de Objetos Cercanos a la Tierra."""
    neos_data = services.get_nasa_neos()
    if "error" in neos_data:
        return jsonify(neos_data), 500
    return jsonify(neos_data)

@bp.route('/simulate', methods=['POST'])
def simulate_impact():
    """Endpoint principal para simular el impacto de un meteorito."""
    data = request.get_json()

    if not data or 'meteorite' not in data or 'location' not in data:
        return jsonify({"error": "Datos de entrada inválidos"}), 400

    try:
        location = data['location'] # Esperamos {'lat': ..., 'lng': ...}
        meteorite_params = data['meteorite']
        diameter = float(meteorite_params['diameter'])
        velocity = float(meteorite_params['velocity'])
        density = float(meteorite_params['density'])

        # 1. Realizar cálculos
        energy = utils.calculate_impact_energy(diameter, velocity, density)
        crater_diameter = utils.calculate_crater_diameter(energy)

        # 2. Obtener análisis de Gemini
        meteorite_data_for_gemini = {
            "diameter": diameter, "velocity": velocity, "density": density,
            "energy": energy, "crater_diameter": crater_diameter
        }
        gemini_analysis = services.get_gemini_analysis(meteorite_data_for_gemini, location)

        # 3. Preparar la respuesta
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
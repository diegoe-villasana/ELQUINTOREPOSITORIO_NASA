# Nasa-Back

Instrucciones rápidas para integrar y probar la API de Google Gemini usada por el endpoint de simulación.

Prerequisitos:
- Python 3.10+
- Crear un entorno virtual e instalar dependencias: `pip install -r requirements.txt`

Configurar la API key de Gemini:
1. Crea un archivo `.env` en la raíz del proyecto o exporta la variable de entorno `GEMINI_API_KEY`.
2. En `.env` añade:

GEMINI_API_KEY=AIzaSyBMHJt8mI--rS1O7P4U5HaqtZb_dI2sVRA

Ejecutar la aplicación:
1. Desde la carpeta del proyecto ejecuta:

python run.py

2. Abre `http://localhost:5000/meteoritos` y selecciona un punto en el mapa, rellena el formulario y haz "Calcular Impacto".

Notas:
- El backend expone el endpoint POST `/api/simulate` que recibe JSON con la forma:

{
	"meteorite": { "diameter": <m>, "velocity": <km/s>, "density": <kg/m3>, "angle": <deg> },
	"location": { "lat": <float>, "lng": <float> }
}

La respuesta incluye `impact_effects` con `energy_megatons` y `crater_diameter_meters` y `gemini_analysis` con el texto generado por Gemini.

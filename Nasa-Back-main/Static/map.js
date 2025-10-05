document.addEventListener('DOMContentLoaded', function () {
    // Inicializar el mapa y centrarlo en una vista global
    var map = L.map('map').setView([20, 0], 2);

    // Añadir las capas base: satelital (ESRI) y calles (OpenStreetMap)
    const esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    });

    const osmStreets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    // Añade la capa satelital por defecto
    esriSat.addTo(map);

    // Control para alternar entre capas base (ubicado en bottomleft para evitar solapamiento con HUD)
    L.control.layers({
        'Satelital': esriSat,
        'Mapa calles': osmStreets
    }, null, { position: 'bottomleft' }).addTo(map);

    let impactMarker;
    let impactCircle;

    // Expose function to place marker from external scripts (e.g., globe)
    window.placeImpactFromGlobe = function(lat, lng) {
        const latlng = L.latLng(lat, lng);
        // update hidden inputs if present
        const latInput = document.getElementById('impact-lat');
        const lngInput = document.getElementById('impact-lng');
        if (latInput) latInput.value = lat.toFixed(6);
        if (lngInput) lngInput.value = lng.toFixed(6);

        if (impactMarker) {
            impactMarker.setLatLng(latlng).update();
        } else {
            impactMarker = L.marker(latlng).addTo(map).bindPopup('Punto de impacto seleccionado.');
        }
        // open popup and pan map
        impactMarker.openPopup();
        map.panTo(latlng);
    };

    // Evento de clic en el mapa para colocar el marcador de impacto
    map.on('click', function(e) {
        // Si ya existe un marcador, lo elimina
        if (impactMarker) {
            map.removeLayer(impactMarker);
        }
        // Añade un nuevo marcador en la ubicación del clic
        impactMarker = L.marker(e.latlng).addTo(map)
            .bindPopup('Punto de impacto seleccionado.')
            .openPopup();
        // Actualizar inputs ocultos con lat/lng para que el formulario pueda usarlos
        try {
            const latInput = document.getElementById('impact-lat');
            const lngInput = document.getElementById('impact-lng');
            if (latInput) latInput.value = e.latlng.lat.toFixed(6);
            if (lngInput) lngInput.value = e.latlng.lng.toFixed(6);
        } catch (e) {
            console.warn('No se pudieron actualizar los inputs de lat/lng:', e);
        }
    });

    // Evento de envío del formulario -> Enviar datos al backend (/api/simulate)
    document.getElementById('impact-form').addEventListener('submit', async function(e) {
        e.preventDefault(); // Evita que la página se recargue

        if (!impactMarker) {
            alert('Por favor, selecciona un punto de impacto en el mapa haciendo clic en él.');
            return;
        }

        // Obtener los valores del formulario
        const diameter = parseFloat(document.getElementById('diameter').value);
        const velocity = parseFloat(document.getElementById('velocity').value);
        const density = parseFloat(document.getElementById('Meteoros_Api').value) || parseFloat(document.getElementById('custom-density')?.value) || 3000;
        const angle = parseFloat(document.getElementById('angle').value) || 45;

        const latlng = impactMarker.getLatLng();
        const payload = {
            meteorite: {
                diameter: diameter,
                velocity: velocity,
                density: density,
                angle: angle
            },
            location: {
                lat: latlng.lat,
                lng: latlng.lng
            }
        };

        // Mostrar loader y limpiar texto (y asegurarse de que el panel está visible)
        const geminiResultBlock = document.getElementById('gemini-result');
        const geminiLoader = document.getElementById('gemini-loader');
        const geminiText = document.getElementById('gemini-text');
        if (geminiResultBlock) geminiResultBlock.style.display = 'block';
        if (geminiLoader) geminiLoader.style.display = 'inline-block';
        if (geminiText) {
            geminiText.textContent = 'Analizando impacto...';
            geminiText.style.whiteSpace = 'pre-wrap';
            geminiText.style.color = '#e6eef8';
        }
        console.log('Enviando payload al backend:', payload);

        try {
            const res = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Error en la respuesta del servidor');
            }

            const data = await res.json();

            // Actualizar resultado Gemini en el panel
            console.log('Respuesta del backend:', data);
            if (geminiText) {
                geminiText.textContent = data.gemini_analysis || 'Sin análisis disponible.';
                geminiText.style.display = 'block';
            }

            // Visually emphasize gemini-result
            if (geminiResultBlock) {
                geminiResultBlock.style.boxShadow = '0 6px 24px rgba(0,0,0,0.5)';
                geminiResultBlock.style.border = '1px solid rgba(255,255,255,0.06)';
            }
            // Asegurar que el panel de información está visible y al frente
            try {
                const infoPanel = document.getElementById('info-panel');
                if (infoPanel) {
                    infoPanel.style.zIndex = 5000;
                    infoPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } catch (e) {
                console.warn('No se pudo traer el panel de info al frente:', e);
            }

            // Dibujar cráter usando el diámetro que devuelve el servidor (metros)
            const craterDiameter = data.impact_effects?.crater_diameter_meters || (diameter * 10);
            const craterRadius = (craterDiameter / 2) || (diameter * 10);

            if (impactCircle) map.removeLayer(impactCircle);
            impactCircle = L.circle(latlng, {
                radius: craterRadius,
                color: '#ff4500',
                fillColor: '#ff7043',
                fillOpacity: 0.35
            }).addTo(map);

            map.fitBounds(impactCircle.getBounds());

        } catch (err) {
            console.error('Simulación fallida', err);
            if (geminiText) geminiText.textContent = 'Error al obtener análisis: ' + (err.message || err);
            alert('No se pudo completar la simulación. Revisa la consola para más detalles.');
        } finally {
            if (geminiLoader) geminiLoader.style.display = 'none';
        }
    });
});

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
    });

    // Evento de envío del formulario
    document.getElementById('impact-form').addEventListener('submit', function(e) {
        e.preventDefault(); // Evita que la página se recargue

        if (!impactMarker) {
            alert('Por favor, selecciona un punto de impacto en el mapa haciendo clic en él.');
            return;
        }

        // Obtener los valores del formulario
        const diameter = parseFloat(document.getElementById('diameter').value);
        
        // Estimación simple del radio del cráter (ej: 10 veces el diámetro del proyectil)
        const craterRadius = diameter * 10;

        // Si ya existe un círculo, lo elimina
        if (impactCircle) {
            map.removeLayer(impactCircle);
        }

        // Dibuja un nuevo círculo en la ubicación del marcador
        impactCircle = L.circle(impactMarker.getLatLng(), {
            radius: craterRadius,
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5
        }).addTo(map);

        // Ajusta la vista del mapa para mostrar el cráter completo
        map.fitBounds(impactCircle.getBounds());
    });
});

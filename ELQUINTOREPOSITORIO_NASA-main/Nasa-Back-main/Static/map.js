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

    // Insert draggable handle into info panel
    try {
        const infoPanel = document.getElementById('info-panel');
        if (infoPanel && !document.querySelector('#info-panel .panel-handle')) {
            const handle = document.createElement('div');
            handle.className = 'panel-handle';
            infoPanel.appendChild(handle);

            // Dragging behavior
            let dragging = false;
            let startY = 0;
            let startTop = 0;

            handle.addEventListener('pointerdown', (ev) => {
                dragging = true;
                startY = ev.clientY;
                startTop = parseInt(window.getComputedStyle(infoPanel).top, 10) || 20;
                handle.setPointerCapture(ev.pointerId);
            });

            window.addEventListener('pointermove', (ev) => {
                if (!dragging) return;
                const dy = ev.clientY - startY;
                let newTop = startTop + dy;
                // constrain newTop between 8 and viewport height - panel height - 8
                const minTop = 8;
                const maxTop = window.innerHeight - infoPanel.offsetHeight - 8;
                if (newTop < minTop) newTop = minTop;
                if (newTop > maxTop) newTop = maxTop;
                infoPanel.style.top = newTop + 'px';
            });

            window.addEventListener('pointerup', (ev) => {
                if (!dragging) return;
                dragging = false;
                try { handle.releasePointerCapture(ev.pointerId); } catch(e){}
            });
        }
    } catch (e) { console.warn('No se pudo crear handle del panel:', e); }

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

    // Expose a startSimulation function so the app can run a simulation without any form
    window.startSimulation = async function (opts = {}) {
        // opts can contain meteorite: { diameter, velocity, density, angle }
        const geminiResultBlock = document.getElementById('gemini-result');
        const geminiLoader = document.getElementById('gemini-loader');
        const geminiText = document.getElementById('gemini-text');

        if (!impactMarker) {
            alert('Por favor, selecciona un punto de impacto en el mapa haciendo clic en él.');
            return;
        }

        // determine meteorite params (opts override selectedMeteorite or defaults)
        const defaults = { diameter: 1000, velocity: 20, density: 3000, angle: 45 };
        const selected = (window.selectedMeteorite && typeof window.selectedMeteorite === 'object') ? window.selectedMeteorite : {};
        const meteoriteParams = Object.assign({}, defaults, selected, opts.meteorite || {});

        const latlng = impactMarker.getLatLng();
        const payload = {
            meteorite: {
                diameter: Number(meteoriteParams.diameter),
                velocity: Number(meteoriteParams.velocity),
                density: Number(meteoriteParams.density),
                angle: Number(meteoriteParams.angle)
            },
            location: {
                lat: latlng.lat,
                lng: latlng.lng
            }
        };

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

            // Update Gemini result
            console.log('Respuesta del backend:', data);
            if (geminiText) {
                geminiText.textContent = data.gemini_analysis || 'Sin análisis disponible.';
                geminiText.style.display = 'block';
            }

            if (geminiResultBlock) {
                geminiResultBlock.style.boxShadow = '0 6px 24px rgba(0,0,0,0.5)';
                geminiResultBlock.style.border = '1px solid rgba(255,255,255,0.06)';
            }

            try {
                const infoPanel = document.getElementById('info-panel');
                if (infoPanel) {
                    infoPanel.style.zIndex = 5000;
                    infoPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } catch (e) {
                console.warn('No se pudo traer el panel de info al frente:', e);
            }

            // draw crater
            const craterDiameter = data.impact_effects?.crater_diameter_meters || (meteoriteParams.diameter * 10);
            const craterRadius = (craterDiameter / 2) || (meteoriteParams.diameter * 10);

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
    };

    // Collapse/expand behavior for info panel
    try {
        const collapseBtn = document.getElementById('info-collapse');
        const panelContent = document.getElementById('meteorite-info');
        if (collapseBtn && panelContent) {
            collapseBtn.addEventListener('click', function() {
                const isCollapsed = panelContent.classList.toggle('collapsed');
                collapseBtn.setAttribute('aria-expanded', String(!isCollapsed));
                collapseBtn.classList.toggle('rotated', isCollapsed);
            });
        }
    } catch (e) { console.warn('No se pudo configurar collapse del panel:', e); }
});
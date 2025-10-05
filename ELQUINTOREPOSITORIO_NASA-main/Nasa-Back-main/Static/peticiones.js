

async function nombre() {
    try {
        const response = await fetch("/lista");
        if (response.ok) {
            const data = await response.json();
            console.log(data);
        } else {
            console.error("Retorno no exitososososo, código:", response.status);
        }
    } catch (error) {
        console.error("Error al hacer fetch:", error);
    }
}

async function infoasteroide(nombre) {
    try {
        const response = await fetch(`/infoasteroide?name=${encodeURIComponent(nombre)}`);;
        if (response.ok) {
            const data = await response.json();
            console.log("infoasteroide",data);
            return data
        } else {
            console.error("Retorno no exitoso en infoasteroides, código:", response.status);
        }
    } catch (error) {
        console.error("Error al hacer fetch:", error);
    }
}

async function infoasteroide_nombre(nombre) { 
    try {
        const response = await fetch(`/infoasteroide?name=${encodeURIComponent(nombre)}`);
        if (response.ok) {
            const data = await response.json();
            console.log("infoasteroide", data);

            // ✅ Mostrar solo el nombre en el HTML
            const nombreElemento = document.getElementById("Resultado_meteoro");
            if (nombreElemento) {
                nombreElemento.innerText = data.name; // solo el nombre
            }

            // Guardar la info del meteorito en window.selectedMeteorite y llamar al startSimulation
            try {
                // Prepare a minimal selectedMeteorite object - prefer real values if provided by the API
                window.selectedMeteorite = window.selectedMeteorite || {};
                window.selectedMeteorite.name = data.name || window.selectedMeteorite.name;
                // If the API provides diameter/velocity/density, use them; otherwise keep defaults
                if (data.diameter) window.selectedMeteorite.diameter = data.diameter;
                if (data.velocity) window.selectedMeteorite.velocity = data.velocity;
                if (data.density) window.selectedMeteorite.density = data.density;
                // Trigger the simulation using the global startSimulation function (added in map.js)
                if (typeof window.startSimulation === 'function') {
                    window.startSimulation();
                } else {
                    console.warn('startSimulation no está disponible en este momento.');
                }
            } catch (e) {
                console.warn('No se pudo iniciar la simulación automáticamente:', e);
            }

            return data;
        } else {
            console.error("Retorno no exitoso en infoasteroides, código:", response.status);
        }
    } catch (error) {
        console.error("Error al hacer fetch:", error);
    }
}

// --- Custom meteorite handlers ---
function applyCustomMeteoriteAndSimulate() {
    try {
        // read inputs
        const name = document.getElementById('custom-name')?.value || 'Custom';
        const diameter = parseFloat(document.getElementById('custom-diameter')?.value) || undefined;
        const velocity = parseFloat(document.getElementById('custom-velocity')?.value) || undefined;
        const density = parseFloat(document.getElementById('custom-density')?.value) || undefined;

        if (!diameter || !velocity) {
            alert('Por favor, completa al menos diámetro y velocidad del meteorito personalizado.');
            return;
        }

        window.selectedMeteorite = window.selectedMeteorite || {};
        window.selectedMeteorite.name = name;
        window.selectedMeteorite.diameter = diameter;
        window.selectedMeteorite.velocity = velocity;
        if (density) window.selectedMeteorite.density = density;

        if (typeof window.startSimulation === 'function') {
            window.startSimulation();
        } else {
            console.warn('startSimulation no disponible para ejecutar la simulación.');
        }
    } catch (e) {
        console.error('Error aplicando meteorito personalizado:', e);
    }
}

function clearCustomMeteoriteInputs() {
    try {
        const nameEl = document.getElementById('custom-name');
        const diaEl = document.getElementById('custom-diameter');
        const velEl = document.getElementById('custom-velocity');
        const denEl = document.getElementById('custom-density');
        if (nameEl) nameEl.value = '';
        if (diaEl) diaEl.value = '';
        if (velEl) velEl.value = '';
        if (denEl) denEl.value = '';
        // also clear selectedMeteorite if it matches these values
        if (window.selectedMeteorite) {
            delete window.selectedMeteorite.diameter;
            delete window.selectedMeteorite.velocity;
            delete window.selectedMeteorite.density;
            // keep name if desired
        }
    } catch (e) {
        console.warn('No se pudieron limpiar los campos personalizados:', e);
    }
}

// attach handlers once DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    const addBtn = document.getElementById('add-custom');
    const clearBtn = document.getElementById('clear-custom');
    if (addBtn) addBtn.addEventListener('click', applyCustomMeteoriteAndSimulate);
    if (clearBtn) clearBtn.addEventListener('click', clearCustomMeteoriteInputs);
});


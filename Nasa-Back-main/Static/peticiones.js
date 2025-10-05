

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

            // Después de cargar la info, desencadenar la simulación si el formulario existe.
            try {
                const form = document.getElementById('impact-form');
                if (form) {
                    // requestSubmit es preferible porque dispara validación y los handlers de submit
                    if (typeof form.requestSubmit === 'function') {
                        form.requestSubmit();
                    } else {
                        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                    }
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


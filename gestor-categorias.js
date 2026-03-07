// =========================================
// VARIABLES DE ESTADO LOCAL
// =========================================
let subcatsTemporales = [];
let datosEnergy = {}; 

/**
 * SINCRONIZAR CATÁLOGO DESDE SUPABASE
 */
async function sincronizarCatalogoDesdeBD() {
    try {
        console.log("Intentando descargar catálogo...");
        const { data, error } = await _supabase
            .from('configuracion_catalogo')
            .select('*');

        if (error) throw error;

        // Limpiamos el objeto para evitar duplicados
        datosEnergy = {};

        // Mapeamos los datos: Usamos el nombre_visible para mostrar
        data.forEach(item => {
            // Guardamos las subcategorías usando la key técnica como referencia
            datosEnergy[item.categoria] = {
                nombre: item.nombre_visible,
                subs: item.subcategorias
            };
        });

        console.log("Catálogo sincronizado con éxito:", datosEnergy);
        return true;
    } catch (err) {
        console.error("Error en sincronización:", err);
        return false;
    }
}

/**
 * RENDERIZAR LISTA PRINCIPAL
 */
async function cargarCategoriasActuales() {
    const container = document.getElementById('categories-list-container');
    if (!container) return;

    container.innerHTML = "<p style='text-align:center;'>⏳ Consultando Supabase...</p>";

    try {
        // Validación de seguridad
        if (typeof _supabase === 'undefined') {
            container.innerHTML = "<p style='color:red;'>Error: '_supabase' no está definido.</p>";
            return;
        }

        // Consulta directa sin intermediarios
        const response = await _supabase
            .from('configuracion_catalogo')
            .select('*');

        console.log("Respuesta completa de Supabase:", response);

        // Si la respuesta es undefined o nula
        if (!response) {
            container.innerHTML = "<p style='color:orange;'>La base de datos devolvió 'undefined'. Revisa las Keys.</p>";
            return;
        }

        const { data, error } = response;

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:20px; border:2px dashed #ddd;">
                    <p>No hay datos en la tabla 'configuracion_catalogo'.</p>
                    <button class="btn-main" onclick="openCreateCategoryModal()" style="width:auto;">Crear Primera Categoría</button>
                </div>`;
            return;
        }

        // Renderizado directo
        let html = "";
        data.forEach(item => {
            html += `
                <div class="card" style="margin-bottom:15px; padding:15px; border-left:5px solid var(--primary);">
                    <div style="display:flex; justify-content:space-between;">
                        <strong>📂 ${item.nombre_visible}</strong>
                        <button onclick="openEditCategoryModal('${item.categoria}')" style="color:var(--primary); background:none; border:none; cursor:pointer;">Editar</button>
                    </div>
                    <div style="margin-top:10px;">
                        ${item.subcategorias.map(s => `<span style="background:#eee; padding:2px 8px; border-radius:10px; font-size:12px; margin-right:5px;">${s}</span>`).join('')}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;

    } catch (err) {
        console.error("Error capturado:", err);
        container.innerHTML = `<p style='color:red;'>Error crítico: ${err.message}</p>`;
    }
}

/**
 * MODALES Y NAVEGACIÓN
 */
function showView(viewId, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
    if (btn) btn.classList.add('active');

    if (viewId === 'settings-view') {
        cargarCategoriasActuales();
    }
}

function openCreateCategoryModal() {
    document.getElementById('modal-category-title').innerText = "✚ Nueva Categoría";
    document.getElementById('modal-editing-key').value = "";
    document.getElementById('modal-input-cat-name').value = "";
    subcatsTemporales = [];
    renderSubListInModal();
    document.getElementById('category-modal').style.display = "flex";
}

function closeCategoryModal() {
    document.getElementById('category-modal').style.display = "none";
}

function renderSubListInModal() {
    const container = document.getElementById('modal-sub-list');
    container.innerHTML = subcatsTemporales.length === 0 ? '<small style="color:#94a3b8">Añada subcategorías...</small>' : "";
    subcatsTemporales.forEach((s, i) => {
        const span = document.createElement('span');
        span.style.cssText = "background:white; border:1px solid #ddd; padding:5px 12px; border-radius:20px; font-size:0.85rem; display:flex; align-items:center; gap:8px;";
        span.innerHTML = `${s} <b style="color:red; cursor:pointer;" onclick="removeSubFromModalList(${i})">&times;</b>`;
        container.appendChild(span);
    });
}

function addSubToModalList() {
    const input = document.getElementById('modal-input-sub-name');
    if (input.value.trim()) {
        subcatsTemporales.push(input.value.trim());
        input.value = "";
        renderSubListInModal();
    }
}

function removeSubFromModalList(i) {
    subcatsTemporales.splice(i, 1);
    renderSubListInModal();
}

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

    container.innerHTML = "<p style='text-align:center;'>⏳ Conectando con Energy Cloud...</p>";

    const exito = await sincronizarCatalogoDesdeBD();

    if (!exito) {
        container.innerHTML = "<p style='color:red; text-align:center;'>❌ Error al cargar. Revisa la consola (F12).</p>";
        return;
    }

    const keys = Object.keys(datosEnergy);

    if (keys.length === 0) {
        container.innerHTML = "<p style='text-align:center;'>El catálogo está vacío. Crea una categoría nueva.</p>";
        return;
    }

    container.innerHTML = ""; // Limpiamos el cargando

    keys.forEach(catKey => {
        const info = datosEnergy[catKey];
        const card = document.createElement('div');
        card.className = "card";
        card.style.cssText = "margin-bottom:15px; padding:20px; border-left:5px solid #059669; background:#fff;";

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div>
                    <strong style="font-size:1.1rem; color:#1e293b;">📂 ${info.nombre}</strong>
                    <small style="display:block; color:#64748b; font-size:0.7rem;">Key: ${catKey}</small>
                </div>
                <div style="display:flex; gap:10px;">
                    <button onclick="openEditCategoryModal('${catKey}')" style="background:none; border:none; color:#059669; font-weight:bold; cursor:pointer;">✏️ Editar</button>
                </div>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${info.subs.map(s => `<span style="background:#f1f5f9; padding:3px 10px; border-radius:12px; font-size:0.75rem; border:1px solid #e2e8f0;">${s}</span>`).join('')}
            </div>
        `;
        container.appendChild(card);
    });
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

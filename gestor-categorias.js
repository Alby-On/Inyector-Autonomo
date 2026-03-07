// =========================================
// VARIABLES DE ESTADO LOCAL
// =========================================
let subcatsTemporales = [];
let datosEnergy = {}; 

/**
 * SINCRONIZAR CATÁLOGO DESDE BD
 */
async function sincronizarCatalogoDesdeBD() {
    console.log("intentando sincronizar con Supabase...");
    try {
        if (typeof _supabase === 'undefined') {
            alert("Error: El cliente de Supabase no está cargado. Revisa supabase-client.js");
            return false;
        }

        const { data, error } = await _supabase
            .from('configuracion_catalogo')
            .select('*');

        if (error) throw error;

        // Limpiar y llenar objeto global
        datosEnergy = {};
        data.forEach(item => {
            datosEnergy[item.categoria] = item.subcategorias;
        });

        console.log("Catálogo sincronizado:", datosEnergy);
        return true;
    } catch (err) {
        console.error("Error en sincronización:", err);
        return false;
    }
}

/**
 * RENDERIZAR VISTA DE CONFIGURACIÓN
 */
async function cargarCategoriasActuales() {
    const container = document.getElementById('categories-list-container');
    if (!container) return;

    container.innerHTML = "<p style='text-align:center;'>⏳ Conectando con la base de datos...</p>";

    // 1. Intentar traer los datos
    const exito = await sincronizarCatalogoDesdeBD();

    if (!exito) {
        container.innerHTML = `
            <div style="color:red; text-align:center; padding:20px; border:1px solid red; border-radius:8px;">
                <p>❌ Error de conexión con Supabase.</p>
                <p><small>Verifica si la tabla 'configuracion_catalogo' existe y tiene políticas RLS habilitadas.</small></p>
            </div>`;
        return;
    }

    const keys = Object.keys(datosEnergy);

    // 2. Si la tabla está vacía
    if (keys.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:30px; border:2px dashed #cbd5e1; border-radius:12px;">
                <p style="color:#64748b;">No hay categorías creadas aún.</p>
                <button class="btn-main" onclick="openCreateCategoryModal()" style="width:auto; padding:10px 20px;">
                    ✚ Crear mi primera categoría
                </button>
            </div>`;
        return;
    }

    // 3. Traer conteo de productos para seguridad de borrado
    const { data: productos } = await _supabase.from('productos').select('categoria');
    const conteo = {};
    if (productos) {
        productos.forEach(p => conteo[p.categoria] = (conteo[p.categoria] || 0) + 1);
    }

    // 4. Renderizar tarjetas
    container.innerHTML = "";
    keys.forEach(catKey => {
        const numProds = conteo[catKey] || 0;
        const subList = datosEnergy[catKey] || [];

        const card = document.createElement('div');
        card.className = "card";
        card.style.cssText = "margin-bottom:15px; padding:20px; border-left:5px solid #059669; background:#fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);";

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div>
                    <strong style="text-transform:uppercase; color:#1e293b;">📂 ${catKey.replace(/_/g, ' ')}</strong>
                    <div style="font-size:0.8rem; color:#64748b;">${numProds} productos en esta categoría</div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button onclick="openEditCategoryModal('${catKey}')" style="background:none; border:none; color:#059669; cursor:pointer; font-weight:bold;">✏️ Editar</button>
                    <button onclick="${numProds === 0 ? `eliminarCategoria('${catKey}')` : `alert('No puedes eliminar: hay ${numProds} productos usando esta categoría')`}" 
                            style="background:none; border:none; color:${numProds > 0 ? '#cbd5e1' : '#e11d48'}; cursor:${numProds > 0 ? 'not-allowed' : 'pointer'}; font-weight:bold;">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${subList.map(s => `<span style="background:#f1f5f9; padding:3px 10px; border-radius:12px; font-size:0.75rem; border:1px solid #e2e8f0;">${s}</span>`).join('')}
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * LÓGICA DE NAVEGACIÓN
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
    
    if (viewId === 'list-view' && typeof cargarTablaDesdeSupabase === 'function') {
        cargarTablaDesdeSupabase();
    }
}

/**
 * LÓGICA DEL MODAL
 */
function openCreateCategoryModal() {
    document.getElementById('modal-category-title').innerText = "✚ Nueva Categoría";
    document.getElementById('modal-editing-key').value = "";
    document.getElementById('modal-input-cat-name').value = "";
    subcatsTemporales = [];
    renderSubListInModal();
    document.getElementById('category-modal').style.display = "flex";
}

function openEditCategoryModal(key) {
    document.getElementById('modal-category-title').innerText = "✏️ Editar Categoría";
    document.getElementById('modal-editing-key').value = key;
    document.getElementById('modal-input-cat-name').value = key.replace(/_/g, ' ').toUpperCase();
    subcatsTemporales = [...(datosEnergy[key] || [])];
    renderSubListInModal();
    document.getElementById('category-modal').style.display = "flex";
}

function closeCategoryModal() {
    document.getElementById('category-modal').style.display = "none";
}

function addSubToModalList() {
    const input = document.getElementById('modal-input-sub-name');
    const val = input.value.trim();
    if (val && !subcatsTemporales.includes(val)) {
        subcatsTemporales.push(val);
        input.value = "";
        renderSubListInModal();
    }
}

function removeSubFromModalList(index) {
    subcatsTemporales.splice(index, 1);
    renderSubListInModal();
}

function renderSubListInModal() {
    const container = document.getElementById('modal-sub-list');
    container.innerHTML = "";
    subcatsTemporales.forEach((s, i) => {
        const chip = document.createElement('span');
        chip.style.cssText = "background:white; border:1px solid #ddd; padding:5px 12px; border-radius:20px; display:flex; gap:8px; align-items:center; font-size:0.9rem;";
        chip.innerHTML = `${s} <b style="color:red; cursor:pointer;" onclick="removeSubFromModalList(${i})">&times;</b>`;
        container.appendChild(chip);
    });
}

/**
 * PERSISTENCIA EN SUPABASE
 */
async function processCategorySave() {
    const nombre = document.getElementById('modal-input-cat-name').value.trim();
    const editingKey = document.getElementById('modal-editing-key').value;
    
    if (!nombre || subcatsTemporales.length === 0) {
        alert("Faltan datos requeridos.");
        return;
    }

    const key = nombre.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    try {
        if (editingKey) {
            // Update
            await _supabase.from('configuracion_catalogo')
                .update({ categoria: key, nombre_visible: nombre, subcategorias: subcatsTemporales })
                .eq('categoria', editingKey);
        } else {
            // Insert
            await _supabase.from('configuracion_catalogo')
                .insert([{ categoria: key, nombre_visible: nombre, subcategorias: subcatsTemporales }]);
        }
        
        closeCategoryModal();
        cargarCategoriasActuales();
    } catch (e) {
        alert("Error al guardar: " + e.message);
    }
}

async function eliminarCategoria(key) {
    if (!confirm("¿Eliminar categoría?")) return;
    await _supabase.from('configuracion_catalogo').delete().eq('categoria', key);
    cargarCategoriasActuales();
}

// Aseguramos que las variables existan
let subcatsTemporales = [];

console.log("🛠️ Gestor de Categorías cargado y listo.");

/**
 * FUNCIÓN DE NAVEGACIÓN (SOBREESCRIBE CUALQUIER OTRA)
 */
window.showView = function(viewId, btn) {
    console.log("🚀 Cambiando a vista:", viewId);
    
    // 1. Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // 2. Desactivar todos los botones
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    // 3. Mostrar la vista solicitada
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active');
    } else {
        console.error("❌ Error: No existe el div con ID", viewId);
        return;
    }

    // 4. Activar botón
    if (btn) btn.classList.add('active');

    // 5. LÓGICA DE CARGA AUTOMÁTICA
    if (viewId === 'settings-view') {
        console.log("📂 Cargando categorías...");
        cargarCategoriasActuales();
    }
};

/**
 * RENDERIZADO DE CATEGORÍAS
 */
async function cargarCategoriasActuales() {
    const container = document.getElementById('categories-list-container');
    if (!container) return console.error("❌ No existe 'categories-list-container'");

    container.innerHTML = "<p style='text-align:center;'>⏳ Conectando con Supabase...</p>";

    try {
        // Usamos la instancia global que creamos en supabase-client.js
        const client = window._supabase || _supabase;
        
        if (!client) {
            throw new Error("El cliente de Supabase no se encontró en window._supabase");
        }

        const { data, error } = await client
            .from('configuracion_catalogo')
            .select('*');

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:20px; border:2px dashed #ccc;">
                    <p>La tabla 'configuracion_catalogo' está vacía.</p>
                    <button class="btn-main" onclick="openCreateCategoryModal()" style="width:auto; padding:10px;">
                        ✚ Crear Primera Categoría
                    </button>
                </div>`;
            return;
        }

        container.innerHTML = ""; // Limpiar

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = "card";
            card.style.cssText = "margin-bottom:15px; padding:20px; border-left:5px solid #059669; background:#fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); color: #333;";

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="font-size:1.1rem;">📂 ${item.nombre_visible || item.categoria}</strong>
                    <button onclick="openEditCategoryModal('${item.categoria}')" 
                            style="color:#059669; background:none; border:none; cursor:pointer; font-weight:bold;">
                        Editar
                    </button>
                </div>
                <div style="margin-top:10px; display:flex; flex-wrap:wrap; gap:6px;">
                    ${item.subcategorias.map(s => `
                        <span style="background:#f1f5f9; padding:2px 10px; border-radius:12px; font-size:12px; border:1px solid #e2e8f0; color:#475569;">
                            ${s}
                        </span>
                    `).join('')}
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error("❌ Error cargando categorías:", err);
        container.innerHTML = `<p style='color:red; text-align:center;'>Error: ${err.message}</p>`;
    }
}

// Vinculación de modales para que el HTML los encuentre
window.openCreateCategoryModal = function() {
    document.getElementById('modal-category-title').innerText = "✚ Nueva Categoría";
    document.getElementById('modal-editing-key').value = "";
    document.getElementById('modal-input-cat-name').value = "";
    subcatsTemporales = [];
    renderSubListInModal();
    document.getElementById('category-modal').style.display = "flex";
};

window.closeCategoryModal = function() {
    document.getElementById('category-modal').style.display = "none";
};

window.renderSubListInModal = function() {
    const container = document.getElementById('modal-sub-list');
    if (!container) return;
    container.innerHTML = "";
    subcatsTemporales.forEach((s, i) => {
        const span = document.createElement('span');
        span.style.cssText = "background:#f8fafc; border:1px solid #ddd; padding:5px 12px; border-radius:20px; font-size:0.85rem; display:flex; align-items:center; gap:8px;";
        span.innerHTML = `${s} <b style="color:red; cursor:pointer;" onclick="removeSubFromModalList(${i})">&times;</b>`;
        container.appendChild(span);
    });
};

window.addSubToModalList = function() {
    const input = document.getElementById('modal-input-sub-name');
    if (input.value.trim()) {
        subcatsTemporales.push(input.value.trim());
        input.value = "";
        renderSubListInModal();
    }
};

window.removeSubFromModalList = function(i) {
    subcatsTemporales.splice(i, 1);
    renderSubListInModal();
};

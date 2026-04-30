/**
 * src/utils/storage.js
 * Centralized storage logic using IndexedDB for large assets and localStorage for small keys.
 */

const DB_NAME = 'KreaviaDB';
const STORE_NAME = 'brands';

const initDB = () => {
  return new Promise((resolve, reject) => {
    // Increment version to 3 to ensure 'templates' store is created for all users
    const request = indexedDB.open(DB_NAME, 3);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const saveBrand = async (brand) => {
  if (!brand || !brand.id) return;
  
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(brand);
    
    // Also update the active ID in localStorage for quick access
    localStorage.setItem('kreavia_active_brand_id', brand.id);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log('[Storage] Brand saved to IndexedDB:', brand.id);
        resolve(true);
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[Storage] IDB failed, using fallback:', err);
    try {
      const brands = JSON.parse(localStorage.getItem('kreavia_user_brands') || '[]');
      const idx = brands.findIndex(b => b.id === brand.id);
      if (idx !== -1) brands[idx] = brand;
      else brands.unshift(brand);
      localStorage.setItem('kreavia_user_brands', JSON.stringify(brands.slice(0, 3)));
    } catch (e) {
      console.error('[Storage] Fatal storage error:', e);
    }
  }
};

export const getBrands = async () => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        const fallback = JSON.parse(localStorage.getItem('kreavia_user_brands') || '[]');
        resolve(fallback);
      };
    });
  } catch (err) {
    return JSON.parse(localStorage.getItem('kreavia_user_brands') || '[]');
  }
};

export const getBrandById = async (id) => {
  const brands = await getBrands();
  return brands.find(b => b.id === id) || null;
};

export const getActiveBrand = async () => {
  const activeId = localStorage.getItem('kreavia_active_brand_id');
  const brands = await getBrands();
  if (activeId) {
    const active = brands.find(b => b.id === activeId);
    if (active) return active;
  }
  return brands[0] || null;
};

export const deleteBrand = async (id) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  } catch (err) {
    const brands = JSON.parse(localStorage.getItem('kreavia_user_brands') || '[]');
    const filtered = brands.filter(b => b.id !== id);
    localStorage.setItem('kreavia_user_brands', JSON.stringify(filtered));
  }
};

export const saveTemplateState = async (templateId, state) => {
  if (!templateId) return;
  try {
    const db = await initDB();
    const tx = db.transaction('templates', 'readwrite');
    const store = tx.objectStore('templates');
    const item = { id: templateId, data: state, updatedAt: Date.now() };
    store.put(item);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[Storage] template IDB failed, fallback to localStorage', err);
    try {
      localStorage.setItem(`kreavia_saved_template_${templateId}`, JSON.stringify(state));
    } catch(e) {
      console.error('[Storage] fallback also failed', e);
    }
  }
};

export const getTemplateState = async (templateId) => {
  if (!templateId) return null;
  try {
    const db = await initDB();
    const tx = db.transaction('templates', 'readonly');
    const store = tx.objectStore('templates');
    const request = store.get(templateId);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result ? request.result.data : null);
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[Storage] template load IDB failed', err);
    const savedStateStr = localStorage.getItem(`kreavia_saved_template_${templateId}`);
    return savedStateStr ? JSON.parse(savedStateStr) : null;
  }
};
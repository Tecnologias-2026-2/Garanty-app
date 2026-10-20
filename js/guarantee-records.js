(() => {
  const records = [
    { product: "iPhone 15 Pro", brand: "Apple", category: "Smartphones", status: "Por vencer", remainingDays: 6, purchased: "2024-12-22", expires: "2025-12-22", duration: "12 meses", price: 5299000, store: "Apple Store", serial: "APL-15P-4821", notes: "Conservar la factura original para cualquier reclamación." },
    { product: "Smart TV LG OLED 55”", brand: "LG", category: "Televisores", status: "Por vencer", remainingDays: 7, purchased: "2024-11-10", expires: "2025-11-10", duration: "12 meses", price: 4299000, store: "Alkosto", serial: "LG-OLED-5508", notes: "" },
    { product: "Impresora HP", brand: "HP", category: "Computadores", status: "Por vencer", remainingDays: 24, purchased: "2024-12-06", expires: "2025-12-06", duration: "12 meses", price: 749900, store: "Éxito", serial: "HP-ENVY-2087", notes: "" },
    { product: "Sony WH-1000XM5", brand: "Sony", category: "Audífonos", status: "Activa", remainingDays: 346, purchased: "2024-09-20", expires: "2026-09-20", duration: "24 meses", price: 1499900, store: "Sony Store", serial: "SN-WH5-1205", notes: "" },
    { product: "Lavadora Whirlpool 12 kg", brand: "Whirlpool", category: "Línea blanca", status: "Activa", remainingDays: 380, purchased: "2024-06-06", expires: "2027-06-06", duration: "36 meses", price: 2199900, store: "Homecenter", serial: "WH-12K-8831", notes: "" },
    { product: "MacBook Pro 14”", brand: "Apple", category: "Computadores", status: "Activa", remainingDays: 171, purchased: "2025-01-15", expires: "2027-01-15", duration: "24 meses", price: 8999000, store: "iShop", serial: "MBP14-9942", notes: "" },
    { product: "Aire acondicionado Daikin", brand: "Daikin", category: "Electrodomésticos", status: "Activa", remainingDays: 210, purchased: "2025-10-15", expires: "2027-10-15", duration: "24 meses", price: 3299900, store: "Climática", serial: "DK-AC-6312", notes: "" },
    { product: "Refrigeradora Samsung", brand: "Samsung", category: "Línea blanca", status: "Vencida", purchased: "2023-10-20", expires: "2024-10-20", duration: "12 meses", price: 2799900, store: "Falabella", serial: "SAM-RF-7102", notes: "" },
    { product: "Taladro percutor Bosch", brand: "Bosch", category: "Herramientas", status: "Vencida", purchased: "2023-07-02", expires: "2024-07-02", duration: "12 meses", price: 489900, store: "Homecenter", serial: "BOS-TH-3219", notes: "" },
    { product: "Bicicleta Trek FS2", brand: "Trek", category: "Bicicletas", status: "Vencida", purchased: "2023-12-22", expires: "2024-12-22", duration: "12 meses", price: 4999900, store: "Trek Colombia", serial: "TRK-FS2-5821", notes: "" },
    { product: "MacBook Air M2", brand: "Apple", category: "Computadores", status: "Activa", remainingDays: 17, purchased: "2024-01-15", expires: "2026-01-15", duration: "24 meses", price: 4999000, store: "iShop", serial: "MBA-M2-1925", notes: "" },
    { product: "iPhone 13 Pro", brand: "Apple", category: "Smartphones", status: "Por vencer", remainingDays: 18, purchased: "2024-03-03", expires: "2027-03-03", duration: "36 meses", price: 3799000, store: "Claro", serial: "APL-13P-2450", notes: "" },
    { product: "Refrigerador LG", brand: "LG", category: "Electrodomésticos", status: "Activa", remainingDays: 7, purchased: "2023-12-10", expires: "2026-12-10", duration: "36 meses", price: 2599900, store: "Alkosto", serial: "LG-RF-1108", notes: "" },
    { product: "Smart TV Samsung", brand: "Samsung", category: "Televisores", status: "Por vencer", remainingDays: 7, purchased: "2023-12-10", expires: "2026-12-10", duration: "36 meses", price: 3299900, store: "Falabella", serial: "SAM-TV-3014", notes: "" }
  ];

  const slugify = (value) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  function readStored(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : {};
    } catch (error) {
      console.error(`No se pudo leer el almacenamiento local (${key}).`, error);
      return {};
    }
  }

  function writeStored(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`No se pudo guardar en el almacenamiento local (${key}).`, error);
      return false;
    }
  }

window.GuaranteeStore = {
  records,
  slugify,

  getCustomRecords() {
    try {
      const value = localStorage.getItem("garantyapp-custom-guarantees");
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error("No se pudieron leer las garantías creadas.", error);
      return [];
    }
  },

  create(record) {
    try {
      const customRecords = this.getCustomRecords();
      customRecords.push(record);

      localStorage.setItem(
        "garantyapp-custom-guarantees",
        JSON.stringify(customRecords)
      );

      return true;
    } catch (error) {
      console.error("No se pudo guardar la nueva garantía.", error);
      return false;
    }
  },

 get(id) {
  const customRecords = this.getCustomRecords();

  const record = [...records, ...customRecords]
    .find((item) => slugify(item.product) === id);

  if (!record) return null;

  const overrides = readStored("garantyapp-guarantee-overrides");

  return {
    ...record,
    ...(overrides[id] ?? {})
  };
}
};

})();

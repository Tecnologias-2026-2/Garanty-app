Para Completar por grupo

🌐 GarantyApp

GarantyApp es una aplicación móvil / web en español diseñada para centralizar el registro, seguimiento y notificación de garantías de productos personales, eliminando la dependencia de papeles físicos y evitando que el usuario pierda sus derechos por olvido.

👥 Integrantes
Prueba
Verónica Cerquera – 1202756
Samanta Manosalva – 1202769
Isabel Obando - 1202730


🎯 1. Objetivo General

Desarrollar una aplicación móvil / Web que permita a los usuarios registrar, organizar y hacer seguimiento de las garantías de sus productos, mediante un registro digital centralizado y recordatorios automáticos sobre sus fechas de vencimiento. Con esta aplicación se busca solucionar el problema de la pérdida de garantías por olvido o falta de información sobre sus fechas de vigencia, evitando así posibles pérdidas económicas y facilitando el acceso a información sobre los derechos del consumidor en Colombia relacionados con las garantías.


🌍 2. Contexto de Uso

El sistema será utilizado por consumidores hispanohablantes entre 18 y 60 años que realizan compras de productos con garantía, como electrodomésticos, celulares, computadores, muebles y herramientas. Los usuarios podrán registrar digitalmente sus productos y la información relacionada con sus garantías, organizar y consultar fácilmente sus datos, y recibir recordatorios antes de las fechas de vencimiento, con el fin de mantener un seguimiento adecuado y evitar la pérdida de sus derechos de garantía por olvido, extravío de comprobantes o desconocimiento de las fechas de vigencia.


📋 3. Requerimientos del Sistema
3.1 Requerimientos Funcionales

Escriban lo que el sistema debe hacer.

Ejemplo:
RF01: El sistema debe permitir registrar usuarios.

3.2 Requerimientos No Funcionales

Escriban cómo debe comportarse el sistema.

Ejemplo:
RNF01: La página debe ser responsive.

🧠 4. Diagramas UML

Diagrama de Casos de Uso

Explicar brevemente qué muestra el diagrama.

Diagrama de Secuencia

Explicar qué proceso representa.

🎨 5. URL del Prototipo

Enlace público de Figma:

https://www.figma.com/design/WlO61BO3snQnISWMoZemX7/GarantyApp-Atomic-desing?node-id=39-881&t=hinoLJ3cLaNjImts-1


🗄️ 6. Diseño de Base de Datos

Agregar imagen del modelo.
Tablas principales

🧩 7. Documentación del Sistema de estructura de Carpetas

- **`css/`**: Carpeta que contiene los archivos CSS encargados de definir los estilos y la apariencia visual de las distintas páginas del proyecto.
- **`css/styles_tokens.css`**: Define los tokens comunes de color. Cada hoja CSS de página aplica directamente Poppins, texto base de 14 px, encabezados de 64 px y la misma paleta; las opacidades de estados y superficies se conservan.
- **`pages/`**: Carpeta que contiene los archivos HTML correspondientes a las diferentes páginas del sitio web.
- **`pages/add-guarantee.html`**: Asistente para registrar un producto y los datos de su garantía, con estilos en `css/styles_add_guarantee.css` y navegación de pasos en `js/add-guarantee.js`.
- **`pages/guarantee-category.html`**: Selección, creación y eliminación de categorías dentro del registro de garantías; las categorías se conservan en el navegador y el avance del formulario se conserva temporalmente.
- **`css/styles_guarantee_category.css`** y **`js/guarantee-category.js`**: Estilos e interacciones de la pantalla de categorías.
- **`pages/guarantee-created.html`**: Confirmación al finalizar el registro de una garantía, con estilos en `css/styles_guarantee_created.css` y detalles en `js/guarantee-created.js`.
- **`pages/guarantee-details.html`**, **`pages/guarantee-edit.html`** y **`pages/guarantee-documents.html`**: consulta, edición y gestión de documentos de una garantía; los cambios y archivos adjuntos se guardan localmente en el navegador.
- **`js/guarantee-records.js`** y **`js/guarantee-links.js`**: datos de ejemplo del historial y conexión de los botones «Detalles» al registro correspondiente.
- **`css/styles_guarantee_record.css`**: estilos compartidos de las páginas de detalles, edición y documentos; cada vista tiene además su hoja CSS específica.
- **`js/`**: Scripts de interacción de las páginas que necesitan comportamiento dinámico.
- El historial de garantías usa `pages/guarantees.html` para la vista general y `pages/guarantees-active.html`, `pages/guarantees-expiring.html` y `pages/guarantees-expired.html` para sus filtros. Las cuatro vistas comparten los estilos de `css/styles_guarantees.css` y permiten filtrar por categoría y búsqueda mediante `js/guarantee-filter.js`.


Explicar brevemente qué contiene cada carpeta.

🚀 8. Instalación y Ejecución

Explicar cómo correr el proyecto.

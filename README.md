# Gestor de Tareas Colaborativo

## Descripción
Aplicación web para gestión de tareas colaborativa con interfaz tipo Kanban. Permite crear proyectos, tableros y tareas con arrastrar-y-soltar, autenticación de usuarios y colaboración en tiempo real.

## Requisitos
- **PHP** 7.4 o superior
- **MySQL/MariaDB** 5.7 o superior
- **MAMP** (recomendado para desarrollo local)
- **Navegador** moderno (Chrome, Firefox, Edge, Safari)

## Instalación

### 1. Clonar el repositorio
```bash
git clone <tu_repositorio>
cd GestorTareasColab
```

### 2. Configurar la base de datos

#### Opción A: Usando phpMyAdmin (MAMP)
1. Abre phpMyAdmin: `http://localhost:8889/phpMyAdmin`
2. Crea una nueva base de datos llamada `gestor_tareas`
3. Selecciona la BD y ve a la pestaña "SQL"
4. Copia y pega el contenido del archivo `schema_completo.sql`
5. Ejecuta el script

#### Opción B: Usando línea de comandos
```bash
mysql -h 127.0.0.1 -P 8889 -u root -p < schema_completo.sql
```

### 3. Configurar credenciales de BD (si es necesario)
Edita `api/config/database.php` si tu configuración de MAMP es diferente:

```php
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 8889);         // 8889 en MAMP, 3306 en MySQL nativo
define('DB_NAME', 'gestor_tareas');
define('DB_USER', 'root');
define('DB_PASS', 'root');
```

### 4. Acceder a la aplicación
- **URL local**: `http://localhost:8888/GestorTareasColab/public/auth.html`
- **Usuario de prueba**: demo@example.com
- **Contraseña**: demo1234

## Estructura de la Base de Datos

### Tablas principales (4)
| Tabla | Descripción | Registros |
|-------|-------------|-----------|
| **usuarios** | Datos de usuarios del sistema | Tiene datos |
| **proyectos** | Proyectos creados | Tiene datos |
| **tableros** | Tableros Kanban en proyectos | Tiene datos |
| **tareas** | Tareas en tableros | Tiene datos |

### Tablas de relaciones (2)
| Tabla | Descripción | Estado |
|-------|-------------|--------|
| **colaboradores** | Colaboradores en proyectos | Preparada para usar |
| **proyecto_colaboradores** | Alternativa de colaboradores | Preparada para usar |

## Estructura del Proyecto

```
GestorTareasColab/
├── api/                          # Endpoints PHP (REST API)
│   ├── config/database.php       # Configuración de BD
│   ├── usuario.php               # Datos del usuario loguado
│   ├── check_auth.php            # Verificar autenticación
│   ├── proyectos.php             # CRUD de proyectos
│   ├── tableros.php              # CRUD de tableros
│   ├── tareas.php                # CRUD de tareas
│   └── tablero.php               # Datos de tablero específico
│
├── assets/                       # Recursos estáticos
│   ├── css/
│   │   └── styles.css            # Estilos personalizados
│   ├── js/
│   │   ├── auth.js               # Lógica de autenticación
│   │   ├── proyectos.js          # Lógica de proyectos
│   │   └── kanban.js             # Lógica del tablero Kanban
│   └── img/                      # Imágenes
│
├── public/                       # Archivos públicos
│   ├── auth.html                 # Login y registro
│   ├── proyectos.html            # Dashboard de proyectos
│   ├── tablero.html              # Tablero Kanban
│   ├── login.php                 # Procesamiento de login
│   ├── registro.php              # Procesamiento de registro
│   ├── logout.php                # Cerrar sesión
│   └── check_session.php         # Verificar sesión
│
├── .git/                         # Control de versiones
├── schema_completo.sql           # Script SQL completo
├── estructura_bd.php             # Visualizador de BD
└── README.md                     # Este archivo
```

## Flujo de la Aplicación

### 1. Autenticación
```
auth.html → login.php/registro.php → Sesión PHP → proyectos.html
```

### 2. Proyectos
```
proyectos.html → api/proyectos.php → Base de datos
```

### 3. Tableros Kanban
```
tablero.html → api/tableros.php + api/tareas.php → Base de datos
```

### 4. Tareas
```
Crear/Editar/Mover → api/tareas.php (POST/PUT/DELETE) → Base de datos
```

## Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, Bootstrap 5, JavaScript vanilla
- **Backend**: PHP 7.4+, MySQLi
- **Bases de datos**: MySQL/MariaDB
- **Librerías**: 
  - Bootstrap Icons para iconos
  - Sortable.js para drag-and-drop
  - Bootstrap 5 para estilos y modales

## Características Principales

✅ Autenticación con email y contraseña hasheada
✅ Crear y gestionar proyectos
✅ Tableros Kanban con 3 columnas
✅ Crear, editar, mover y eliminar tareas
✅ Drag-and-drop entre columnas
✅ Prioridades de tareas (baja, media, alta)
✅ Descripción y fechas de vencimiento
✅ Sistema de roles (administrador, usuario)
✅ Preparado para colaboradores

## Próximas Funcionalidades

🔲 Colaboración en proyectos
🔲 Notificaciones en tiempo real
🔲 Asignación de tareas a usuarios
🔲 Comentarios en tareas
🔲 Adjuntos en tareas
🔲 Filtros y búsqueda avanzada
🔲 Exportar proyectos/tareas
🔲 API pública para integraciones

## Solución de Problemas

### "No se puede conectar a la BD"
- Verifica que MAMP está corriendo
- Verifica el puerto: 8889 (MAMP) vs 3306 (MySQL nativo)
- Verifica credenciales en `api/config/database.php`

### "Tarea creada pero no aparece"
- Recarga la página (F5)
- Verifica consola del navegador (F12)
- Verifica que el tablero tiene ID en la URL

### "Error de autenticación"
- Verifica que la sesión de PHP está habilitada
- Borra cookies del navegador
- Intenta con usuario de demo

## Contacto y Soporte
Para reportar bugs o sugerencias, abre un issue en el repositorio.

## Licencia
Este proyecto es de código abierto bajo licencia MIT.

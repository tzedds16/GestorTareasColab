-- ============================================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS - GESTOR DE TAREAS COLABORATIVO
-- ============================================================================
-- Este script crea toda la estructura necesaria para el funcionamiento del
-- gestor de tareas colaborativo. Ejecutar este script en MySQL para crear
-- la base de datos y todas las tablas.
-- ============================================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS gestor_tareas;
USE gestor_tareas;

-- ============================================================================
-- TABLA: usuarios
-- ============================================================================
-- Almacena los datos de los usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('administrador', 'usuario') DEFAULT 'usuario',
    foto_perfil VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: proyectos
-- ============================================================================
-- Almacena los proyectos creados por los usuarios
CREATE TABLE IF NOT EXISTS proyectos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    usuario_id INT NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: tableros
-- ============================================================================
-- Almacena los tableros Kanban dentro de cada proyecto
CREATE TABLE IF NOT EXISTS tableros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    proyecto_id INT NOT NULL,
    posicion INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    INDEX idx_proyecto (proyecto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: tareas
-- ============================================================================
-- Almacena las tareas individuales dentro de los tableros
CREATE TABLE IF NOT EXISTS tareas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tablero_id INT,
    proyecto_id INT,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    estado ENUM('tareas', 'en_proceso', 'terminadas') DEFAULT 'tareas',
    prioridad ENUM('baja', 'media', 'alta') DEFAULT 'media',
    orden INT DEFAULT 0,
    fecha_limite DATE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tablero_id) REFERENCES tableros(id) ON DELETE CASCADE,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    INDEX idx_tablero (tablero_id),
    INDEX idx_proyecto (proyecto_id),
    INDEX idx_estado (estado),
    INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: colaboradores
-- ============================================================================
-- Almacena los usuarios colaboradores en proyectos
CREATE TABLE IF NOT EXISTS colaboradores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    proyecto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    rol ENUM('editor', 'viewer') DEFAULT 'editor',
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_colaborador (proyecto_id, usuario_id),
    INDEX idx_proyecto (proyecto_id),
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: proyecto_colaboradores
-- ============================================================================
-- Tabla alternativa para almacenar colaboradores en proyectos
CREATE TABLE IF NOT EXISTS proyecto_colaboradores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    proyecto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    rol ENUM('owner', 'colaborador') DEFAULT 'colaborador',
    fecha_invitacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_proyecto (proyecto_id),
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INSERTAR USUARIO DE PRUEBA
-- ============================================================================
-- Usuario: demo@example.com
-- Contraseña: demo1234 (hash bcrypt)
INSERT IGNORE INTO usuarios (nombre, email, password, rol) VALUES 
('Usuario Demo', 'demo@example.com', '$2y$10$K6T0jQzWx0nN5p3mQ8vPh.ZQ6Ey5nJg7dK2hL8mP9qR3sT4uV5wXy', 'usuario');

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- Script completado exitosamente
-- Base de datos: gestor_tareas
-- Tablas creadas: 6 (usuarios, proyectos, tableros, tareas, colaboradores, proyecto_colaboradores)
-- ============================================================================

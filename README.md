# web-calificaciones-escolares

Web estática que presenta un expediente escolar (pre-primaria, primaria y secundaria) a partir de los datos de [`qualifications.json`](qualifications.json). Sin frameworks ni paso de build: solo HTML, CSS y JavaScript.

## Uso

Servir la carpeta con cualquier servidor estático y abrir en el navegador:

```sh
python3 -m http.server 8000
```

Luego visitar `http://localhost:8000`. La página carga el JSON, muestra una fila de cifras del expediente y permite navegar entre los tres niveles educativos mediante pestañas (pre-primario por defecto). Cada nivel es enlazable por hash: `#pre_primaria`, `#primaria`, `#secundaria`.

## Estructura

```
index.html                 Página principal
css/styles.css             Sistema de diseño (tema modern-minimal, tokens OKLCH)
js/app.js                  Carga del JSON y render de tablas por nivel
icons/favicon.svg          Ícono del sitio
data/qualifications.json   Datos del expediente académico
```

## Licencia

Este proyecto está bajo la licencia **MIT**.  
Consulta el archivo [LICENSE](LICENSE) para más detalles.

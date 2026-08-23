const $ = (sel) => document.querySelector(sel);

function textoNivel(curso) {
	return curso
		.toLowerCase()
		.replace(/(^|(?<=\.)\s*)(\S)/g, (_m, prev, letra) => prev + letra.toUpperCase());
}

async function cargarDatos() {
	const respuesta = await fetch("qualifications.json");
	if (!respuesta.ok) throw new Error(`No se pudo leer qualifications.json (${respuesta.status})`);
	return respuesta.json();
}

function renderEncabezado(expediente) {
	$("#institucion").textContent = expediente.institucion;

	const matricula = $("#matricula");
	matricula.textContent = `Matrícula ${expediente.matricula}`;

	const anios = [
		expediente.pre_primaria["año_escolar"],
		expediente.primaria["año_escolar"],
		expediente.secundaria["año_escolar"],
	];
	$("#periodo-total").textContent = `${anios[0]} — ${anios[2]}`;

	const niveles = [
		textoNivel(expediente.pre_primaria.curso),
		textoNivel(expediente.primaria.curso),
		textoNivel(expediente.secundaria.curso),
	];
	$("#lede").textContent =
		`Este documento reúne las calificaciones escolares correspondientes a la matrícula ` +
		`${expediente.matricula} en el ${expediente.institucion}: ${niveles[0]} (${anios[0]}), ` +
		`${niveles[1]} (${anios[1]}) y ${niveles[2]} (${anios[2]}).`;
}

const MESES = {
	"ago-sept-oct": "Ago–sept–oct",
	"nov-dic-ene": "Nov–dic–ene",
	"feb-mar": "Feb–mar",
	"abr-may-jun": "Abr–may–jun",
};

const METRICAS_TRIMESTRE = [
	["cp1", "CP 1"],
	["cp2", "CP 2"],
	["cp3", "CP 3"],
	["cp4", "CP 4"],
	["pfp", "PFP"],
	["cfp", "CFP"],
	["cfa", "CFA"],
];

function tituloClave(clave) {
	return clave
		.replaceAll("_", " ")
		.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function nodo(html) {
	const plantilla = document.createElement("template");
	plantilla.innerHTML = html.trim();
	return plantilla.content.firstElementChild;
}

function marca(valor) {
	if (valor) return `<span class="marca">✓</span>`;
	return `<span class="marca--vacia" aria-label="Sin registro">—</span>`;
}

function celdaNum(valor, destacada = false) {
	const clase = destacada ? "num destacada" : "num";
	return valor == null ? `<td class="${clase}">—</td>` : `<td class="${clase}">${valor}</td>`;
}

function seccionNivel(numero, expediente, clave, anio, contenidoHtml) {
	const curso = textoNivel(expediente[clave].curso);
	return nodo(`
		<section class="nivel" id="${clave}" aria-labelledby="titulo-${clave}">
			<div class="nivel__head">
				<span class="nivel__num" aria-hidden="true">${numero}</span>
				<h2 class="nivel__titulo" id="titulo-${clave}">${curso}</h2>
				<span class="nivel__anio">${anio}</span>
			</div>
			${contenidoHtml}
		</section>
	`);
}

/* --- pre-primaria -------------------------------------------------------- */

function tablaIndicadores(caption, indicadores) {
	const filas = indicadores
		.map(
			(fila) => `
			<tr>
				<th scope="row">${fila.indicador}</th>
				<td>${marca(fila.inicio_ano_escolar)}</td>
				<td>${marca(fila.primer_periodo)}</td>
				<td>${marca(fila.segundo_periodo)}</td>
			</tr>`
		)
		.join("");

	return `
		<div class="tabla-scroll">
			<table>
				<caption>${caption}</caption>
				<thead>
					<tr>
						<th scope="col">Indicador</th>
						<th scope="col">Inicio del año escolar</th>
						<th scope="col">Primer período</th>
						<th scope="col">Segundo período</th>
					</tr>
				</thead>
				<tbody>${filas}</tbody>
			</table>
		</div>`;
}

function renderPrePrimaria(expediente) {
	const pre = expediente.pre_primaria;
	const dimensiones = [
		["dimension_socio_emocional", "Dimensión socio-emocional"],
		["dimension_de_la_expresion_y_comunicacion", "Dimensión de la expresión y comunicación"],
	];

	const contenido = dimensiones
		.map(([clave, titulo]) => tablaIndicadores(titulo, pre[clave]))
		.join("");

	return seccionNivel("1", expediente, "pre_primaria", pre["año_escolar"], contenido);
}

/* --- primaria ------------------------------------------------------------ */

function tablaTrimestre(nombre, asignaturas) {
	const tieneCfa = Object.values(asignaturas).some((a) => a.cfa != null);
	const columnas = METRICAS_TRIMESTRE.filter(([clave]) => clave !== "cfa" || tieneCfa);

	const cabecera = columnas.map(([, titulo]) => `<th scope="col" class="num">${titulo}</th>`).join("");

	const filas = Object.entries(asignaturas)
		.map(([nombreAsignatura, datos]) => {
			const celdas = columnas
				.map(([clave], i) => celdaNum(datos[clave], i === columnas.length - 1))
				.join("");
			return `<tr><th scope="row">${tituloClave(nombreAsignatura)}</th>${celdas}</tr>`;
		})
		.join("");

	return `
		<div class="tabla-scroll">
			<table>
				<caption>${nombre}</caption>
				<thead>
					<tr>
						<th scope="col">Asignatura</th>
						${cabecera}
					</tr>
				</thead>
				<tbody>${filas}</tbody>
			</table>
		</div>`;
}

function renderPrimaria(expediente) {
	const primaria = expediente.primaria;
	const notas = primaria.notas;

	const trimestres = Object.entries(notas)
		.filter(([clave]) => clave.endsWith("_trimestre"))
		.map(([clave, asignaturas]) =>
			tablaTrimestre(tituloClave(clave), asignaturas)
		)
		.join("");

	let indiceHtml = "";
	if (notas.indice) {
		const metricas = [...new Set(Object.values(notas.indice).flatMap((t) => Object.keys(t)))];
		const nombresTrim = Object.keys(notas.indice);
		const filas = metricas
			.map((metrica) => {
				const celdas = nombresTrim.map((t) => celdaNum(notas.indice[t][metrica])).join("");
				return `<tr><th scope="row">${METRICAS_TRIMESTRE.find(([c]) => c === metrica)?.[1] ?? tituloClave(metrica)}</th>${celdas}</tr>`;
			})
			.join("");
		indiceHtml = `
			<h3>Índice general</h3>
			<div class="tabla-scroll">
				<table>
					<thead>
						<tr>
							<th scope="col"></th>
							${nombresTrim.map((t) => `<th scope="col" class="num">${tituloClave(t)}</th>`).join("")}
						</tr>
					</thead>
					<tbody>${filas}</tbody>
				</table>
			</div>`;
	}

	let leyendaHtml = "";
	if (notas.leyenda) {
		const items = Object.entries(notas.leyenda)
			.map(([sigla, significado]) => `<strong>${sigla.toUpperCase()}</strong> — ${significado}`)
			.join(" · ");
		leyendaHtml = `<p class="leyenda">${items}</p>`;
	}

	return seccionNivel("2", expediente, "primaria", primaria["año_escolar"], trimestres + indiceHtml + leyendaHtml);
}

/* --- secundaria ---------------------------------------------------------- */

function renderSecundaria(expediente) {
	const secundaria = expediente.secundaria;
	const parciales = secundaria.calificaciones_parciales;
	const finales = secundaria.calificacion_final;
	const indice = secundaria.indice;

	const periodos = [...new Set(Object.values(parciales).flatMap((p) => Object.keys(p)))];

	const filasParciales = Object.entries(parciales)
		.map(([asignatura, notas]) => {
			const celdas = periodos.map((p) => celdaNum(notas[p])).join("");
			return `<tr><th scope="row">${tituloClave(asignatura)}</th>${celdas}</tr>`;
		})
		.join("");

	const filasFinales = Object.entries(finales)
		.map(([asignatura, nota], i, arr) => {
			const ultima = i === arr.length - 1;
			return `<tr><th scope="row">${tituloClave(asignatura)}</th>${celdaNum(nota, ultima)}</tr>`;
		})
		.join("");

	const filaFinalIndice =
		Object.entries(indice)
			.map(([periodo, nota], i, arr) => {
				const esFinal = i === arr.length - 1;
				const nombre = esFinal ? "Calificación final" : (MESES[periodo] ?? tituloClave(periodo));
				return `<tr><th scope="row">${nombre}</th>${celdaNum(nota, esFinal)}</tr>`;
			})
			.join("");

	const contenido = `
		<h3>Calificaciones parciales</h3>
		<div class="tabla-scroll">
			<table>
				<thead>
					<tr>
						<th scope="col">Asignatura</th>
						${periodos.map((p) => `<th scope="col" class="num">${MESES[p] ?? tituloClave(p)}</th>`).join("")}
					</tr>
				</thead>
				<tbody>${filasParciales}</tbody>
			</table>
		</div>

		<h3>Calificación final por asignatura</h3>
		<div class="tabla-scroll">
			<table>
				<tbody>${filasFinales}</tbody>
			</table>
		</div>

		<h3>Índice académico</h3>
		<div class="tabla-scroll">
			<table>
				<tbody>${filaFinalIndice}</tbody>
			</table>
		</div>`;

	return seccionNivel("3", expediente, "secundaria", secundaria["año_escolar"], contenido);
}

/* --- montaje ------------------------------------------------------------- */

const NIVELES = [
	["pre_primaria", "Pre primario"],
	["primaria", "Primaria"],
	["secundaria", "Secundaria"],
];

function mostrarNivel(clave) {
	for (const [id] of NIVELES) {
		const seccion = document.getElementById(id);
		if (seccion) seccion.hidden = id !== clave;
	}
	for (const enlace of $("#pestanas").querySelectorAll("a")) {
		const activo = enlace.getAttribute("href") === `#${clave}`;
		if (activo) enlace.setAttribute("aria-current", "true");
		else enlace.removeAttribute("aria-current");
	}
}

function claveDesdeHash() {
	const clave = location.hash.replace("#", "");
	return NIVELES.some(([id]) => id === clave) ? clave : "pre_primaria";
}

function renderSecciones(expediente) {
	const contenedor = $("#contenido");

	const secciones = {
		pre_primaria: renderPrePrimaria(expediente),
		primaria: renderPrimaria(expediente),
		secundaria: renderSecundaria(expediente),
	};

	const pestanas = $("#pestanas");
	for (const [clave, etiqueta] of NIVELES) {
		secciones[clave].hidden = true;
		contenedor.append(secciones[clave]);

		const enlace = nodo(`<a href="#${clave}">${etiqueta}</a>`);
		enlace.addEventListener("click", (evento) => {
			evento.preventDefault();
			history.replaceState(null, "", `#${clave}`);
			mostrarNivel(clave);
		});
		pestanas.append(enlace);
	}

	window.addEventListener("hashchange", () => mostrarNivel(claveDesdeHash()));

	pestanas.hidden = false;
	contenedor.hidden = false;
	mostrarNivel(claveDesdeHash());
}

async function iniciar() {
	try {
		const datos = await cargarDatos();
		renderEncabezado(datos[0]);
		renderSecciones(datos[0]);
	} catch (error) {
		const aviso = $("#error");
		aviso.textContent = `No fue posible mostrar el expediente: ${error.message}`;
		aviso.hidden = false;
		$("#lede").hidden = true;
	}
}

iniciar();

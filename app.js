const $ = (sel) => document.querySelector(sel);

function textoNivel(curso) {
	return curso
		.toLowerCase()
		.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
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

function renderSecciones(_expediente) {
	// Las secciones por nivel educativo llegan en feature/web-secciones.
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

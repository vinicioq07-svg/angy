// ============================================================
//  ANGY — LÓGICA DE LA APLICACIÓN
//  Prototipo visual para gestión avícola
//  Versión completa con edición de razas y logo integrado
// ============================================================

// ============================================================
//  VARIABLES GLOBALES
// ============================================================
let productosDisponibles = []; 
let consumosTactilesTemp = [];
let semanaActual = 36;
let loteActual = null;
let rolActual = 'admin';
let galponeroAsignado = null;
let _galponParaNuevoLote = null;
let _razaEnEdicion = null;
let chartsDetalleActivos = [];
let _semanaExpandida = null;
let _vistaSemanaActual = {};
let _chartError = window._chartError || false;

const diasSemana = ['Sáb 06','Dom 07','Lun 08','Mar 09','Mié 10','Jue 11','Vie 12'];
// INICIALIZACIÓN DE SUPABASE
const SUPABASE_URL = 'https://mwvswuddpqbjzpzceacf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oF-OhoAeyQPpV3r785lGjQ_ynzhqNZA';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: window.localStorage, // Guarda la sesión en el celular
    autoRefreshToken: true,
    persistSession: true,          // Mantiene la sesión activa
    detectSessionInUrl: false
  }
});
// ============================================================
//  DATOS DE EJEMPLO
// ============================================================
const semana36 = {
  saldoHInicial: 4903, saldoMInicial: 469, saldoAlimInicial: 274,
  dias: [
    { estado:'guardado', mortH:3, mortM:1, ing:145, cons:23, fer:3646, com:291, ext:13, rot:27 },
    { estado:'guardado', mortH:0, mortM:0, ing:0,   cons:23, fer:3646, com:249, ext:25, rot:34 },
    { estado:'guardado', mortH:0, mortM:0, ing:0,   cons:25, fer:0,    com:0,   ext:0,  rot:0  },
    { estado:'guardado', mortH:0, mortM:1, ing:0,   cons:24, fer:0,    com:0,   ext:0,  rot:0  },
    { estado:'hoy' },
    { estado:'futuro' },
    { estado:'futuro' },
  ]
};

function semanaVacia(saldoH, saldoM, saldoAlim){
  return { 
    saldoHInicial: saldoH, 
    saldoMInicial: saldoM, 
    saldoAlimInicial: saldoAlim,
    dias: [
      {estado:'hoy'},{estado:'futuro'},{estado:'futuro'},
      {estado:'futuro'},{estado:'futuro'},{estado:'futuro'},{estado:'futuro'}
    ] 
  };
}

const semanas = { 36: semana36 };
const registrosSimple = {};

// ============================================================
//  DATOS DE NEGOCIO
// ============================================================
// Variables dinámicas (se llenan desde Supabase)
let granjas = [];
let galpones = [];
let lotes = [];
let granjaActual = null;

registrosSimple[6] = {
  '2026-07-17': { mort:5, salida:0, ing:100, cons:5, peso:null, medicinas: [{nombre:'Vitamina AD3E', cantidad:1000}] },
  '2026-07-18': { mort:5, salida:0, ing:0, cons:6, peso:52, medicinas: [] },
  '2026-07-19': { mort:3, salida:0, ing:0, cons:7, peso:null, medicinas: [] },
  '2026-07-20': { mort:6, salida:0, ing:0, cons:8, peso:62, medicinas: [] },
  '2026-07-21': { mort:0, salida:0, ing:0, cons:9, peso:null, medicinas: [] },
  '2026-07-22': { mort:0, salida:0, ing:0, cons:9, peso:null, medicinas: [] },
  '2026-07-23': { mort:0, salida:0, ing:0, cons:9, peso:null, medicinas: [] },
};

const nombresTipo = { 
  engorde:'Engorde', 
  ponedora:'Ponedora — huevo comercial', 
  reproductora:'Reproductora — huevo fértil' 
};
let tiposCrianza = ['engorde', 'ponedora', 'reproductora'];

let catalogoMedicinas = ['Vitamina AD3E', 'Newcastle + Bronquitis', 'Antibiótico Enrofloxacina', 'Gumboro'];

let preciosMedicinas = {
  'Vitamina AD3E': { categoria:'vitamina', um:'ml', precioUnitario:0.02 },
  'Newcastle + Bronquitis': { categoria:'vacuna', um:'dosis', precioUnitario:0.01 },
  'Antibiótico Enrofloxacina': { categoria:'antibiotico', um:'ml', precioUnitario:0.02 },
  'Gumboro': { categoria:'vacuna', um:'dosis', precioUnitario:0.01 },
};

// ============================================================
//  GUÍAS DE RAZA CON TABLAS DE MANEJO REALES
// ============================================================
const guiasRaza = {
  'Ross 308': { 
    tipo:'engorde', 
    semanas: {
      1:{pesoEsperadoG:190, tempIdealC:33, mortAcumPct:0.5, consumoAcumG:150}, 
      2:{pesoEsperadoG:480, tempIdealC:29, mortAcumPct:1.0, consumoAcumG:400},
      3:{pesoEsperadoG:850, tempIdealC:26, mortAcumPct:1.5, consumoAcumG:820}, 
      4:{pesoEsperadoG:1350, tempIdealC:24, mortAcumPct:2.0, consumoAcumG:1420},
      5:{pesoEsperadoG:1950, tempIdealC:22, mortAcumPct:2.5, consumoAcumG:2200}, 
      6:{pesoEsperadoG:2550, tempIdealC:21, mortAcumPct:3.0, consumoAcumG:3150},
    }, 
    manejo: [
      { diaVida:7, producto:'Gumboro + Newcastle + Bronquitis', dosis:'Vía ocular' },
      { diaVida:14, producto:'Gumboro', dosis:'Vía oral' },
      { diaVida:18, producto:'Newcastle', dosis:'Vía oral' },
    ]
  },
  
  'Hy-Line Brown': { 
    tipo:'ponedora', 
    semanas: {
      1:{pesoEsperadoG:70}, 2:{pesoEsperadoG:120}, 3:{pesoEsperadoG:190},
      4:{pesoEsperadoG:265}, 5:{pesoEsperadoG:360}, 6:{pesoEsperadoG:460},
      7:{pesoEsperadoG:560}, 8:{pesoEsperadoG:670}, 9:{pesoEsperadoG:780},
      10:{pesoEsperadoG:890}, 11:{pesoEsperadoG:990}, 12:{pesoEsperadoG:1080},
      13:{pesoEsperadoG:1160}, 14:{pesoEsperadoG:1230}, 15:{pesoEsperadoG:1295},
      16:{pesoEsperadoG:1360}, 17:{pesoEsperadoG:1440}, 18:{pesoEsperadoG:1477, produccionPct:5},
      19:{pesoEsperadoG:1500, produccionPct:25}, 20:{pesoEsperadoG:1550, produccionPct:55},
      21:{pesoEsperadoG:1580, produccionPct:78}, 22:{pesoEsperadoG:1600, produccionPct:88}, 
      23:{pesoEsperadoG:1620, produccionPct:92}, 24:{pesoEsperadoG:1630, produccionPct:94},
    }, 
    manejo: [
      { diaVida:1, producto:'Marek + Newcastle/Bronquitis + Coccidia', dosis:'Subcutánea / Spray' },
      { diaVida:14, producto:'Newcastle + Bronquitis', dosis:'Vía ocular' },
      { diaVida:21, producto:'Gumboro', dosis:'Agua de bebida' },
      { diaVida:42, producto:'Newcastle + Bronquitis + Salmonella', dosis:'Ocular / Subcutánea' },
      { diaVida:49, producto:'Viruela Aviar', dosis:'Punción alar' },
      { diaVida:70, producto:'Newcastle + Bronquitis', dosis:'Vía ocular' },
      { diaVida:84, producto:'Salmonella Enteritidis/Typhimurium', dosis:'Intramuscular' },
      { diaVida:98, producto:'Newcastle + Bronquitis + EDS + Coriza', dosis:'Intramuscular' },
    ]
  },
  
  'Lohmann Brown': { 
    tipo:'ponedora', 
    semanas: {
      18:{pesoEsperadoG:1420, produccionPct:10}, 19:{pesoEsperadoG:1480, produccionPct:30},
      20:{pesoEsperadoG:1520, produccionPct:60}, 21:{pesoEsperadoG:1550, produccionPct:80},
      22:{pesoEsperadoG:1570, produccionPct:90}, 23:{pesoEsperadoG:1580, produccionPct:93},
      24:{pesoEsperadoG:1590, produccionPct:95},
    }, 
    manejo: [
      { diaVida:1, producto:'Marek', dosis:'Subcutánea/Intramuscular' },
      { diaVida:7, producto:'Newcastle + Bronquitis', dosis:'Spray/Ocular' },
      { diaVida:14, producto:'Gumboro', dosis:'Agua de bebida' },
      { diaVida:42, producto:'Coriza + Cólera', dosis:'Subcutánea' },
      { diaVida:56, producto:'Viruela Aviar', dosis:'Punción alar' },
      { diaVida:84, producto:'Coriza + Cólera (refuerzo)', dosis:'Subcutánea' },
      { diaVida:98, producto:'Newcastle + Bronquitis (inactivada)', dosis:'Intramuscular' },
    ]
  },
  
  'Hy-Line Brown (reproductora)': {
    tipo:'reproductora',
    semanas: {
      1:{pesoEsperadoG:70}, 2:{pesoEsperadoG:120}, 3:{pesoEsperadoG:190},
      4:{pesoEsperadoG:265}, 5:{pesoEsperadoG:360}, 6:{pesoEsperadoG:460},
      8:{pesoEsperadoG:650}, 10:{pesoEsperadoG:890}, 12:{pesoEsperadoG:1080},
      14:{pesoEsperadoG:1230}, 16:{pesoEsperadoG:1360}, 18:{pesoEsperadoG:1477},
      20:{pesoEsperadoG:1650}, 22:{pesoEsperadoG:1750}, 24:{pesoEsperadoG:1850},
    },
    manejo: [
      { diaVida:1, producto:'Marek + Newcastle/Bronquitis + Coccidia', dosis:'Subcutánea / Spray' },
      { diaVida:11, producto:'Newcastle + Bronquitis + Gumboro', dosis:'Aerosol' },
      { diaVida:15, producto:'Newcastle (inactivada) + Viruela', dosis:'Subcutánea / Punción alar' },
      { diaVida:56, producto:'Coriza + Cólera + Anemia Infecciosa', dosis:'Intramuscular/Subcutánea' },
      { diaVida:98, producto:'Viruela + Encefalomielitis + Newcastle', dosis:'Punción alar / Ocular' },
      { diaVida:126, producto:'Newcastle + Bronquitis + Reovirus (inactivada) + Coriza', dosis:'Subcutánea / Intramuscular' },
    ]
  },
};

const usuarios = [
  { id:1, nombre:'Admin Demo', rol:'admin', granjaId:null, galponId:null },
  { id:2, nombre:'Carlos (galponero)', rol:'galponero', granjaId:1, galponId:1 },
];

// ============================================================
//  SISTEMA DE TOAST
// ============================================================
function mostrarToast(mensaje, tipo = 'info', duracion = 3500){
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  
  const iconos = { info: 'ℹ️', exito: '✅', error: '❌', advertencia: '⚠️' };
  
  toast.innerHTML = `<span>${iconos[tipo] || 'ℹ️'}</span><span>${mensaje}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duracion);
}

// ============================================================
//  FUNCIONES AUXILIARES
// ============================================================
function loteVigente(galponId){ return lotes.find(l => l.galponId === galponId && !l.finalizado); }
function lotesDeGalpon(galponId){ return lotes.filter(l => l.galponId === galponId); }
function galponDeLote(lote){ return galpones.find(g => g.id === lote.galponId); }

function hoyISO(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function esFechaCalculable(fechaIngreso){
  return /^\d{4}-\d{2}-\d{2}$/.test(fechaIngreso || '');
}

function calcularSemanaDesdeIngreso(fechaIngresoISO){
  if (!fechaIngresoISO) return 0;
  const ingreso = new Date(fechaIngresoISO + 'T00:00:00');
  if (isNaN(ingreso)) return 0;
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  if (hoy < ingreso) return 0;
  const diffDias = Math.floor((hoy - ingreso) / 86400000);
  return Math.floor(diffDias / 7);
}

function semanaDeGalpon(g){
  return esFechaCalculable(g.fechaIngreso) ? calcularSemanaDesdeIngreso(g.fechaIngreso) + 1 : g.semana;
}

function fechaDelDia(fechaIngresoISO, semana, indiceDia){
  const ingreso = new Date(fechaIngresoISO + 'T00:00:00');
  const fecha = new Date(ingreso);
  fecha.setDate(ingreso.getDate() + semana * 7 + indiceDia);
  return fecha;
}

const DIAS_CORTOS = ['dom','lun','mar','mié','jué','vie','sáb'];
const MESES_CORTOS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatearFechaCorta(fecha){
  return `${DIAS_CORTOS[fecha.getDay()]} ${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}`;
}

function esHoy(fecha){
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  return fecha.getTime() === hoy.getTime();
}

function esFuturo(fecha){
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  return fecha.getTime() > hoy.getTime();
}

function opcionesCatalogoMedicinas(seleccionado){
  return catalogoMedicinas.map(p => `<option value="${p}" ${p===seleccionado?'selected':''}>${p}</option>`).join('')
    + `<option value="__otra__">+ Agregar producto nuevo...</option>`;
}

function agregarProductoAlCatalogo(nombre){
  const limpio = nombre.trim();
  if (limpio && !catalogoMedicinas.includes(limpio)) catalogoMedicinas.push(limpio);
  if (limpio && !preciosMedicinas[limpio]) preciosMedicinas[limpio] = { categoria:'medicina', um:'unid', precioUnitario:0 };
  return limpio;
}

function obtenerMortalidadSerie(lote){
  if (lote.tipo === 'reproductora'){
    const datos = semanas[lote.semana];
    return datos ? datos.dias.filter(d=>d.estado==='guardado').map(d => d.mortH + d.mortM) : [];
  } else if (esFechaCalculable(lote.fechaIngreso)){
    const entradas = registrosSimple[lote.id] || {};
    return Object.keys(entradas).sort().map(k => entradas[k].mort);
  } else {
    return [];
  }
}

function obtenerAplicacionesMedicina(lote){
  if (!esFechaCalculable(lote.fechaIngreso)) return [];
  const ingreso = new Date(lote.fechaIngreso + 'T00:00:00');
  const entradas = registrosSimple[lote.id] || {};
  const resultado = [];
  Object.keys(entradas).forEach(key => {
    const d = entradas[key];
    if (d.medicinas && d.medicinas.length){
      const fecha = new Date(key + 'T00:00:00');
      const diaVida = Math.round((fecha - ingreso) / 86400000) + 1;
      d.medicinas.forEach(med => {
        resultado.push({ diaVida, producto: med.nombre, cantidad: med.cantidad || 0 });
      });
    }
  });
  return resultado;
}

function calcularEstadoManejo(lote){
  const guia = guiasRaza[lote.raza];
  if (!guia || !guia.manejo || !guia.manejo.length || !esFechaCalculable(lote.fechaIngreso)) return [];

  const ingreso = new Date(lote.fechaIngreso + 'T00:00:00');
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const diaVidaHoy = Math.round((hoy - ingreso) / 86400000) + 1;
  const aplicaciones = obtenerAplicacionesMedicina(lote);

  return guia.manejo.map(item => {
    let mejorDiff = null, aplicacion = null;
    aplicaciones.forEach(ap => {
      const diffDias = ap.diaVida - item.diaVida;
      if (mejorDiff === null || Math.abs(diffDias) < Math.abs(mejorDiff)){ mejorDiff = diffDias; aplicacion = ap; }
    });

    let estado;
    if (aplicacion && Math.abs(mejorDiff) <= 3){
      if (mejorDiff === 0) estado = 'verde';
      else if (Math.abs(mejorDiff) === 1) estado = 'amarillo';
      else estado = 'rojo';
    } else {
      const diasVencido = diaVidaHoy - item.diaVida;
      if (diasVencido < 0) estado = 'pendiente';
      else if (diasVencido <= 1) estado = 'amarillo';
      else estado = 'rojo';
      aplicacion = null;
    }

    return { ...item, estado, aplicacion };
  });
}

function obtenerMedicinasPendientesParaDia(lote, numDia) {
  const guia = guiasRaza[lote.raza];
  if (!guia || !guia.manejo || !guia.manejo.length || !esFechaCalculable(lote.fechaIngreso)) return [];
  
  const ingreso = new Date(lote.fechaIngreso + 'T00:00:00');
  const fechaDia = new Date(ingreso);
  fechaDia.setDate(ingreso.getDate() + numDia - 1);
  const diaVida = Math.round((fechaDia - ingreso) / 86400000) + 1;
  
  const aplicaciones = obtenerAplicacionesMedicina(lote);
  
  return guia.manejo.filter(item => {
    const aplicada = aplicaciones.some(ap => 
      ap.producto === item.producto && Math.abs(ap.diaVida - diaVida) <= 2
    );
    return !aplicada && Math.abs(item.diaVida - diaVida) <= 0;
  });
}

function evaluarAlertasLote(g, mortalidadSerie){
  const alertas = [];
  const guia = guiasRaza[g.raza];
  const avesIniciales = g.tipo === 'reproductora' ? ((g.numInicialH||0) + (g.numInicialM||0)) : (g.numInicial||0);

  if (guia && avesIniciales && mortalidadSerie.length){
    const totalMuertas = mortalidadSerie.reduce((a,b)=>a+b,0);
    const mortRealPct = (totalMuertas / avesIniciales) * 100;
    const filaGuia = guia.semanas[semanaDeGalpon(g)];
    if (filaGuia && filaGuia.mortAcumPct != null && mortRealPct > filaGuia.mortAcumPct * 1.3){
      alertas.push(`Mortalidad real ${mortRealPct.toFixed(1)}% vs. guía ${filaGuia.mortAcumPct}%`);
    }
  }

  if (guia && avesIniciales && esFechaCalculable(g.fechaIngreso)){
    const entradas = registrosSimple[g.id] || {};
    const claves = Object.keys(entradas).sort();
    if (claves.length){
      let saldo = avesIniciales, ultimoGramosAve = 0;
      claves.forEach(key => {
        const d = entradas[key];
        saldo -= d.mort + (d.salida||0);
        ultimoGramosAve = saldo > 0 ? (d.cons * 1000) / saldo : 0;
      });
      const semanaNum = semanaDeGalpon(g);
      const filaGuia = guia.semanas[semanaNum];
      const filaAnterior = guia.semanas[semanaNum - 1];
      if (filaGuia && filaGuia.consumoAcumG != null){
        const incremento = filaGuia.consumoAcumG - (filaAnterior && filaAnterior.consumoAcumG != null ? filaAnterior.consumoAcumG : 0);
        const esperadoDiaG = incremento / 7;
        if (esperadoDiaG > 0 && (ultimoGramosAve > esperadoDiaG * 1.3 || ultimoGramosAve < esperadoDiaG * 0.7)){
          alertas.push(`Consumo ${Math.round(ultimoGramosAve)} g/ave/día vs. guía ${Math.round(esperadoDiaG)} g/ave/día`);
        }
      }
    }
  }

  if (guia && esFechaCalculable(g.fechaIngreso)){
    const entradas = registrosSimple[g.id] || {};
    const claves = Object.keys(entradas).sort();
    if (claves.length){
      const ultimaClave = claves[claves.length - 1];
      const ultimoDia = entradas[ultimaClave];
      const filaGuia = guia.semanas[semanaDeGalpon(g)];
      if (ultimoDia.tempMax != null && filaGuia && filaGuia.tempIdealC != null){
        const exceso = ultimoDia.tempMax - filaGuia.tempIdealC;
        if (exceso >= 4){
          const huboMortalidad = ultimoDia.mort > 0;
          alertas.push(`Posible estrés calórico: ${ultimoDia.tempMax}°C vs. ideal ${filaGuia.tempIdealC}°C`);
        }
      }
    }
  }

  const atrasados = calcularEstadoManejo(g).filter(item => item.estado === 'rojo');
  if (atrasados.length){
    alertas.push(`${atrasados.length} aplicación(es) atrasada(s): ${atrasados.map(a => a.producto).join(', ')}`);
  }

  if (guia && esFechaCalculable(g.fechaIngreso)){
    const entradas = registrosSimple[g.id] || {};
    const claves = Object.keys(entradas).sort();
    if (claves.length){
      const ultimaClave = claves[claves.length - 1];
      const ultimoDia = entradas[ultimaClave];
      const filaGuia = guia.semanas[semanaDeGalpon(g)];
      if (ultimoDia.peso != null && filaGuia && filaGuia.pesoEsperadoG != null){
        const difPct = ((ultimoDia.peso - filaGuia.pesoEsperadoG) / filaGuia.pesoEsperadoG) * 100;
        if (Math.abs(difPct) > 8){
          alertas.push(`Peso ${ultimoDia.peso}g vs. guía ${filaGuia.pesoEsperadoG}g (${difPct.toFixed(1)}%)`);
        }
      }
    }
  }

  return alertas;
}

function calcularMetricasLote(lote){
  const avesIniciales = lote.tipo === 'reproductora' ? ((lote.numInicialH||0) + (lote.numInicialM||0)) : (lote.numInicial||0);
  const mortalidadSerie = obtenerMortalidadSerie(lote);
  const totalMuertas = mortalidadSerie.reduce((a,b)=>a+b,0);
  const mortalidadPct = avesIniciales ? (totalMuertas / avesIniciales) * 100 : null;

  let consumoPromedio = null, pesoFinal = null, dias = [];
  if (esFechaCalculable(lote.fechaIngreso)){
    const entradas = registrosSimple[lote.id] || {};
    const claves = Object.keys(entradas).sort();
    dias = claves.map(k => entradas[k]);
  }

  if (dias.length){
    let saldo = avesIniciales, sumaGramos = 0, nDias = 0;
    dias.forEach(d => {
      saldo -= d.mort + (d.salida||0);
      if (saldo > 0){ sumaGramos += (d.cons*1000)/saldo; nDias++; }
      if (d.peso != null) pesoFinal = d.peso;
    });
    consumoPromedio = nDias ? Math.round(sumaGramos / nDias) : null;
  }

  const offsetSemana = esFechaCalculable(lote.fechaIngreso) ? 1 : 0;
  const duracionSemanas = lote.finalizado ? (lote.semanaFinal ?? 0) + offsetSemana : semanaDeGalpon(lote);
  return { avesIniciales, mortalidadPct, consumoPromedio, pesoFinal, duracionSemanas };
}

// ============================================================
//  NAVEGACIÓN
// ============================================================
function mostrarTab(id, el){
  document.querySelectorAll('.tab-content').forEach(t => { 
    t.classList.remove('active'); 
    t.style.display = 'none'; 
  });
  const destino = document.getElementById('tab-'+id);
  if (destino) {
    destino.classList.add('active');
    destino.style.display = 'block';
  }
  
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll(`[data-tab="${id}"]`).forEach(n => n.classList.add('active'));
}

function volverAGalpones(){
  document.body.classList.remove('modo-galponero'); // <-- LÍNEA NUEVA
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('[data-tab="lotes"]').forEach(n => n.classList.add('active'));
  mostrarTab('lotes', document.querySelector('[data-tab="lotes"]'));
}

function volverAResumenDashboard(){
  document.getElementById('panelResumenDashboard').style.display = 'block';
  document.getElementById('panelDetalleDashboard').style.display = 'none';
  chartsDetalleActivos.forEach(c => c.destroy());
  chartsDetalleActivos = [];
}

function aplicarRol(){
  // Obtenemos el rol del selector o de la sesión actual
  const selectorRol = document.getElementById('selectorRol');
  if (selectorRol && selectorRol.value) {
    rolActual = selectorRol.value;
  }
  
  const esAdmin = rolActual === 'admin';
  const esSupervisor = rolActual === 'supervisor';
  const esGalponero = rolActual === 'galponero';
  
  // ESCUDO 1: Elementos de la interfaz
  const navConfig = document.getElementById('navConfig');
  const navConfigMovil = document.getElementById('navConfigMovil');
  const btnNuevoGalpon = document.getElementById('btnNuevoGalpon');
  const btnNuevoLote = document.getElementById('btnNuevoLote');
  const labelSimular = document.getElementById('labelGalponAsignado'); // Selector de simulación

  // Ocultar configuración y creación de lotes si NO es admin
  if (navConfig) navConfig.style.display = esAdmin ? 'flex' : 'none';
  if (navConfigMovil) navConfigMovil.style.display = esAdmin ? 'flex' : 'none';
  if (btnNuevoGalpon) btnNuevoGalpon.style.display = esAdmin ? 'inline-flex' : 'none';
  if (btnNuevoLote) btnNuevoLote.style.display = esAdmin ? 'inline-flex' : 'none';

  // Ocultar el selector de "Simular Galponero" (ya que ahora el rol es real)
  if (labelSimular) labelSimular.style.display = 'none'; // Lo ocultamos para todos en producción

  // ESCUDO 2: Si es galponero y está en la pantalla de configuración, lo pateamos al Dashboard
  if (esGalponero && document.getElementById('tab-config').classList.contains('active')) {
    mostrarTab('dashboard', document.querySelector('.nav-item[data-tab="dashboard"]'));
  }

  // ESCUDO 3: Paneles de la vista de registros (Finalizar lote, Costos)
  const panelFinalizarRepro = document.getElementById('panelFinalizarRepro');
  const panelFinalizarSimple = document.getElementById('panelFinalizarSimple');
  const panelCostos = document.getElementById('panelCostosSimple');
  
  if (panelFinalizarRepro) panelFinalizarRepro.style.display = esAdmin ? 'block' : 'none';
  if (panelFinalizarSimple) panelFinalizarSimple.style.display = esAdmin ? 'block' : 'none';
  if (panelCostos) panelCostos.style.display = esAdmin ? 'block' : 'none';

  // ESCUDO 4: Limpiar paneles abiertos si cambia de rol
  if (!esAdmin){
    const panelLotesCerrados = document.getElementById('panelLotesCerrados');
    const panelNuevoLote = document.getElementById('panelNuevoLote');
    const panelNuevoGalpon = document.getElementById('panelNuevoGalpon');
    const panelNuevaRaza = document.getElementById('panelNuevaRaza');
    if (panelLotesCerrados) panelLotesCerrados.style.display = 'none';
    if (panelNuevoLote) panelNuevoLote.style.display = 'none';
    if (panelNuevoGalpon) panelNuevoGalpon.style.display = 'none';
    if (panelNuevaRaza) panelNuevaRaza.style.display = 'none';
  }

  // Actualizamos las vistas
  actualizarSelectorGranja();
  renderGridGalpones();
  if (typeof renderDashboardResumen === 'function') renderDashboardResumen();
}

function seleccionarGranja(id){
  granjaActual = granjas.find(x => x.id === id);
  loteActual = null;
  actualizarSelectorGranja();
  renderGridGalpones();
  if (typeof renderDashboardResumen === 'function'){
    volverAResumenDashboard();
    renderDashboardResumen();
  }
  volverAGalpones();
}

function actualizarSelectorGranja(){
  const cont = document.getElementById('contenedorGranja');
  if (!cont) return;
    // BLINDAJE: Si no hay granja cargada aún, mostramos un mensaje de carga
  if (!granjaActual) {
    cont.innerHTML = `<h2>Cargando granja...</h2>`;
    return;
  }
  if (rolActual === 'galponero' || granjas.length <= 1){
    cont.innerHTML = `<h2>${granjaActual.nombre}</h2>`;
  } else {
    cont.innerHTML = `<div style="position:relative; display:inline-block;">
      <select id="selectorGranja" onchange="seleccionarGranja(parseInt(this.value))"
        style="appearance:none; -webkit-appearance:none; font-family:'Fraunces',serif; font-size:22px; font-weight:600;
        color:var(--texto); border:1px solid var(--borde); background:var(--blanco); border-radius:8px;
        padding:8px 40px 8px 14px; width:auto; cursor:pointer;">
        ${granjas.map(g => `<option value="${g.id}" ${g.id===granjaActual.id?'selected':''}>${g.nombre}</option>`).join('')}
      </select>
    </div>`;
  }
}

// ============================================================
//  GALPONES Y LOTES
// ============================================================
function renderGridGalpones(){
  const grid = document.getElementById('gridGalpones');
  if (!grid) return;
  grid.innerHTML = '';
  
  // La variable 'galpones' ahora ya viene filtrada desde Supabase (solo los del usuario)
  if (galpones.length === 0){
    grid.innerHTML = '<div class="estado-vacio"><p>No tienes galpones asignados todavía. Contacta al administrador.</p></div>';
    return;
  }

  galpones.forEach(galpon => {
    const lote = loteVigente(galpon.id);
    const div = document.createElement('div');
    div.className = 'card-galpon';

    if (lote){
      const aves = lote.tipo === 'reproductora' ? `${lote.numInicialH.toLocaleString('es')} H + ${lote.numInicialM.toLocaleString('es')} M` : lote.numInicial.toLocaleString('es');
      
      // Ocultamos la alerta para el galponero (o la dejamos, pero sin que vea cosas de admin)
      const alertas = rolActual === 'admin' ? evaluarAlertasLote(lote, obtenerMortalidadSerie(lote)) : [];
      const badgeAlerta = alertas.length ? `<span class="badge-alerta" title="${alertas.join(' | ')}">⚠ Revisar (${alertas.length})</span>` : '';
      
      div.innerHTML = `<h4>${galpon.nombre} ${badgeAlerta}</h4>
        <div class="sub"><span class="pill ${lote.tipo}">${nombresTipo[lote.tipo]}</span> · Lote ${lote.numero}</div>
        <div class="sub">Raza: ${lote.raza}<br>Aves inicial: ${aves}<br>Semana ${semanaDeGalpon(lote)}</div>
        <button onclick="seleccionarLote(${lote.id})">Ir a registros →</button>`;
    } else {
      // Si no tiene lote, dependiendo del rol mostramos diferente info
      if (rolActual === 'admin') {
        div.innerHTML = `<h4>${galpon.nombre}</h4>
          <div class="sub">Sin lote activo</div>
          <button id="btnNuevoLote-${galpon.id}" class="btn-nuevo-lote" onclick="toggleFormNuevoLote(${galpon.id})">+ Iniciar nuevo lote</button>`;
      } else {
        div.innerHTML = `<h4>${galpon.nombre}</h4>
          <div class="sub">Este galpón no tiene un lote vigente.</div>`;
      }
    }
    grid.appendChild(div);
  });
}
function verHistorialGalpon(galponId){
  const galpon = galpones.find(g => g.id === galponId);
  const historial = lotesDeGalpon(galponId).slice().sort((a,b) => a.numero - b.numero);
  document.getElementById('tituloHistorialGalpon').textContent = `Historial de lotes — ${galpon.nombre}`;

  const metricas = historial.map(lote => ({ lote, m: calcularMetricasLote(lote) }));
  const compCont = document.getElementById('comparativaLotesGalpon');
  if (metricas.length < 2){
    compCont.innerHTML = '<div class="sub">Necesitas al menos 2 lotes para comparar.</div>';
    document.getElementById('contenedorChartHistorialGalpon').style.display = 'none';
  } else {
    compCont.innerHTML = `<table style="width:100%; border-collapse:collapse; font-size:13px;">
      <tr>
        <th style="text-align:left; padding:6px; color:var(--texto-secundario); font-size:11px;">Lote</th>
        <th style="text-align:left; padding:6px; color:var(--texto-secundario); font-size:11px;">Raza</th>
        <th style="text-align:left; padding:6px; color:var(--texto-secundario); font-size:11px;">Estado</th>
        <th style="text-align:right; padding:6px; color:var(--texto-secundario); font-size:11px;">Mortalidad</th>
      </tr>` +
      metricas.map(({lote, m}) => `<tr style="border-top:1px solid var(--borde);">
        <td style="padding:6px;">Lote ${lote.numero}</td>
        <td style="padding:6px;">${lote.raza}</td>
        <td style="padding:6px;">${lote.finalizado ? 'Cerrado' : 'Vigente'}</td>
        <td style="padding:6px; text-align:right;">${m.mortalidadPct != null ? m.mortalidadPct.toFixed(1)+'%' : '—'}</td>
      </tr>`).join('') + '</table>';
  }

  const cont = document.getElementById('listaCerrados');
  cont.className = '';
  cont.innerHTML = historial.slice().reverse().map(lote => {
    const aves = lote.tipo === 'reproductora' ? `${lote.numInicialH.toLocaleString('es')} H + ${lote.numInicialM.toLocaleString('es')} M` : lote.numInicial.toLocaleString('es');
    const estado = lote.finalizado ? `Cerrado en semana ${esFechaCalculable(lote.fechaIngreso) ? (lote.semanaFinal ?? 0) + 1 : (lote.semanaFinal || lote.semana)}` : 'Vigente';
    const clase = lote.finalizado ? 'cursor:pointer;' : 'color:var(--azul-principal); font-weight:500;';
    return `<div style="padding:10px 0; border-bottom:1px solid var(--borde); font-size:13px; ${clase}" ${lote.finalizado ? `onclick="verDetalleLoteCerrado(${lote.id})"` : ''}>
      <b>Lote ${lote.numero}</b> — <span class="pill ${lote.tipo}">${nombresTipo[lote.tipo]}</span> · Raza: ${lote.raza} · Aves inicial: ${aves} · ${estado}
    </div>`;
  }).join('');
  document.getElementById('panelLotesCerrados').style.display = 'block';
}

function verDetalleLoteCerrado(id){
  if (rolActual !== 'admin') return;
  const g = lotes.find(x => x.id === id);
  const galpon = galponDeLote(g);
  
  // Título dinámico
  document.getElementById('tituloDetalleCerrado').textContent = `${galpon.nombre} · Lote ${g.numero} · ${nombresTipo[g.tipo]} · Raza: ${g.raza}`;
  
  let filas = '';

  // --- CASO REPRODUCTORA (usa el modelo de semanas viejas) ---
  if (g.tipo === 'reproductora'){
    // Buscamos todas las semanas que tenga ese lote (en el prototipo solo guardamos la 36, pero acá dejamos la lógica)
    const datos = semanas[g.semanaFinal] || semanas[36];
    if (!datos){ 
      filas = '<div class="sub">No hay datos capturados para este lote.</div>'; 
    } else {
      let saldoH = datos.saldoHInicial, saldoM = datos.saldoMInicial;
      filas = `<div class="tabla-scroll"><table class="tabla-semana">
        <tr><th>Día</th><th>Fecha</th><th>Mort. H</th><th>Saldo H</th><th>Mort. M</th><th>Saldo M</th><th>Fértil</th><th>Comercial</th></tr>`;
      datos.dias.forEach((d,i) => {
        if (d.estado !== 'guardado') return;
        saldoH -= d.mortH + (d.salidaH||0); 
        saldoM -= d.mortM + (d.salidaM||0);
        const fechaTxt = esFechaCalculable(g.fechaIngreso) ? formatearFechaCorta(fechaDelDia(g.fechaIngreso, g.semanaFinal || 36, i)) : diasSemana[i];
        filas += `<tr>
          <td>${fechaTxt}</td>
          <td>Día ${i+1}</td>
          <td>${d.mortH}</td><td>${saldoH.toLocaleString('es')}</td>
          <td>${d.mortM}</td><td>${saldoM.toLocaleString('es')}</td>
          <td>${d.fer}</td><td>${d.com}</td>
        </tr>`;
      });
      filas += '</table></div>';
    }
  } 
  // --- CASO ENGORDE / PONEDORA (usa registrosSimple con fechas ISO) ---
  else if (esFechaCalculable(g.fechaIngreso)){
    const entradas = registrosSimple[g.id] || {};
    const claves = Object.keys(entradas).sort(); // Ordena por fecha
    
    if (claves.length === 0){ 
      filas = '<div class="sub">No hay datos capturados para este lote.</div>'; 
    } else {
      let saldo = g.numInicial;
      // Cabecera de la tabla
      filas = `<div class="tabla-scroll"><table class="tabla-semana">
        <tr>
          <th>Fecha</th><th>Mort.</th><th>Salida</th><th>Saldo aves</th>
          <th>Ing. alim</th><th>Cons. alim</th><th>Peso (g)</th><th>Medicinas</th>
        </tr>`;
      
      // Recorremos TODOS los días guardados
      claves.forEach(key => {
        const d = entradas[key];
        saldo -= d.mort + (d.salida||0);
        
        let medHtml = '—';
        if (d.medicinas && d.medicinas.length) {
          medHtml = d.medicinas.map(m => `<span class="med-tag">${m.nombre} <span class="med-cant">${m.cantidad||0}</span></span>`).join(' ');
        }

        filas += `<tr>
          <td>${formatearFechaCorta(new Date(key+'T00:00:00'))}</td>
          <td>${d.mort}</td>
          <td>${d.salida||0}</td>
          <td>${saldo.toLocaleString('es')}</td>
          <td>${d.ing||0} kg</td>
          <td>${d.cons||0} kg</td>
          <td>${d.peso != null ? d.peso+' g' : '—'}</td>
          <td>${medHtml}</td>
        </tr>`;
      });
      filas += '</table></div>';
    }
  }

  document.getElementById('contenidoDetalleCerrado').innerHTML = filas;
  document.getElementById('panelDetalleCerrado').style.display = 'block';
}

function finalizarLote(){
  if (!loteActual) return;
  if (!confirm('¿Finalizar este lote? Ya no se podrá capturar ni editar nada más.')) return;
  loteActual.finalizado = true;
  loteActual.semanaFinal = semanaActual;
  renderGridGalpones();
  volverAGalpones();
  mostrarToast('Lote finalizado. Pasó al historial de este galpón.', 'exito');
}
// ============================================================
//  CARGAR REGISTROS DE UN LOTE DESDE SUPABASE
// ============================================================
async function cargarRegistrosDelLote(loteId) {
  try {
    // 1. Vamos a buscar a Supabase los registros de ese lote
    const { data, error } = await supabaseClient
      .from('registros_diarios')
      .select('*')
      .eq('lote_id', loteId);

    if (error) throw error;

    // 2. Vaciamos los datos viejos del lote para que no se mezclen
    registrosSimple[loteId] = {};

    // 3. Formateamos los datos como los espera nuestra app
    data.forEach(reg => {
      // Convertimos la fecha de Supabase (YYYY-MM-DD) a nuestro formato
      registrosSimple[loteId][reg.fecha] = {
        mort: (reg.mortalidad_h || 0) + (reg.mortalidad_m || 0),
        mortH: reg.mortalidad_h || 0,
        mortM: reg.mortalidad_m || 0,
        cons: (reg.consumo_alimento_a || 0) + (reg.consumo_alimento_b || 0),
        cons2: reg.consumo_alimento_b || 0,
        peso: reg.peso_promedio_g,
        tempMax: reg.temp_max_c,
        humedad: reg.humedad_pct,
        postura: (reg.huevo_comercial || 0) + (reg.huevo_fertil || 0) + (reg.huevo_extra || 0) + (reg.huevo_roto || 0),
        huevoComercial: reg.huevo_comercial || 0,
        huevoFertil: reg.huevo_fertil || 0,
        huevoExtra: reg.huevo_extra || 0,
        huevoRoto: reg.huevo_roto || 0,
        medicinas: [] // Por ahora vacío, luego lo conectamos
      };
    });

    console.log(`Registros cargados para el lote ${loteId}:`, registrosSimple[loteId]);

  } catch (err) {
    console.error("Error al cargar registros del lote:", err);
    mostrarToast('Error al cargar el historial del lote.', 'error');
  }
}
async function seleccionarLote(id){
  const g = lotes.find(x => x.id === id);
  const galpon = galponDeLote(g);

  if (g.finalizado){
    if (rolActual === 'admin') verDetalleLoteCerrado(id);
    return;
  }
// 🔥 NUEVA LÍNEA: Traemos los datos reales de la nube antes de mostrar la pantalla
  await cargarRegistrosDelLote(id);
  loteActual = g;
  semanaActual = semanaDeGalpon(g);
  actualizarEncabezados();

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('[data-tab="lotes"]').forEach(n => n.classList.add('active'));
  mostrarTab('registros', document.querySelector('[data-tab="lotes"]'));

  const esRepro = g.tipo === 'reproductora';
  document.getElementById('modoReproductora').style.display = 'none';
  document.getElementById('modoSimple').style.display = 'block';

  const aves = esRepro ? `${g.numInicialH.toLocaleString('es')} H + ${g.numInicialM.toLocaleString('es')} M` : `${g.numInicial.toLocaleString('es')} aves`;
  const offsetSemana = esFechaCalculable(g.fechaIngreso) ? 1 : 0;
  document.getElementById('infoLote').innerHTML = `${galpon.nombre} · Lote ${g.numero} · ${nombresTipo[g.tipo]} · Raza: ${g.raza} · Ingreso: ${g.fechaIngreso} · Aves inicial: ${aves} · <b>Semana <span class="semana-num">${semanaActual + offsetSemana}</span></b>`;

  // --- LÓGICA PARA MOSTRAR U OCULTAR LA VISTA TÁCTIL ---
  const vistaTactil = document.getElementById('vistaGalponeroTactil');
  const contenedorBotones = document.getElementById('botonesAccionTactil');
  const tablaSemanas = document.getElementById('semanasContainer');

  if (rolActual === 'galponero') {
    if (tablaSemanas) tablaSemanas.style.display = 'none';
    if (contenedorBotones) contenedorBotones.style.display = 'flex';
    inicializarVistaTactil();
  } else {
    if (vistaTactil) vistaTactil.style.display = 'none';
    if (contenedorBotones) contenedorBotones.style.display = 'none';
    if (tablaSemanas) tablaSemanas.style.display = 'block';
  }

  // Aseguramos que si es reproductora, el título de la vista simple se actualice
  if (esRepro) {
    document.getElementById('loteNombreTituloSimple').textContent = `${galpon.nombre} — Lote ${g.numero} (${nombresTipo[g.tipo]})`;
    renderizarSemana(); // La tabla de papel para el admin
  } else {
    document.getElementById('loteNombreTituloSimple').textContent = `${galpon.nombre} — Lote ${g.numero} (${nombresTipo[g.tipo]})`;
    renderizarSemanas(); // La tabla de papel para engorde/ponedora
  }
}

  //if (esRepro){
    //document.getElementById('loteNombreTitulo').textContent = `${galpon.nombre} — Lote ${g.numero} (reproductor)`;
    //renderizarSemana();//
  //} else {
    //document.getElementById('loteNombreTituloSimple').textContent = `${galpon.nombre} — Lote ${g.numero} (${nombresTipo[g.tipo]})`;
    //renderizarSemanas();//
  //}//


function actualizarEncabezados(){
  const offset = (loteActual && esFechaCalculable(loteActual.fechaIngreso)) ? 1 : 0;
  document.querySelectorAll('.semana-num').forEach(el => el.textContent = semanaActual + offset);
}

// ============================================================
//  TOGGLES DE FORMULARIOS
// ============================================================
function toggleFormNuevoGalpon(){
  if (rolActual !== 'admin') return;
  const panel = document.getElementById('panelNuevoGalpon');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  document.getElementById('ngNombre').value = '';
}

function crearGalpon(){
  const nombre = document.getElementById('ngNombre').value.trim();
  if (!nombre){ mostrarToast('Ponle un nombre al galpón.', 'advertencia'); return; }
  galpones.push({ id: Date.now(), granjaId: granjaActual.id, nombre });
  document.getElementById('panelNuevoGalpon').style.display = 'none';
  renderGridGalpones();
  mostrarToast(`Galpón "${nombre}" agregado.`, 'exito');
}

function galponesDisponibles(){
  return galpones.filter(g => g.granjaId === granjaActual.id && !loteVigente(g.id));
}

function actualizarSelectRazas(){
  const tipo = document.getElementById('nlTipo').value;
  const select = document.getElementById('nlRaza');
  const razasDelTipo = Object.keys(guiasRaza).filter(nombre => guiasRaza[nombre].tipo === tipo);
  select.innerHTML = razasDelTipo.map(r => `<option value="${r}">${r}</option>`).join('')
    + `<option value="__otra__">Otra raza...</option>`;
  document.getElementById('nlRazaOtra').style.display = 'none';
}

function toggleFormNuevoLote(galponId){
  if (rolActual !== 'admin') return;
  const panel = document.getElementById('panelNuevoLote');
  const abrir = panel.style.display === 'none';
  panel.style.display = abrir ? 'block' : 'none';
  if (!abrir) return;

  actualizarSelectRazas();
  _galponParaNuevoLote = galponId || null;
  const campoSelect = document.getElementById('campoSelectGalpon');
  const campoNombre = document.getElementById('campoNombreGalpon');

  if (_galponParaNuevoLote){
    const galpon = galpones.find(g => g.id === _galponParaNuevoLote);
    const numeroSiguiente = lotesDeGalpon(galpon.id).length + 1;
    document.getElementById('tituloNuevoLote').textContent = `Iniciar lote ${numeroSiguiente} — ${galpon.nombre}`;
    campoSelect.style.display = 'none';
    campoNombre.style.display = 'block';
    document.getElementById('nlGalpon').value = galpon.nombre;
  } else {
    document.getElementById('tituloNuevoLote').textContent = 'Iniciar lote nuevo';
    campoNombre.style.display = 'none';
    campoSelect.style.display = 'block';
    const disponibles = galponesDisponibles();
    const select = document.getElementById('nlGalponId');
    if (disponibles.length === 0){
      select.innerHTML = '<option value="">No hay galpones disponibles</option>';
      mostrarToast('No hay galpones libres.', 'advertencia');
    } else {
      select.innerHTML = disponibles.map(g => `<option value="${g.id}">${g.nombre}</option>`).join('');
    }
  }
}

function actualizarCamposNuevoLote(){
  const tipo = document.getElementById('nlTipo').value;
  const esRepro = tipo === 'reproductora';
  document.getElementById('nlAvesSimple').style.display = esRepro ? 'none' : 'flex';
  document.getElementById('nlAvesDoble').style.display = esRepro ? 'flex' : 'none';
  actualizarSelectRazas();
}

async function crearLote(){
  const tipo = document.getElementById('nlTipo').value;
  const esRepro = tipo === 'reproductora';
  const fechaIngreso = document.getElementById('nlFecha').value || hoyISO();

  // Obtenemos el ID del galpón
  let galponId;
  if (_galponParaNuevoLote) {
    galponId = _galponParaNuevoLote;
  } else {
    const selectVal = document.getElementById('nlGalponId').value;
    if (!selectVal) { mostrarToast('Elige un galpón primero.', 'advertencia'); return; }
    galponId = parseInt(selectVal);
  }

  // Obtenemos la Raza seleccionada
  const razaSeleccionada = document.getElementById('nlRaza').value;
  if (razaSeleccionada === '__otra__') {
    mostrarToast('Por favor, selecciona una raza de la lista para el prototipo.', 'advertencia');
    return; // En el futuro, podríamos crear la raza al vuelo, pero por ahora pedimos que elijan una.
  }

  // Capturamos los números de aves
  let numH = 0, numM = 0;
  if (esRepro) {
    numH = parseFloat(document.getElementById('nlNumHembras').value) || 0;
    numM = parseFloat(document.getElementById('nlNumMachos').value) || 0;
  } else {
    numH = parseFloat(document.getElementById('nlNumAves').value) || 0;
  }

  // Calculamos el número de lote (cuántos lotes tiene ese galpón)
  // Para el prototipo, simplemente le sumamos 1 al total de lotes actuales
  const numeroLote = lotes.filter(l => l.galponId === galponId).length + 1;

  // Buscamos el ID de la raza en Supabase
  try {
    const { data: razaData, error: razaError } = await supabaseClient
      .from('razas')
      .select('id')
      .eq('nombre', razaSeleccionada)
      .single();
      
    if (razaError || !razaData) {
      mostrarToast('Error: La raza no existe en la base de datos.', 'error');
      return;
    }

    // Insertamos el lote en Supabase
    const { data, error } = await supabaseClient
      .from('lotes')
      .insert([{
        galpon_id: galponId,
        raza_id: razaData.id,
        numero_lote: numeroLote,
        fecha_ingreso: fechaIngreso,
        aves_iniciales_h: numH,
        aves_iniciales_m: numM,
        finalizado: false
      }])
      .select();

    if (error) throw error;

    mostrarToast(`Lote ${numeroLote} creado y guardado en la nube.`, 'exito');
    
    // Recargamos los datos desde Supabase para que aparezca el lote nuevo
    await cargarDatosDesdeNube();
    
    document.getElementById('panelNuevoLote').style.display = 'none';
    
    // Si se creó correctamente, abrimos el lote
    if (data && data.length > 0) {
      seleccionarLote(data[0].id);
    }

  } catch (err) {
    console.error("Error creando lote:", err);
    mostrarToast('No se pudo crear el lote en la nube. Revisá la consola.', 'error');
  }
}

// ============================================================
//  REPRODUCTORAS
// ============================================================
function renderizarSemana(){
  const g = loteActual;
  const datos = semanas[semanaActual];
  const cuerpo = document.getElementById('filasSemana');
  if (!cuerpo || !datos) return;
  cuerpo.innerHTML = '';
  let saldoH = datos.saldoHInicial, saldoM = datos.saldoMInicial, saldoAlim = datos.saldoAlimInicial;
  let totMortH=0, totMortM=0, totIng=0, totCons=0, totFer=0, totCom=0, totExt=0, totRot=0;
  let hayHoyPendiente = false;
  const conFecha = g && esFechaCalculable(g.fechaIngreso);

  datos.dias.forEach((d, i) => {
    const tr = document.createElement('tr');
    const diaTxt = conFecha ? formatearFechaCorta(fechaDelDia(g.fechaIngreso, semanaActual, i)) : diasSemana[i];
    if (d.estado === 'guardado'){
      saldoH -= d.mortH + (d.salidaH||0); saldoM -= d.mortM + (d.salidaM||0); saldoAlim += d.ing - d.cons;
      const totalHuevosDia = d.fer + d.com + d.ext + d.rot;
      const pct = saldoH > 0 ? ((totalHuevosDia/saldoH)*100).toFixed(1)+'%' : '—';
      tr.className = 'fila-bloqueada';
      tr.innerHTML = `<td><span class="dia-label">🔒 ${diaTxt}</span></td>
        <td>${d.mortH}</td><td>${saldoH.toLocaleString('es')}</td><td>${d.mortM}</td><td>${saldoM.toLocaleString('es')}</td>
        <td>${d.ing}</td><td>${d.cons}</td><td>${saldoAlim.toLocaleString('es')}</td>
        <td>${d.fer}</td><td>${d.com}</td><td>${d.ext}</td><td>${d.rot}</td><td>${totalHuevosDia}</td><td>${pct}</td>`;
      totMortH+=d.mortH; totMortM+=d.mortM; totIng+=d.ing; totCons+=d.cons;
      totFer+=d.fer; totCom+=d.com; totExt+=d.ext; totRot+=d.rot;
    } else if (d.estado === 'hoy'){
      const fecha = conFecha ? fechaDelDia(g.fechaIngreso, semanaActual, i) : null;
      const bloqueadoPorFecha = conFecha && esFuturo(fecha);
      if (bloqueadoPorFecha){
        tr.className = 'fila-futuro';
        tr.innerHTML = `<td>${diaTxt}</td><td colspan="13">Aún no llega esta fecha</td>`;
      } else {
        hayHoyPendiente = true;
        const etiqueta = conFecha && !esHoy(fecha) ? 'ATRASADO' : 'HOY';
        tr.className = 'fila-hoy';
        tr.innerHTML = `<td>${diaTxt} — ${etiqueta}</td><td colspan="13">Pendiente de capturar — usa el formulario de abajo</td>`;
      }
    } else {
      tr.className = 'fila-futuro';
      tr.innerHTML = `<td>${diaTxt}</td>` + '<td>—</td>'.repeat(13);
    }
    cuerpo.appendChild(tr);
  });

  document.getElementById('totMortH').textContent = totMortH;
  document.getElementById('totMortM').textContent = totMortM;
  document.getElementById('totIng').textContent = totIng.toLocaleString('es');
  document.getElementById('totCons').textContent = totCons.toLocaleString('es');
  document.getElementById('totFer').textContent = totFer.toLocaleString('es');
  document.getElementById('totCom').textContent = totCom.toLocaleString('es');
  document.getElementById('totExt').textContent = totExt.toLocaleString('es');
  document.getElementById('totRot').textContent = totRot.toLocaleString('es');
  const totalHuevosSem = totFer+totCom+totExt+totRot;
  document.getElementById('totHuevosSem').textContent = totalHuevosSem.toLocaleString('es');
  document.getElementById('pctSem').textContent = saldoH > 0 ? ((totalHuevosSem/saldoH)*100).toFixed(1)+'%' : '—';

  document.getElementById('panelHoy').style.display = hayHoyPendiente ? 'block' : 'none';
  document.getElementById('formHoy').style.display = 'none';
  document.getElementById('btnAbrirHoy').style.display = 'inline-flex';

  window._saldoHActual = saldoH;
  window._saldoMActual = saldoM;
  window._saldoAlimActual = saldoAlim;
}

function abrirFormHoy(){
  document.getElementById('formHoy').style.display = 'block';
  document.getElementById('btnAbrirHoy').style.display = 'none';
  calcular();
}

function guardarHoy(){
  const mortH = [...document.querySelectorAll('.mortH')].reduce((s,i)=> s + (parseFloat(i.value)||0), 0);
  const mortM = [...document.querySelectorAll('.mortM')].reduce((s,i)=> s + (parseFloat(i.value)||0), 0);
  const salidaH = parseFloat(document.getElementById('salidaH').value) || 0;
  const salidaM = parseFloat(document.getElementById('salidaM').value) || 0;
  const ing = parseFloat(document.getElementById('ingAlim').value) || 0;
  const cons = parseFloat(document.getElementById('consAlim').value) || 0;
  const fer = parseFloat(document.getElementById('fer').value) || 0;
  const com = parseFloat(document.getElementById('com').value) || 0;
  const ext = parseFloat(document.getElementById('ext').value) || 0;
  const rot = parseFloat(document.getElementById('rot').value) || 0;

  const datos = semanas[semanaActual];
  const idx = datos.dias.findIndex(d => d.estado === 'hoy');
  datos.dias[idx] = { estado:'guardado', mortH, mortM, salidaH, salidaM, ing, cons, fer, com, ext, rot };
  if (idx + 1 < datos.dias.length) datos.dias[idx+1].estado = 'hoy';

  renderizarSemana();
  mostrarToast('Registro guardado y bloqueado.', 'exito');
}

function cambiarSemana(delta){
  const g = loteActual;
  if (g && g.tipo !== 'reproductora') return;
  const destino = semanaActual + delta;
  if (destino === 37 && !semanas[37]){
    semanas[37] = semanaVacia(window._saldoHActual, window._saldoMActual, window._saldoAlimActual);
    semanaActual = 37;
  } else if (semanas[destino]){
    semanaActual = destino;
  } else {
    mostrarToast('No hay más semanas.', 'info');
    return;
  }
  actualizarEncabezados();
  renderizarSemana();
}

function calcular(){
  let totalSaldoH = 0, totalSaldoM = 0;

  document.querySelectorAll('#tablaSeccionesHoy tr').forEach(fila => {
    const inputH = fila.querySelector('.mortH');
    const inputM = fila.querySelector('.mortM');
    if (!inputH || !inputM) return;
    const saldoAntH = parseFloat(inputH.dataset.saldoant) || 0;
    const mortH = parseFloat(inputH.value) || 0;
    const saldoH = saldoAntH - mortH;
    const celdaH = fila.querySelector('.saldoH');
    if (celdaH) celdaH.textContent = saldoH.toLocaleString('es');
    totalSaldoH += saldoH;

    const saldoAntM = parseFloat(inputM.dataset.saldoant) || 0;
    const mortM = parseFloat(inputM.value) || 0;
    const saldoM = saldoAntM - mortM;
    const celdaM = fila.querySelector('.saldoM');
    if (celdaM) celdaM.textContent = saldoM.toLocaleString('es');
    totalSaldoM += saldoM;
  });

  const totalSaldoHEl = document.getElementById('totalSaldoH');
  const totalSaldoMEl = document.getElementById('totalSaldoM');
  if (totalSaldoHEl) totalSaldoHEl.textContent = totalSaldoH.toLocaleString('es');
  if (totalSaldoMEl) totalSaldoMEl.textContent = totalSaldoM.toLocaleString('es');

  const saldoAnteriorAlim = window._saldoAlimActual || 0;
  const ing = parseFloat(document.getElementById('ingAlim')?.value) || 0;
  const cons = parseFloat(document.getElementById('consAlim')?.value) || 0;
  const saldoAlimEl = document.getElementById('saldoAlim');
  if (saldoAlimEl) saldoAlimEl.value = (saldoAnteriorAlim + ing - cons).toLocaleString('es') + ' kg';

  const fer = parseFloat(document.getElementById('fer')?.value) || 0;
  const com = parseFloat(document.getElementById('com')?.value) || 0;
  const ext = parseFloat(document.getElementById('ext')?.value) || 0;
  const rot = parseFloat(document.getElementById('rot')?.value) || 0;
  const total = fer + com + ext + rot;
  const totalHuevosEl = document.getElementById('totalHuevos');
  const pctHuevosEl = document.getElementById('pctHuevos');
  if (totalHuevosEl) totalHuevosEl.value = total.toLocaleString('es');
  const pct = totalSaldoH > 0 ? ((total / totalSaldoH) * 100).toFixed(1) : '0.0';
  if (pctHuevosEl) pctHuevosEl.value = pct + '%';
}
// ============================================================
//  MODO SIMPLE - VISTA DE SEMANAS COLAPSABLES
// ============================================================
function renderizarSemanas() {
  const g = loteActual;
  if (!esFechaCalculable(g.fechaIngreso)) return;
  renderCalendarioManejo(g);

  const container = document.getElementById('semanasContainer');
  if (!container) return;
  container.innerHTML = '';

  const ingreso = new Date(g.fechaIngreso + 'T00:00:00');
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const diasTotales = Math.max(0, Math.floor((hoy - ingreso) / 86400000) + 1);
  const semanasTotales = Math.max(1, Math.ceil(diasTotales / 7));
  const semanasMostrar = Math.max(semanasTotales, 2);

  let totalMortGlobal = 0;
  let totalSalidaGlobal = 0;
  let totalIngGlobal = 0;
  let totalConsGlobal = 0;
  let saldoAvesGlobal = g.numInicial;
  let saldoAlimGlobal = 0;

  for (let s = 0; s < semanasMostrar; s++) {
    const semanaNum = s + 1;
    const entradas = registrosSimple[g.id] || {};
    
    let saldoAvesSemana = saldoAvesGlobal;
    let saldoAlimSemana = saldoAlimGlobal;
    let totalMortSemana = 0;
    let totalSalidaSemana = 0;
    let totalIngSemana = 0;
    let totalConsSemana = 0;
    let ultimoPeso = null;
    let hayPendiente = false;
    
    const diasSemanaArr = [];
    
    for (let d = 0; d < 7; d++) {
      const numDia = s * 7 + d + 1;
      const fecha = new Date(ingreso);
      fecha.setDate(ingreso.getDate() + numDia - 1);
      const key = fecha.getFullYear() + '-' + String(fecha.getMonth()+1).padStart(2,'0') + '-' + String(fecha.getDate()).padStart(2,'0');
      const fechaTxt = formatearFechaCorta(fecha);
      
      let estado = 'futuro';
      let data = null;
      
      if (entradas[key]) {
        estado = 'guardado';
        data = entradas[key];
        totalMortSemana += data.mort || 0;
        totalSalidaSemana += data.salida || 0;
        totalIngSemana += data.ing || 0;
        totalConsSemana += data.cons || 0;
        saldoAvesSemana -= data.mort + (data.salida||0);
        saldoAlimSemana += data.ing - data.cons;
        if (data.peso != null) ultimoPeso = data.peso;
      } else if (fecha > hoy) {
        estado = 'futuro';
      } else {
        estado = 'atrasado';
        if (fecha.getTime() === hoy.getTime()) estado = 'hoy';
        hayPendiente = true;
      }
      
      diasSemanaArr.push({
        numDia,
        fecha,
        fechaTxt,
        key,
        estado,
        data,
        saldoAcumulado: saldoAvesSemana,
        saldoAlimAcumulado: saldoAlimSemana
      });
    }
    
    totalMortGlobal += totalMortSemana;
    totalSalidaGlobal += totalSalidaSemana;
    totalIngGlobal += totalIngSemana;
    totalConsGlobal += totalConsSemana;
    saldoAvesGlobal = saldoAvesSemana;
    saldoAlimGlobal = saldoAlimSemana;
    
    let badgeClase = 'completa';
    let badgeTexto = 'Completa';
    if (hayPendiente) {
      badgeClase = 'pendiente';
      badgeTexto = 'Pendiente';
    }
    if (diasSemanaArr.every(d => d.estado === 'futuro')) {
      badgeClase = 'futura';
      badgeTexto = 'Próxima';
    }
    
    const semanaItem = document.createElement('div');
    semanaItem.className = 'semana-item';
    if (_semanaExpandida === semanaNum) semanaItem.classList.add('expandida');
    
    const pesoDisplay = ultimoPeso !== null ? ultimoPeso : '—';
    const vistaActual = _vistaSemanaActual[semanaNum] || 'tabla';
    
    semanaItem.innerHTML = `
      <div class="semana-header" onclick="toggleSemana(${semanaNum})">
        <span class="semana-titulo">Semana ${semanaNum}</span>
        <div class="semana-resumen">
          <div class="col">
            <span class="label">Mortalidad</span>
            <span class="valor">${totalMortSemana}</span>
          </div>
          <div class="col">
            <span class="label">Salida/Venta</span>
            <span class="valor">${totalSalidaSemana}</span>
          </div>
          <div class="col">
            <span class="label">Saldo aves</span>
            <span class="valor destacado">${saldoAvesSemana}</span>
          </div>
          <div class="col">
            <span class="label">Ing. Alim</span>
            <span class="valor">${totalIngSemana}</span>
          </div>
          <div class="col">
            <span class="label">Cons. Alim</span>
            <span class="valor">${totalConsSemana}</span>
          </div>
          <div class="col">
            <span class="label">Peso</span>
            <span class="valor">${pesoDisplay}</span>
          </div>
        </div>
        <span class="semana-badge ${badgeClase}">${badgeTexto}</span>
        <span class="flecha">▼</span>
      </div>
      <div class="semana-contenido">
        <div class="sub">
          <span>${diasSemanaArr.length} días · ${diasSemanaArr.filter(d=>d.estado==='guardado').length} registrados</span>
          <button class="toggle-vista-semana" onclick="cambiarVistaSemana(${semanaNum}, event)">${vistaActual === 'tabla' ? '📇 Ver tarjetas' : '📊 Ver tabla'}</button>
        </div>
        <div class="tabla-scroll">
          <div id="semana-${semanaNum}-contenido"></div>
        </div>
      </div>
    `;
    
    container.appendChild(semanaItem);
    
    const contenidoDiv = semanaItem.querySelector(`#semana-${semanaNum}-contenido`);
    if (vistaActual === 'tabla') {
      renderSemanaTabla(contenidoDiv, diasSemanaArr, g);
    } else {
      renderSemanaTarjetas(contenidoDiv, diasSemanaArr, g);
    }
  }
  
  const footerDiv = document.createElement('div');
  footerDiv.className = 'totales-footer';
  footerDiv.innerHTML = `
    <div class="col"><span class="label">TOTAL</span><span class="valor" style="font-size:13px;">—</span></div>
    <div class="col"><span class="label">Mortalidad</span><span class="valor">${totalMortGlobal}</span></div>
    <div class="col"><span class="label">Salida/Venta</span><span class="valor">${totalSalidaGlobal}</span></div>
    <div class="col"><span class="label">Saldo aves</span><span class="valor">${saldoAvesGlobal}</span></div>
    <div class="col"><span class="label">Ing. Alim</span><span class="valor">${totalIngGlobal}</span></div>
    <div class="col"><span class="label">Cons. Alim</span><span class="valor">${totalConsGlobal}</span></div>
    <div class="col"><span class="label">Peso</span><span class="valor">—</span></div>
  `;
  container.appendChild(footerDiv);
}

function renderSemanaTabla(container, dias, g) {
  const esPonedora = g.tipo === 'ponedora';
  let html = `
    <table class="tabla-semana">
      <tr>
        <th>Día</th>
        <th>Fecha</th>
        <th>Mortalidad</th>
        <th>Salida</th>
        <th>Saldo aves</th>
        <th>Ing. alim</th>
        <th>Cons. alim</th>
        <th>Saldo alim</th>
        <th>Peso (g)</th>
        ${esPonedora ? '<th>Postura</th><th>%</th>' : ''}
        <th>Medicina</th>
      </tr>
  `;
  
  let totMort=0, totSalida=0, totIng=0, totCons=0;
  
  dias.forEach(d => {
    if (d.estado === 'guardado' && d.data) {
      let medHtml = '—';
      if (d.data.medicinas && d.data.medicinas.length) {
        medHtml = d.data.medicinas.map(m => 
          `<span class="med-tag">${m.nombre} <span class="med-cant">${m.cantidad||0}</span></span>`
        ).join(' ');
      }
      const pct = esPonedora && d.saldoAcumulado > 0 ? ((d.data.postura/d.saldoAcumulado)*100).toFixed(1)+'%' : '—';
      html += `<tr class="fila-bloqueada">
        <td><span class="dia-label">☑ Día ${d.numDia}</span></td>
        <td>${d.fechaTxt}</td>
        <td>${d.data.mort}</td>
        <td>${d.data.salida||0}</td>
        <td>${d.saldoAcumulado.toLocaleString('es')}</td>
        <td>${d.data.ing||0}</td>
        <td>${d.data.cons||0}</td>
        <td>${d.saldoAlimAcumulado !== undefined ? d.saldoAlimAcumulado + ' kg' : '0 kg'}</td>
        <td>${d.data.peso ? d.data.peso+' g' : '—'}</td>
        ${esPonedora ? `<td>${d.data.postura||0}</td><td>${pct}</td>` : ''}
        <td>${medHtml}</td>
      </tr>`;
      totMort += d.data.mort || 0;
      totSalida += d.data.salida || 0;
      totIng += d.data.ing || 0;
      totCons += d.data.cons || 0;
    } else if (d.estado === 'hoy' || d.estado === 'atrasado') {
      html += `<tr class="fila-hoy" onclick="abrirModalEdicion(${d.numDia}, '${d.key}')">
        <td>${d.estado === 'hoy' ? '🔽' : '⚠️'} Día ${d.numDia}</td>
        <td>${d.fechaTxt}</td>
        <td colspan="${8 + (esPonedora ? 2 : 0)}">📝 Haz clic para registrar</td>
      </tr>`;
    } else {
      html += `<tr class="fila-futuro">
        <td>📅 Día ${d.numDia}</td>
        <td>${d.fechaTxt}</td>
        <td colspan="${8 + (esPonedora ? 2 : 0)}">—</td>
      </tr>`;
    }
  });
  
  html += `
      <tr class="fila-total">
        <td>TOTAL</td>
        <td></td>
        <td>${totMort}</td>
        <td>${totSalida}</td>
        <td></td>
        <td>${totIng}</td>
        <td>${totCons}</td>
        <td></td>
        <td></td>
        ${esPonedora ? '<td></td><td></td>' : ''}
        <td></td>
      </tr>
    </table>
  `;
  
  container.innerHTML = html;
}

function renderSemanaTarjetas(container, dias, g) {
  const esPonedora = g.tipo === 'ponedora';
  let html = '<div class="registros-grid">';
  
  dias.forEach(d => {
    if (d.estado === 'guardado' && d.data) {
      let medHtml = '—';
      if (d.data.medicinas && d.data.medicinas.length) {
        medHtml = d.data.medicinas.map(m => 
          `<span class="med-tag">${m.nombre} <span class="cant">${m.cantidad||0}</span></span>`
        ).join(' ');
      }
      const pct = esPonedora && d.saldoAcumulado > 0 ? ((d.data.postura/d.saldoAcumulado)*100).toFixed(1)+'%' : '—';
      
      html += `
        <div class="registro-card">
          <div class="card-header">
            <span class="dia">📌 Día ${d.numDia}</span>
            <span class="fecha">${d.fechaTxt}</span>
          </div>
          <div class="card-body">
            <div class="item"><span class="label">Mortalidad</span><span class="value">${d.data.mort}</span></div>
            <div class="item"><span class="label">Salida</span><span class="value">${d.data.salida||0}</span></div>
            <div class="item"><span class="label">Saldo aves</span><span class="value destacado">${d.saldoAcumulado.toLocaleString('es')}</span></div>
            <div class="item"><span class="label">Saldo alim</span><span class="value">${d.saldoAlimAcumulado !== undefined ? d.saldoAlimAcumulado + ' kg' : '0 kg'}</span></div>
            <div class="item"><span class="label">Ing. alim</span><span class="value">${d.data.ing||0} kg</span></div>
            <div class="item"><span class="label">Cons. alim</span><span class="value">${d.data.cons||0} kg</span></div>
            <div class="item"><span class="label">Peso</span><span class="value">${d.data.peso ? d.data.peso+' g' : '—'}</span></div>
            ${esPonedora ? `
              <div class="item"><span class="label">Postura</span><span class="value">${d.data.postura||0}</span></div>
              <div class="item"><span class="label">% Producción</span><span class="value">${pct}</span></div>
            ` : ''}
          </div>
          ${d.data.medicinas && d.data.medicinas.length ? `<div class="medicinas">${medHtml}</div>` : ''}
          <div class="card-footer"><span>🔒 Guardado</span></div>
        </div>
      `;
    } else if (d.estado === 'hoy') {
      html += `
        <div class="registro-card hoy" onclick="abrirModalEdicion(${d.numDia}, '${d.key}')">
          <div class="card-header">
            <span class="dia">🔽 Día ${d.numDia}</span>
            <span class="badge-hoy">HOY</span>
          </div>
          <div class="card-body">
            <div class="item-full" style="color:var(--azul-principal); font-weight:500; border-bottom:none; padding:4px 0;">
              <span>📝 Haz clic para registrar</span>
            </div>
          </div>
          <div class="card-footer">
            <span>Saldo: ${d.saldoAcumulado.toLocaleString('es')} aves</span>
          </div>
        </div>
      `;
    } else if (d.estado === 'atrasado') {
      html += `
        <div class="registro-card atrasado" onclick="abrirModalEdicion(${d.numDia}, '${d.key}')">
          <div class="card-header">
            <span class="dia">⚠️ Día ${d.numDia}</span>
            <span class="badge-atrasado">ATRASADO</span>
          </div>
          <div class="card-body">
            <div class="item-full" style="color:var(--amarillo); font-weight:500; border-bottom:none; padding:4px 0;">
              <span>📝 Haz clic para registrar</span>
            </div>
          </div>
          <div class="card-footer">
            <span>Saldo: ${d.saldoAcumulado.toLocaleString('es')} aves</span>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="registro-card futuro">
          <div class="card-header">
            <span class="dia">📅 Día ${d.numDia}</span>
            <span class="fecha">${d.fechaTxt}</span>
          </div>
          <div class="card-body">
            <div class="item-full" style="color:var(--texto-secundario); font-style:italic; border-bottom:none; padding:4px 0;">
              <span>⏳ Próximamente</span>
            </div>
          </div>
        </div>
      `;
    }
  });
  
  html += '</div>';
  container.innerHTML = html;
}

function cambiarVistaSemana(semanaNum, event) {
  if (event) event.stopPropagation();
  const actual = _vistaSemanaActual[semanaNum] || 'tabla';
  _vistaSemanaActual[semanaNum] = actual === 'tabla' ? 'tarjetas' : 'tabla';
  renderizarSemanas();
}

function toggleSemana(num) {
  if (_semanaExpandida === num) {
    _semanaExpandida = null;
  } else {
    _semanaExpandida = num;
  }
  renderizarSemanas();
}

function renderCalendarioManejo(lote){
  const panel = document.getElementById('panelCalendarioManejo');
  const items = calcularEstadoManejo(lote);
  if (!items.length){ panel.style.display = 'none'; return; }
  panel.style.display = 'block';

  const nombresEstado = { 
    verde:'Aplicado a tiempo', 
    amarillo:'Aplicado con 1 día de diferencia', 
    rojo:'Atrasado (2+ días) o sin aplicar', 
    pendiente:'Aún no llega ese día' 
  };
  document.getElementById('contenidoCalendarioManejo').innerHTML = items.map(item => {
    const detalleAplicacion = item.aplicacion ? ` · Aplicado el día ${item.aplicacion.diaVida}` : '';
    return `<div class="fila-manejo">
      <span class="punto-semaforo punto-${item.estado}" title="${nombresEstado[item.estado]}"></span>
      <div>
        <b>${item.producto}</b><br>
        <span class="sub" style="margin:0;">Programado: día ${item.diaVida} de vida${detalleAplicacion}</span>
      </div>
    </div>`;
  }).join('');
}

// ============================================================
//  MODAL DE EDICIÓN
// ============================================================
let _medicinasEditando = [];
let _valoresEditando = {};
let _diaEditando = null;
let _keyEditando = null;

function abrirModalEdicion(numDia, key) {
  const g = loteActual;
  _diaEditando = numDia;
  _keyEditando = key;
  _medicinasEditando = [];
  _valoresEditando = {};
  
  const medicinasPendientes = obtenerMedicinasPendientesParaDia(g, numDia);
  _medicinasEditando = medicinasPendientes.map(item => ({
    nombre: item.producto,
    cantidad: 0,
    sugerida: true
  }));
  
  const modal = document.getElementById('modalEdicion');
  const titulo = document.getElementById('modalTitulo');
  
  titulo.textContent = `✏️ Editando Día ${numDia}`;
  
  const esPonedora = g.tipo === 'ponedora';
  const guia = guiasRaza[g.raza];
  const semanaNum = semanaDeGalpon(g);
  const pesoEsperado = guia && guia.semanas[semanaNum] ? guia.semanas[semanaNum].pesoEsperadoG : null;
  const badgePeso = pesoEsperado ? `<span class="badge-peso-referencia">Guía: ${pesoEsperado}g</span>` : '';
  
  const entradas = registrosSimple[g.id] || {};
  const datosExistentes = entradas[key] || null;
  
  renderModalBody(g, esPonedora, badgePeso, datosExistentes);
  
  modal.classList.add('active');
}

function renderModalBody(g, esPonedora, badgePeso, datosExistentes) {
  const body = document.getElementById('modalBody');
  
  const sugeridas = _medicinasEditando.filter(m => m.sugerida);
  const manuales = _medicinasEditando.filter(m => !m.sugerida);
  
  let medHtml = '';
  
  if (sugeridas.length > 0) {
    sugeridas.forEach((med) => {
      const realIdx = _medicinasEditando.indexOf(med);
      medHtml += `
        <div class="sugerencia-medicina">
          <span class="badge-sugerencia">📋 Sugerida</span>
          <span style="font-weight:500;">${med.nombre}</span>
          <span style="font-size:10px; color:var(--texto-secundario);">(programada para este día)</span>
          <input type="number" class="med-cantidad" data-idx="${realIdx}" value="${med.cantidad || 0}" placeholder="Cant." min="0" step="0.01" onchange="guardarMedicinaValor(${realIdx}, 'cantidad', this.value)">
          <span class="med-label">unidad</span>
        </div>
      `;
    });
  }
  
  if (manuales.length > 0) {
    manuales.forEach((med) => {
      const realIdx = _medicinasEditando.indexOf(med);
      medHtml += `
        <div class="fila-medicina">
          <select class="med-select" data-idx="${realIdx}" onchange="guardarMedicinaValor(${realIdx}, 'nombre', this.value); marcarNoSugerida(${realIdx})">
            ${opcionesCatalogoMedicinas(med.nombre || '')}
          </select>
          <input type="number" class="med-cantidad" data-idx="${realIdx}" value="${med.cantidad || 0}" placeholder="Cant." min="0" step="0.01" onchange="guardarMedicinaValor(${realIdx}, 'cantidad', this.value)">
          <span class="med-label">unidad</span>
          <button class="btn-remove-med" onclick="eliminarMedicinaModal(${realIdx})">✕</button>
        </div>
      `;
    });
  }
  
  if (_medicinasEditando.length === 0) {
    medHtml = `<div class="empty-med">No hay medicinas agregadas</div>`;
  }
  
  const mortVal = datosExistentes ? datosExistentes.mort : 0;
  const salidaVal = datosExistentes ? (datosExistentes.salida || 0) : 0;
  const ingVal = datosExistentes ? (datosExistentes.ing || 0) : 0;
  const consVal = datosExistentes ? (datosExistentes.cons || 0) : Math.round((g.numInicial || 0) * 0.005);
  const pesoVal = datosExistentes && datosExistentes.peso ? datosExistentes.peso : '';
  const posturaVal = datosExistentes ? (datosExistentes.postura || 0) : 0;
  const tempMinVal = datosExistentes && datosExistentes.tempMin ? datosExistentes.tempMin : '';
  const tempMaxVal = datosExistentes && datosExistentes.tempMax ? datosExistentes.tempMax : '';
  const humedadVal = datosExistentes && datosExistentes.humedad ? datosExistentes.humedad : '';
  
  body.innerHTML = `
    <div class="editando-grid">
      <div class="campo-edicion">
        <label>Mortalidad</label>
        <input type="number" id="editMort" value="${mortVal}" min="0">
      </div>
      <div class="campo-edicion">
        <label>Salida</label>
        <input type="number" id="editSalida" value="${salidaVal}" min="0">
      </div>
      <div class="campo-edicion">
        <label>Ing. alimento (kg)</label>
        <input type="number" id="editIng" value="${ingVal}" min="0" step="1">
      </div>
      <div class="campo-edicion">
        <label>Cons. alimento (kg)</label>
        <input type="number" id="editCons" value="${consVal}" min="0" step="1">
      </div>
      <div class="campo-edicion">
        <label>Peso (g) ${badgePeso}</label>
        <input type="number" id="editPeso" value="${pesoVal}" min="0" step="1" placeholder="Ej: 1350">
      </div>
      ${esPonedora ? `
        <div class="campo-edicion">
          <label>Postura</label>
          <input type="number" id="editPostura" value="${posturaVal}" min="0">
        </div>
      ` : ''}
      
      <div class="med-section">
        <div class="med-header">
          <label>💉 Medicinas aplicadas</label>
          <button class="btn-add-med" onclick="agregarMedicinaModal()">+ Agregar</button>
        </div>
        <div class="med-list" id="medListContainer">
          ${medHtml}
        </div>
      </div>
      
      <div class="clima-section">
        <div class="campo-edicion">
          <label>T° min</label>
          <input type="number" id="climaMinModal" step="0.1" placeholder="22" value="${tempMinVal}">
        </div>
        <div class="campo-edicion">
          <label>T° max</label>
          <input type="number" id="climaMaxModal" step="0.1" placeholder="33" value="${tempMaxVal}">
        </div>
        <div class="campo-edicion">
          <label>Humedad %</label>
          <input type="number" id="climaHumedadModal" step="0.1" placeholder="60" value="${humedadVal}">
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="btn-secundario" onclick="cerrarModal()">Cancelar</button>
        <button onclick="guardarEdicionModal()">✅ Guardar registro</button>
      </div>
    </div>
  `;
  
  const items = calcularEstadoManejo(g).filter(item =>
    !item.aplicacion && (item.estado === 'amarillo' || item.estado === 'rojo')
  );
  const notaRapida = document.createElement('div');
  notaRapida.className = 'rol-nota';
  if (items.length){
    notaRapida.innerHTML = `📅 Pendiente: <b>${items.map(i=>i.producto).join(', ')}</b> (aparecen sugeridas arriba)`;
  } else if (_medicinasEditando.some(m => m.sugerida)) {
    notaRapida.innerHTML = `💡 Las medicinas sugeridas están marcadas con "📋 Sugerida". Ingresa la cantidad y guarda.`;
  } else {
    notaRapida.innerHTML = '💡 Completa los campos y guarda el registro.';
  }
  body.appendChild(notaRapida);
}

function cerrarModal() {
  document.getElementById('modalEdicion').classList.remove('active');
  _medicinasEditando = [];
  _valoresEditando = {};
  _diaEditando = null;
  _keyEditando = null;
}

function guardarMedicinaValor(idx, campo, valor) {
  if (_medicinasEditando[idx]) {
    _medicinasEditando[idx][campo] = valor;
  }
}

function marcarNoSugerida(idx) {
  if (_medicinasEditando[idx]) {
    _medicinasEditando[idx].sugerida = false;
  }
}

function agregarMedicinaModal() {
  _medicinasEditando.push({ 
    nombre: catalogoMedicinas[0] || 'Vitamina AD3E', 
    cantidad: 0, 
    sugerida: false 
  });
  
  if (_diaEditando !== null) {
    const g = loteActual;
    const esPonedora = g.tipo === 'ponedora';
    const guia = guiasRaza[g.raza];
    const semanaNum = semanaDeGalpon(g);
    const pesoEsperado = guia && guia.semanas[semanaNum] ? guia.semanas[semanaNum].pesoEsperadoG : null;
    const badgePeso = pesoEsperado ? `<span class="badge-peso-referencia">Guía: ${pesoEsperado}g</span>` : '';
    const entradas = registrosSimple[g.id] || {};
    const datosExistentes = entradas[_keyEditando] || null;
    renderModalBody(g, esPonedora, badgePeso, datosExistentes);
  }
}

function eliminarMedicinaModal(idx) {
  _medicinasEditando.splice(idx, 1);
  if (_diaEditando !== null) {
    const g = loteActual;
    const esPonedora = g.tipo === 'ponedora';
    const guia = guiasRaza[g.raza];
    const semanaNum = semanaDeGalpon(g);
    const pesoEsperado = guia && guia.semanas[semanaNum] ? guia.semanas[semanaNum].pesoEsperadoG : null;
    const badgePeso = pesoEsperado ? `<span class="badge-peso-referencia">Guía: ${pesoEsperado}g</span>` : '';
    const entradas = registrosSimple[g.id] || {};
    const datosExistentes = entradas[_keyEditando] || null;
    renderModalBody(g, esPonedora, badgePeso, datosExistentes);
  }
}

function guardarEdicionModal() {
  const g = loteActual;
  const key = _keyEditando;
  const entradas = registrosSimple[g.id] || (registrosSimple[g.id] = {});
  
  const mort = parseFloat(document.getElementById('editMort')?.value) || 0;
  const salida = parseFloat(document.getElementById('editSalida')?.value) || 0;
  const ing = parseFloat(document.getElementById('editIng')?.value) || 0;
  const cons = parseFloat(document.getElementById('editCons')?.value) || 0;
  const postura = parseFloat(document.getElementById('editPostura')?.value) || 0;
  const peso = parseFloat(document.getElementById('editPeso')?.value) || null;
  
  const medicinas = [];
  const container = document.getElementById('modalBody');
  
  const sugerenciaInputs = container.querySelectorAll('.sugerencia-medicina .med-cantidad');
  sugerenciaInputs.forEach((inp) => {
    const parent = inp.closest('.sugerencia-medicina');
    const nombre = parent ? parent.querySelector('span:nth-child(2)')?.textContent : null;
    const cantidad = parseFloat(inp.value) || 0;
    if (nombre && cantidad > 0) {
      medicinas.push({ nombre, cantidad });
    }
  });
  
  const selects = container.querySelectorAll('.med-select');
  const cantidades = container.querySelectorAll('.fila-medicina .med-cantidad');
  
  for (let i = 0; i < selects.length; i++) {
    let nombre = selects[i].value;
    if (nombre === '__otra__') {
      nombre = prompt('Ingresa el nombre del nuevo producto:');
      if (nombre) nombre = agregarProductoAlCatalogo(nombre);
      else continue;
    }
    const cantidad = parseFloat(cantidades[i]?.value) || 0;
    if (nombre && cantidad > 0) {
      if (!medicinas.some(m => m.nombre === nombre)) {
        medicinas.push({ nombre, cantidad });
      }
    }
  }
  
  const tempMin = parseFloat(document.getElementById('climaMinModal')?.value) || null;
  const tempMax = parseFloat(document.getElementById('climaMaxModal')?.value) || null;
  const humedad = parseFloat(document.getElementById('climaHumedadModal')?.value) || null;
  
  const registro = {
    mort, salida, ing, cons,
    postura, rotos: 0,
    peso,
    medicinas,
    tempMin, tempMax, humedad
  };
  
  entradas[key] = registro;
  
  cerrarModal();
  renderizarSemanas();
  mostrarToast(`Registro guardado (${medicinas.length} medicinas aplicadas).`, 'exito');
}

// ============================================================
//  CONFIGURACIÓN — TIPOS DE CRIANZA
// ============================================================
function renderListaTiposCrianza(){
  const cont = document.getElementById('listaTiposCrianza');
  if (!cont) return;
  cont.innerHTML = tiposCrianza.map(t =>
    `<span class="pill ${nombresTipo[t] ? t : 'engorde'}" style="margin:3px 6px 3px 0; display:inline-block;">${nombresTipo[t] || t}</span>`
  ).join('');
  actualizarSelectTipos();
}

function actualizarSelectTipos(){
  const select = document.getElementById('nlTipo');
  if (!select) return;
  const valorActual = select.value;
  select.innerHTML = tiposCrianza.map(t => `<option value="${t}">${nombresTipo[t] || t}</option>`).join('');
  if (tiposCrianza.includes(valorActual)) select.value = valorActual;
}

function agregarTipoCrianza(){
  const input = document.getElementById('nuevoTipoCrianza');
  const nombre = input.value.trim();
  if (!nombre) return;
  const id = nombre.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  if (tiposCrianza.includes(id)){ mostrarToast('Ese tipo ya existe.', 'advertencia'); return; }
  tiposCrianza.push(id);
  nombresTipo[id] = nombre;
  input.value = '';
  renderListaTiposCrianza();
  mostrarToast(`Tipo "${nombre}" agregado.`, 'exito');
}

// ============================================================
//  CONFIGURACIÓN — RAZAS (CON EDITAR/CREAR)
// ============================================================
function renderListaRazas(){
  const cont = document.getElementById('listaRazas');
  if (!cont) return;
  const nombres = Object.keys(guiasRaza);
  
  let html = '';
  if (nombres.length === 0){
    html = '<div class="sub">Todavía no hay razas configuradas.</div>';
  } else {
    html = nombres.map(nombre => {
      const r = guiasRaza[nombre];
      const numSemanas = Object.keys(r.semanas).length;
      const numManejo = (r.manejo || []).length;
      const nombreEscapado = nombre.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `<div class="card-galpon" style="margin-bottom:10px;">
        <h4>${nombre}</h4>
        <div class="sub"><span class="pill ${r.tipo}">${nombresTipo[r.tipo] || r.tipo}</span></div>
        <div class="sub">${numSemanas} semana(s) de guía · ${numManejo} aplicación(es) de manejo</div>
        <button class="btn-secundario" onclick="toggleFormNuevaRaza('${nombreEscapado}')">✏️ Editar</button>
      </div>`;
    }).join('');
  }
  
  html += `<button onclick="toggleFormNuevaRaza()" style="margin-top:12px;">+ Agregar raza</button>`;
  cont.innerHTML = html;
}

function toggleFormNuevaRaza(nombreExistente){
  const panel = document.getElementById('panelNuevaRaza');
  if (!panel) return;
  const abrir = panel.style.display === 'none' || !!nombreExistente;
  panel.style.display = abrir ? 'block' : 'none';
  if (!abrir) return;
  
  document.getElementById('tablaGuiaNuevaRaza').querySelectorAll('tr:not(:first-child)').forEach(tr => tr.remove());
  document.getElementById('tablaManejoNuevaRaza').querySelectorAll('tr:not(:first-child)').forEach(tr => tr.remove());
  _razaEnEdicion = nombreExistente || null;
  
  const titulo = document.getElementById('tituloNuevaRaza');
  if (titulo) {
    titulo.textContent = nombreExistente ? `Editar raza: ${nombreExistente}` : 'Agregar nueva raza';
  }
  
  if (nombreExistente){
    const r = guiasRaza[nombreExistente];
    document.getElementById('razaNombre').value = nombreExistente;
    document.getElementById('razaTipo').value = r.tipo;
    
    Object.keys(r.semanas).sort((a,b) => a-b).forEach(semana => {
      agregarFilaGuia();
      const filas = document.querySelectorAll('#tablaGuiaNuevaRaza tr:not(:first-child)');
      const inputs = filas[filas.length - 1].querySelectorAll('input');
      inputs[0].value = semana;
      const fila = r.semanas[semana];
      if (fila.pesoEsperadoG != null) inputs[1].value = fila.pesoEsperadoG;
      if (fila.tempIdealC != null) inputs[2].value = fila.tempIdealC;
      if (fila.mortAcumPct != null) inputs[3].value = fila.mortAcumPct;
      if (fila.consumoAcumG != null) inputs[4].value = fila.consumoAcumG;
      if (fila.produccionPct != null) inputs[5].value = fila.produccionPct;
    });
    
    (r.manejo || []).forEach(item => {
      agregarFilaManejo();
      const filas = document.querySelectorAll('#tablaManejoNuevaRaza tr:not(:first-child)');
      const ultimaFila = filas[filas.length - 1];
      ultimaFila.querySelector('input[type="number"]').value = item.diaVida;
      if (!catalogoMedicinas.includes(item.producto)) catalogoMedicinas.push(item.producto);
      const select = ultimaFila.querySelector('.manejo-producto');
      if (select) select.innerHTML = opcionesCatalogoMedicinas(item.producto);
      const dosisInput = ultimaFila.querySelector('.manejo-dosis');
      if (dosisInput && item.dosis) dosisInput.value = item.dosis;
    });
    
    if (!Object.keys(r.semanas).length) agregarFilaGuia();
    if (!(r.manejo || []).length) agregarFilaManejo();
  } else {
    document.getElementById('razaNombre').value = '';
    agregarFilaGuia();
    agregarFilaManejo();
  }
  
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function agregarFilaGuia(){
  const tabla = document.getElementById('tablaGuiaNuevaRaza');
  if (!tabla) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `<td><input type="number" style="width:60px;" placeholder="1"></td>
    <td><input type="number" style="width:80px;" placeholder="g"></td>
    <td><input type="number" style="width:70px;" placeholder="°C"></td>
    <td><input type="number" style="width:80px;" placeholder="%"></td>
    <td><input type="number" style="width:90px;" placeholder="g/ave"></td>
    <td><input type="number" style="width:70px;" placeholder="%"></td>
    <td><button type="button" onclick="this.closest('tr').remove()" style="background:var(--rojo); padding:4px 8px;">✕</button></td>`;
  tabla.appendChild(tr);
}

function agregarFilaManejo(){
  const tabla = document.getElementById('tablaManejoNuevaRaza');
  if (!tabla) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `<td><input type="number" style="width:70px;" placeholder="Día 1"></td>
    <td>
      <select class="manejo-producto">
        ${opcionesCatalogoMedicinas()}
      </select>
    </td>
    <td><input type="text" class="manejo-dosis" placeholder="Ej: 1 ml/L" style="width:120px;"></td>
    <td><button type="button" onclick="this.closest('tr').remove()" style="background:var(--rojo); padding:4px 8px;">✕</button></td>`;
  tabla.appendChild(tr);
}

function guardarNuevaRaza(){
  const nombre = document.getElementById('razaNombre').value.trim();
  const tipo = document.getElementById('razaTipo').value;
  if (!nombre){ mostrarToast('Ponle un nombre a la raza.', 'advertencia'); return; }
  
  const semanasData = {};
  document.querySelectorAll('#tablaGuiaNuevaRaza tr:not(:first-child)').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    const semana = parseInt(inputs[0].value);
    if (!semana) return;
    const fila = {};
    if (inputs[1].value) fila.pesoEsperadoG = parseFloat(inputs[1].value);
    if (inputs[2].value) fila.tempIdealC = parseFloat(inputs[2].value);
    if (inputs[3].value) fila.mortAcumPct = parseFloat(inputs[3].value);
    if (inputs[4].value) fila.consumoAcumG = parseFloat(inputs[4].value);
    if (inputs[5].value) fila.produccionPct = parseFloat(inputs[5].value);
    semanasData[semana] = fila;
  });
  
  const manejoData = [];
  document.querySelectorAll('#tablaManejoNuevaRaza tr:not(:first-child)').forEach(tr => {
    const diaVida = parseInt(tr.querySelector('input[type="number"]').value);
    const select = tr.querySelector('.manejo-producto');
    const dosis = tr.querySelector('.manejo-dosis')?.value || '';
    const producto = select.value;
    if (!diaVida || !producto || producto === '__otra__') return;
    manejoData.push({ diaVida, producto, dosis });
  });
  
  if (_razaEnEdicion && _razaEnEdicion !== nombre) delete guiasRaza[_razaEnEdicion];
  guiasRaza[nombre] = { tipo, semanas: semanasData, manejo: manejoData };
  
  document.getElementById('panelNuevaRaza').style.display = 'none';
  _razaEnEdicion = null;
  renderListaRazas();
  mostrarToast(`Raza "${nombre}" guardada (${Object.keys(semanasData).length} semanas, ${manejoData.length} aplicaciones).`, 'exito');
}

// ============================================================
//  USUARIOS
// ============================================================
function renderListaUsuarios(){
  const cont = document.getElementById('listaUsuarios');
  if (!cont) return;
  if (usuarios.length === 0){ cont.innerHTML = '<div class="sub">Todavía no hay usuarios.</div>'; return; }
  cont.innerHTML = usuarios.map(u => {
    const granja = u.granjaId ? granjas.find(g => g.id === u.granjaId)?.nombre : 'Todas';
    const galpon = u.galponId ? galpones.find(g => g.id === u.galponId)?.nombre : '—';
    return `<div class="card-galpon" style="margin-bottom:10px;">
      <h4>${u.nombre}</h4>
      <div class="sub"><span class="pill ${u.rol === 'admin' ? 'engorde' : u.rol === 'supervisor' ? 'ponedora' : 'reproductora'}">${u.rol === 'admin' ? 'Administrador' : u.rol === 'supervisor' ? 'Supervisor' : 'Galponero'}</span></div>
      <div class="sub">Granja: ${granja}${u.rol === 'galponero' ? ' · Galpón: ' + galpon : ''}</div>
    </div>`;
  }).join('');
}

function toggleFormNuevoUsuario(){
  const panel = document.getElementById('panelNuevoUsuario');
  const abrir = panel.style.display === 'none';
  panel.style.display = abrir ? 'block' : 'none';
  if (abrir){
    document.getElementById('uNombre').value = '';
    document.getElementById('uGranja').innerHTML = granjas.map(g => `<option value="${g.id}">${g.nombre}</option>`).join('');
    actualizarCamposUsuario();
  }
}

function actualizarCamposUsuario(){
  const esGalponero = document.getElementById('uRol').value === 'galponero';
  document.getElementById('campoGalponUsuario').style.display = esGalponero ? 'block' : 'none';
  actualizarGalponesUsuario();
}

function actualizarGalponesUsuario(){
  const granjaId = parseInt(document.getElementById('uGranja').value);
  const select = document.getElementById('uGalpon');
  const opciones = galpones.filter(g => g.granjaId === granjaId);
  select.innerHTML = opciones.map(g => `<option value="${g.id}">${g.nombre}</option>`).join('');
}

function guardarUsuario(){
  const nombre = document.getElementById('uNombre').value.trim();
  if (!nombre){ mostrarToast('Ponle un nombre al usuario.', 'advertencia'); return; }
  const rol = document.getElementById('uRol').value;
  const granjaId = parseInt(document.getElementById('uGranja').value) || null;
  const galponId = rol === 'galponero' ? (parseInt(document.getElementById('uGalpon').value) || null) : null;
  usuarios.push({ id: Date.now(), nombre, rol, granjaId: rol === 'admin' ? null : granjaId, galponId });
  document.getElementById('panelNuevoUsuario').style.display = 'none';
  renderListaUsuarios();
  actualizarSelectorUsuariosGalponero();
  mostrarToast(`Usuario "${nombre}" agregado.`, 'exito');
}

function actualizarSelectorUsuariosGalponero(){
  const select = document.getElementById('selectorGalponAsignado');
  if (!select) return;
  const galponeros = usuarios.filter(u => u.rol === 'galponero' && u.galponId);
  select.innerHTML = galponeros.map(u => {
    const galpon = galpones.find(g => g.id === u.galponId);
    return `<option value="${u.galponId}">${u.nombre} — ${galpon ? galpon.nombre : ''}</option>`;
  }).join('');
}

// ============================================================
//  DASHBOARD
// ============================================================
function sparklineSVG(valores, color){
  if (!valores.length) return '<div class="sub">Sin datos aún</div>';
  const w = 200, h = 40, max = Math.max(...valores), min = Math.min(...valores);
  const rango = (max - min) || 1;
  const puntos = valores.map((v,i) => {
    const x = (i / (valores.length - 1 || 1)) * w;
    const y = h - ((v - min) / rango) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg width="100%" height="40" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <polyline points="${puntos}" fill="none" stroke="${color}" stroke-width="2"/>
  </svg>`;
}

function renderRanking(){
  const cont = document.getElementById('contenidoRanking');
  if (!cont) return;
  if (rolActual === 'galponero'){ 
    document.getElementById('panelRanking').style.display = 'none'; 
    return; 
  }
  document.getElementById('panelRanking').style.display = 'block';
  const galponesDeGranja = galpones.filter(g => g.granjaId === granjaActual.id);
  const lotesVigentes = galponesDeGranja.map(g => loteVigente(g.id)).filter(Boolean);
  if (lotesVigentes.length < 2){
    cont.innerHTML = '<div class="sub">Necesitas al menos 2 lotes activos del mismo tipo para comparar.</div>';
    return;
  }
  const porTipo = {};
  lotesVigentes.forEach(lote => { (porTipo[lote.tipo] = porTipo[lote.tipo] || []).push(lote); });
  let html = '';
  Object.keys(porTipo).forEach(tipo => {
    const grupo = porTipo[tipo];
    if (grupo.length < 2) return;
    const filas = grupo.map(lote => {
      const galpon = galponDeLote(lote);
      const mortSerie = obtenerMortalidadSerie(lote);
      const avesIniciales = lote.tipo === 'reproductora' ? (lote.numInicialH + lote.numInicialM) : lote.numInicial;
      const totalMuertas = mortSerie.reduce((a,b)=>a+b,0);
      const mortPct = avesIniciales ? (totalMuertas / avesIniciales * 100) : 0;
      return { lote, galpon, mortPct };
    }).sort((a,b) => a.mortPct - b.mortPct);
    html += `<div class="sub" style="font-weight:600; margin:14px 0 6px;">${nombresTipo[tipo] || tipo}</div>
      <table style="width:100%; font-size:13px; border-collapse:collapse;">
        <tr><th style="text-align:left; padding:6px; color:var(--texto-secundario); font-size:11px;">Galpón</th>
            <th style="text-align:left; padding:6px; color:var(--texto-secundario); font-size:11px;">Raza</th>
            <th style="text-align:left; padding:6px; color:var(--texto-secundario); font-size:11px;">Semana</th>
            <th style="text-align:right; padding:6px; color:var(--texto-secundario); font-size:11px;">Mortalidad acum.</th></tr>`;
    filas.forEach((f, i) => {
      const medalla = i === 0 ? '🏆 ' : (i === filas.length - 1 && filas.length > 2 ? '⚠ ' : '');
      html += `<tr style="cursor:pointer;" onclick="mostrarDetalleGalpon(${f.lote.id})">
        <td style="padding:6px; border-top:1px solid var(--borde);">${medalla}${f.galpon.nombre} · Lote ${f.lote.numero}</td>
        <td style="padding:6px; border-top:1px solid var(--borde);">${f.lote.raza}</td>
        <td style="padding:6px; border-top:1px solid var(--borde);">${semanaDeGalpon(f.lote)}</td>
        <td style="padding:6px; border-top:1px solid var(--borde); text-align:right; font-weight:500;">${f.mortPct.toFixed(1)}%</td>
      </tr>`;
    });
    html += '</table>';
  });
  cont.innerHTML = html || '<div class="sub">Necesitas al menos 2 lotes activos del mismo tipo para comparar.</div>';
}

function renderDashboardResumen(){
  // Validación para evitar errores si no hay granja cargada
  if (!granjaActual) {
    const nombreEl = document.getElementById('nombreGranjaDashboard');
    if (nombreEl) nombreEl.textContent = 'Cargando granja...';
    return; // Detiene la ejecución acá para que no explote
  }

  const nombreEl = document.getElementById('nombreGranjaDashboard');
  if (nombreEl) nombreEl.textContent = granjaActual.nombre;
  
  const grid = document.getElementById('gridResumenDashboard');
  if (!grid) return;
  grid.innerHTML = '';
  let galponesDeGranja = galpones.filter(g => g.granjaId === granjaActual.id);
    // FILTRO DE SEGURIDAD PARA GALPONEROS
  if (rolActual === 'galponero') {
    // En un futuro acá leeremos la tabla 'usuario_galpones'. Por ahora, lo ocultamos.
    document.getElementById('panelResumenDashboard').style.display = 'none';
    return; // Cortamos la ejecución para que no dibuje nada de admin
  }
  if (rolActual === 'galponero') galponesDeGranja = galponesDeGranja.filter(g => g.id === galponeroAsignado);
  const lotesVigentes = galponesDeGranja.map(g => loteVigente(g.id)).filter(Boolean);
  if (lotesVigentes.length === 0){
    grid.innerHTML = '<div class="estado-vacio"><p>Esta granja todavía no tiene lotes vigentes.</p></div>';
    return;
  }
  lotesVigentes.forEach(g => {
    const galpon = galponDeLote(g);
    const mortalidadSerie = obtenerMortalidadSerie(g);
    let kpiTexto = mortalidadSerie.length ? '' : 'Sin datos capturados aún';
    if (g.tipo === 'reproductora') kpiTexto = kpiTexto || `${(g.numInicialH + g.numInicialM).toLocaleString('es')} aves inicial`;
    else kpiTexto = kpiTexto || `${g.numInicial.toLocaleString('es')} aves inicial`;
    const alertas = evaluarAlertasLote(g, mortalidadSerie);
    const badgeAlerta = alertas.length ? `<span class="badge-alerta" title="${alertas.join(' | ')}">⚠ Revisar (${alertas.length})</span>` : '';
    const div = document.createElement('div');
    div.className = 'card-galpon';
    div.style.cursor = 'pointer';
    div.innerHTML = `<h4>${galpon.nombre} ${badgeAlerta}</h4>
      <div class="sub"><span class="pill ${g.tipo}">${nombresTipo[g.tipo]}</span> · Lote ${g.numero}</div>
      <div class="sub" style="margin-bottom:8px;">${kpiTexto} · Semana ${semanaDeGalpon(g)}</div>
      ${sparklineSVG(mortalidadSerie, '#E53935')}
      <div class="sub" style="margin-top:4px;">Tendencia de mortalidad diaria</div>`;
    div.onclick = () => mostrarDetalleGalpon(g.id);
    grid.appendChild(div);
  });
  renderRanking();
}

// ============================================================
//  DASHBOARD DETALLE CON GRÁFICAS
// ============================================================
function crearChartDetalle(canvasId, tipo, labels, datasets, tituloEjeY, onBarClick){
  // 🔥 LIMPIEZA: Destruimos cualquier gráfico previo en este mismo canvas
  const canvasExistente = document.getElementById(canvasId);
  if (canvasExistente) {
    const chartExistente = Chart.getChart(canvasExistente);
    if (chartExistente) {
      chartExistente.destroy();
    }
  }

  if (_chartError) return null;
  
  // Declaramos ctx UNA SOLA VEZ aquí
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  
  const opciones = {
    responsive: true, 
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { 
      y: { title: {display:true, text:tituloEjeY}, grid: {color:'#DCE4EC'} }, 
      x: { grid: {display:false} } 
    }
  };
  
  if (onBarClick){
    opciones.onClick = (evt, elementos) => { if (elementos.length > 0) onBarClick(elementos[0].index); };
    opciones.onHover = (evt, elementos) => { evt.native.target.style.cursor = elementos.length ? 'pointer' : 'default'; };
  }
  
  const chart = new Chart(ctx, { type: tipo, data: { labels, datasets }, options: opciones });
  chartsDetalleActivos.push(chart);
  return chart;
}

function panelGrafica(id, titulo, sub, colorReal, labelReal, colorGuia, labelGuia){
  return `<div class="panel" id="panel-${id}">
    <h3>${titulo}</h3>
    <div class="sub">${sub}</div>
    <div class="legend">
      <span><span class="dot" style="background:${colorReal}"></span>${labelReal}</span>
      ${colorGuia ? `<span><span class="dot" style="background:${colorGuia}"></span>${labelGuia}</span>` : ''}
    </div>
    <div class="chart-wrap"><canvas id="${id}"></canvas></div>
  </div>`;
}

async function mostrarDetalleGalpon(id){
  const g = lotes.find(x => x.id === id);
  if (!g) return;
  
  window._galponDetalleActual = g;
  
  // 🔥 NUEVO: Traer los registros reales de Supabase antes de graficar
  if (typeof supabaseClient !== 'undefined') {
    try {
      const { data, error } = await supabaseClient
        .from('registros_diarios')
        .select('*')
        .eq('lote_id', g.id);
        
      if (!error && data) {
        registrosSimple[g.id] = {};
        data.forEach(reg => {
          registrosSimple[g.id][reg.fecha] = {
            mort: (reg.mortalidad_h || 0) + (reg.mortalidad_m || 0),
            mortH: reg.mortalidad_h || 0,
            mortM: reg.mortalidad_m || 0,
            cons: (reg.consumo_alimento_a || 0) + (reg.consumo_alimento_b || 0),
            cons2: reg.consumo_alimento_b || 0,
            peso: reg.peso_promedio_g,
            tempMax: reg.temp_max_c,
            humedad: reg.humedad_pct,
            postura: (reg.huevo_comercial || 0) + (reg.huevo_fertil || 0) + (reg.huevo_extra || 0) + (reg.huevo_roto || 0),
            huevoComercial: reg.huevo_comercial || 0,
            huevoFertil: reg.huevo_fertil || 0,
            huevoExtra: reg.huevo_extra || 0,
            huevoRoto: reg.huevo_roto || 0,
            medicinas: []
          };
        });
      }
    } catch (err) {
      console.warn("No se pudieron cargar los datos frescos para las gráficas", err);
    }
  }

  document.getElementById('panelResumenDashboard').style.display = 'none';
  document.getElementById('panelDetalleDashboard').style.display = 'block';
  chartsDetalleActivos.forEach(c => c.destroy());
  chartsDetalleActivos = [];
  
  const cont = document.getElementById('graficasDetalleDashboard');
  const kpis = document.getElementById('kpisDetalleDashboard');

  if (_chartError){
    cont.innerHTML = '<div class="panel"><h3>Gráficas no disponibles</h3><div class="sub">Chart.js no se pudo cargar. Revisá tu conexión.</div></div>';
    kpis.innerHTML = '<div class="kpi"><div class="label">Aviso</div><div class="valor" style="font-size:14px;">Sin gráficas</div></div>';
    return;
  }

  if (g.tipo === 'reproductora'){
    const datos = semanas[g.semana];
    const dias = datos ? datos.dias.filter(d=>d.estado==='guardado') : [];
    let saldoH = datos ? datos.saldoHInicial : 0, saldoM = datos ? datos.saldoMInicial : 0;
    const mortSerie = [], gramosAveSerie = [], fertilSerie = [];
    dias.forEach(d => {
      saldoH -= d.mortH + (d.salidaH||0); saldoM -= d.mortM + (d.salidaM||0);
      const saldoTotal = saldoH + saldoM;
      mortSerie.push(d.mortH + d.mortM);
      gramosAveSerie.push(saldoTotal > 0 ? Math.round((d.cons*1000)/saldoTotal) : 0);
      fertilSerie.push(d.fer);
    });
    kpis.innerHTML = `
      <div class="kpi"><div class="label">Saldo hembras</div><div class="valor">${saldoH.toLocaleString('es')}</div></div>
      <div class="kpi"><div class="label">Saldo machos</div><div class="valor">${saldoM.toLocaleString('es')}</div></div>
      <div class="kpi"><div class="label">Raza</div><div class="valor" style="font-size:16px;">${g.raza}</div></div>
      <div class="kpi"><div class="label">Semana</div><div class="valor">${semanaDeGalpon(g)}</div></div>`;
    cont.innerHTML = `<div class="volver" id="volverVistaSemanal" style="display:none;" onclick="renderVistaSemanalGeneral()">← Volver a vista semanal</div>` +
      panelGrafica('chartD1','Mortalidad','Por semana — haz clic en una barra para ver el detalle diario','#E53935','Mortalidad (H+M)') +
      panelGrafica('chartD2','Consumo de alimento','Gramos por ave al día, por semana','#F57C00','g/ave/día') +
      panelGrafica('chartD3','Producción de huevos fértiles','Por semana','#7E57C2','Fértiles');
    iniciarVistaSemanal([
      { id:'chartD1', serie:mortSerie, modo:'suma', color:'#E53935', label:'Mortalidad', eje:'aves' },
      { id:'chartD2', serie:gramosAveSerie, modo:'promedio', color:'#F57C00', label:'g/ave/día', eje:'g/ave/día' },
      { id:'chartD3', serie:fertilSerie, modo:'suma', color:'#7E57C2', label:'Fértiles', eje:'huevos' },
    ], g.numInicialH + g.numInicialM);
  } else {
    let dias, saldoInicial;
    if (esFechaCalculable(g.fechaIngreso)){
      const entradas = registrosSimple[g.id] || {};
      const claves = Object.keys(entradas).sort();
      dias = claves.map(k => entradas[k]);
      saldoInicial = g.numInicial;
    } else {
      dias = [];
      saldoInicial = g.numInicial || 0;
    }
    let saldo = saldoInicial;
    const mortSerie = [], gramosAveSerie = [], posturaSerie = [], pesoSerie = [], tempMaxSerie = [], humedadSerie = [];
    dias.forEach(d => {
      saldo -= (d.mort || 0) + (d.salida||0);
      mortSerie.push(d.mort || 0);
      gramosAveSerie.push(saldo > 0 ? Math.round((d.cons*1000)/saldo) : 0);
      posturaSerie.push(d.postura||0);
      pesoSerie.push(d.peso != null ? d.peso : null);
      tempMaxSerie.push(d.tempMax != null ? d.tempMax : null);
      humedadSerie.push(d.humedad != null ? d.humedad : null);
    });
    kpis.innerHTML = `
      <div class="kpi"><div class="label">Saldo de aves</div><div class="valor">${saldo.toLocaleString('es')}</div></div>
      <div class="kpi"><div class="label">Raza</div><div class="valor" style="font-size:16px;">${g.raza}</div></div>
      <div class="kpi"><div class="label">Tipo</div><div class="valor" style="font-size:16px;">${nombresTipo[g.tipo]}</div></div>
      <div class="kpi"><div class="label">Semana</div><div class="valor">${semanaDeGalpon(g)}</div></div>`;
    let html = `<div class="volver" id="volverVistaSemanal" style="display:none;" onclick="renderVistaSemanalGeneral()">← Volver a vista semanal</div>` +
      panelGrafica('chartD1','Mortalidad','Por semana — haz clic en una barra para ver el detalle diario','#E53935','Mortalidad') +
      panelGrafica('chartD2','Consumo de alimento','Gramos por ave al día, por semana','#F57C00','g/ave/día') +
      panelGrafica('chartD4','Peso del ave','Última muestra de la semana — comparado contra la guía','#1976D2','Peso real','#9E9E9E','Guía') +
      panelGrafica('chartD5','Temperatura máxima','Última muestra de la semana — comparada contra la guía','#FB8C00','Temp. real (°C)','#9E9E9E','Guía') +
      panelGrafica('chartD6','Humedad','Última muestra de la semana','#00897B','Humedad (%)');
    const series = [
      { id:'chartD1', serie:mortSerie, modo:'suma', color:'#E53935', label:'Mortalidad', eje:'aves' },
      { id:'chartD2', serie:gramosAveSerie, modo:'promedio', color:'#F57C00', label:'g/ave/día', eje:'g/ave/día' },
      { id:'chartD4', serie:pesoSerie, modo:'ultimo', color:'#1976D2', label:'Peso (g)', eje:'gramos' },
      { id:'chartD5', serie:tempMaxSerie, modo:'ultimo', color:'#FB8C00', label:'Temp. máx (°C)', eje:'°C' },
      { id:'chartD6', serie:humedadSerie, modo:'ultimo', color:'#00897B', label:'Humedad (%)', eje:'%' },
    ];
    if (g.tipo === 'ponedora'){
      html += panelGrafica('chartD3','Producción de huevos','Por semana','#7E57C2','Postura');
      series.push({ id:'chartD3', serie:posturaSerie, modo:'suma', color:'#7E57C2', label:'Postura', eje:'huevos' });
    }
    cont.innerHTML = html;
    iniciarVistaSemanal(series, saldoInicial);
  }
}

function agregarSemanal(serie, modo){
  const numSemanas = Math.max(1, Math.ceil(serie.length / 7));
  const resultado = [];
  for (let s = 0; s < numSemanas; s++){
    const bloque = serie.slice(s*7, s*7+7);
    if (modo === 'promedio'){ 
      resultado.push(bloque.length ? Math.round(bloque.reduce((a,b)=>a+b,0)/bloque.length) : 0); 
    } else if (modo === 'ultimo'){ 
      const noNulos = bloque.filter(v => v != null); 
      resultado.push(noNulos.length ? noNulos[noNulos.length - 1] : null); 
    } else { 
      resultado.push(bloque.reduce((a,b)=>a+(b||0),0)); 
    }
  }
  return resultado;
}

function iniciarVistaSemanal(series, avesIniciales){ 
  window._seriesDetalleDashboard = series; 
  window._avesInicialesDetalle = avesIniciales || 0; 
  renderVistaSemanalGeneral(); 
}

function obtenerGuiaActual(){ 
  const g = window._galponDetalleActual; 
  return (g && guiasRaza[g.raza]) ? guiasRaza[g.raza] : null; 
}

function renderVistaSemanalGeneral(){
   // 🔥 Limpiamos todos los gráficos activos antes de dibujar los nuevos
  chartsDetalleActivos.forEach(c => { 
    try { c.destroy(); } catch(e) { console.warn(e); } 
  });
  chartsDetalleActivos = [];
  const series = window._seriesDetalleDashboard || [];
  const avesIniciales = window._avesInicialesDetalle || 0;
  const guia = obtenerGuiaActual();
  const volver = document.getElementById('volverVistaSemanal');
  if (volver) volver.style.display = 'none';
  
  if (_chartError) return;
  
  series.forEach(({id, serie, modo, color, label, eje}) => {
    const agregada = agregarSemanal(serie, modo);
    const numSemanas = agregada.length;
    const labels = agregada.map((_,i) => `Semana ${i+1}`);
    const datasets = [{ label, data:agregada, backgroundColor:color }];
    
    if (guia && (id === 'chartD1' || id === 'chartD2' || id === 'chartD4' || id === 'chartD5')){
      const guiaSerie = [];
      let previoAcum = 0;
      for (let i = 0; i < numSemanas; i++){
        const filaGuia = guia.semanas[i+1];
        if (id === 'chartD1' && filaGuia && filaGuia.mortAcumPct != null){
          const acumAves = (filaGuia.mortAcumPct / 100) * avesIniciales;
          guiaSerie.push(Math.round(acumAves - previoAcum));
          previoAcum = acumAves;
        } else if (id === 'chartD2' && filaGuia && filaGuia.consumoAcumG != null){
          guiaSerie.push(Math.round((filaGuia.consumoAcumG - previoAcum) / 7));
          previoAcum = filaGuia.consumoAcumG;
        } else if (id === 'chartD4' && filaGuia && filaGuia.pesoEsperadoG != null){
          guiaSerie.push(filaGuia.pesoEsperadoG);
        } else if (id === 'chartD5' && filaGuia && filaGuia.tempIdealC != null){
          guiaSerie.push(filaGuia.tempIdealC);
        } else { 
          guiaSerie.push(null); 
        }
      }
      if (guiaSerie.some(v => v !== null)){
        datasets.push({ 
          label:'Guía ('+window._galponDetalleActual.raza+')', 
          data:guiaSerie, 
          type:'line',
          borderColor:'#9E9E9E', 
          backgroundColor:'#9E9E9E', 
          borderWidth:2, 
          borderDash:[6,4], 
          pointRadius:3, 
          tension:0.25 
        });
      }
    }
    crearChartDetalle(id, 'bar', labels, datasets, eje, (indiceSemana) => renderVistaDiariaGeneral(indiceSemana));
  });
}

function renderVistaDiariaGeneral(indiceSemana){
  const series = window._seriesDetalleDashboard || [];
  const volver = document.getElementById('volverVistaSemanal');
  if (volver) volver.style.display = 'inline-block';
  
  if (_chartError) return;
  
  const inicio = indiceSemana*7, fin = inicio+7;
  series.forEach(({id, serie, color, label, eje}) => {
    const bloque = serie.slice(inicio, fin);
    const labels = bloque.map((_,i) => `Día ${inicio+i+1}`);
    chartsDetalleActivos = chartsDetalleActivos.filter(c => {
      if (c.canvas && c.canvas.id === id){ c.destroy(); return false; }
      return true;
    });
    crearChartDetalle(id, 'bar', labels, [{label, data:bloque, backgroundColor:color}], eje);
  });
}
// ============================================================
//  VISTA TÁCTIL GALPONERO (Pestañas, Fechas y Medicinas)
// ============================================================
// ============================================================
//  VISTA TÁCTIL GALPONERO (Lógica Dinámica)
// ============================================================
let fechaTactilActual = null;
let medicinasTactilesTemp = [];
let tareaActivaTactil = 'consumo';

function inicializarVistaTactil() {
  const g = loteActual;
  if (!g || rolActual !== 'galponero') return;

  document.body.classList.add('modo-galponero');
  document.getElementById('vistaGalponeroTactil').style.display = 'block';
  document.getElementById('semanasContainer').style.display = 'none'; 

    // Llenar el select de Consumo (Solo categoría 'alimento')
  const selectConsumo = document.getElementById('tactilConsumoSelect');
  if (selectConsumo) {
    const alimentos = productosDisponibles.filter(p => p.categoria === 'alimento');
    selectConsumo.innerHTML = '<option value="">Seleccione...</option>' + 
      alimentos.map(p => `<option value="${p.nombre}">${p.nombre}</option>`).join('');
  }

  // Llenar el select de Medicinas (Solo categoría 'medicina')
  const selectMed = document.getElementById('tactilMedSelect');
  if (selectMed) {
    const medicinas = productosDisponibles.filter(p => p.categoria === 'medicina');
    selectMed.innerHTML = '<option value="">Seleccione...</option>' + 
      medicinas.map(p => `<option value="${p.nombre}">${p.nombre}</option>`).join('');
  }

  // 1. Generar dinámicamente las pestañas según el tipo de crianza
  const tabsTareas = document.getElementById('tabsTareasTactil');
  let botonesHTML = '';
  
  botonesHTML += `<button class="tab-tactil" id="tabBtnConsumo" onclick="cambiarTareaTactil('consumo')">Consumo</button>`;
  botonesHTML += `<button class="tab-tactil" id="tabBtnMortalidad" onclick="cambiarTareaTactil('mortalidad')">Mortalidad</button>`;
  
  if (g.tipo === 'ponedora' || g.tipo === 'reproductora') {
    botonesHTML += `<button class="tab-tactil" id="tabBtnProduccion" onclick="cambiarTareaTactil('produccion')">Producción</button>`;
  }
  
  botonesHTML += `<button class="tab-tactil" id="tabBtnMedicacion" onclick="cambiarTareaTactil('medicacion')">Medicación</button>`;
  botonesHTML += `<button class="tab-tactil" id="tabBtnOtros" onclick="cambiarTareaTactil('otros')">Otros</button>`;
  
  tabsTareas.innerHTML = botonesHTML;
    // Mostrar u ocultar mortalidad de machos según el tipo
  const filaMachos = document.getElementById('filaMortMachos');
  if (filaMachos) {
    filaMachos.style.display = (g.tipo === 'reproductora') ? 'flex' : 'none';
  }

  // 2. Generar los inputs de Producción si es Ponedora o Reproductora
  if (g.tipo === 'ponedora' || g.tipo === 'reproductora') {
    generarInputsProduccion(g.tipo);
  }

  // 3. Activar la primera pestaña por defecto
  cambiarTareaTactil('consumo');

  // 4. Configurar fecha inicial
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  fechaTactilActual = hoy.getFullYear() + '-' + String(hoy.getMonth()+1).padStart(2,'0') + '-' + String(hoy.getDate()).padStart(2,'0');
  
  actualizarFechaTactil();
}

function generarInputsProduccion(tipo) {
  const cont = document.getElementById('contenedorHuevos');
  let html = '';
  
  if (tipo === 'ponedora') {
    html += crearFilaHuevo('tactilHuevoComercial', 'HUEVO COMERCIAL');
  } else if (tipo === 'reproductora') {
    html += crearFilaHuevo('tactilHuevoFertil', 'HUEVO FÉRTIL');
    html += crearFilaHuevo('tactilHuevoComercial', 'HUEVO COMERCIAL');
    html += crearFilaHuevo('tactilHuevoExtra', 'HUEVO EXTRA');
    html += crearFilaHuevo('tactilHuevoRoto', 'HUEVOS ROTOS');
  }
  cont.innerHTML = html;
}

function crearFilaHuevo(id, label) {
  return `
    <div class="fila-tactil">
      <div class="label-tactil">${label}</div>
      <div class="botonera-tactil">
        <button type="button" onclick="restarTactil('${id}', 10)">−</button>
        <input type="number" id="${id}" value="0" inputmode="numeric">
        <button type="button" onclick="sumarTactil('${id}', 10)">+</button>
      </div>
    </div>
  `;
}

function cambiarTareaTactil(tarea) {
  tareaActivaTactil = tarea;
  
  // Apagar todos los botones y ocultar todos los paneles
  document.querySelectorAll('#tabsTareasTactil .tab-tactil').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.grid-tactil-nuevo').forEach(p => p.style.display = 'none');

  // Encender el botón y panel seleccionado
  const btn = document.getElementById(`tabBtn${tarea.charAt(0).toUpperCase() + tarea.slice(1)}`);
  if (btn) btn.classList.add('active');
  
  const panel = document.getElementById(`tarea${tarea.charAt(0).toUpperCase() + tarea.slice(1)}`);
  if (panel) panel.style.display = 'flex';
}



function cambiarDiaTactil(dias) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  let fechaActual = new Date(fechaTactilActual + 'T00:00:00');
  fechaActual.setDate(fechaActual.getDate() + dias);
  
  // Validación: No permitir fechas futuras
  if (fechaActual > hoy) {
    mostrarToast('No puedes registrar a futuro.', 'advertencia');
    return;
  }
  
  // Validación: No permitir fechas anteriores al ingreso del lote
  const ingreso = new Date(loteActual.fechaIngreso + 'T00:00:00');
  if (fechaActual < ingreso) return;

  fechaTactilActual = fechaActual.getFullYear() + '-' + String(fechaActual.getMonth()+1).padStart(2,'0') + '-' + String(fechaActual.getDate()).padStart(2,'0');
  actualizarFechaTactil();
}

function actualizarFechaTactil() {
  const g = loteActual;
  const fechaObj = new Date(fechaTactilActual + 'T00:00:00');
  const contenedorBotones = document.getElementById('botonesAccionTactil');
  if (contenedorBotones) contenedorBotones.style.display = 'flex'; 
  // Formatear fecha
  const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  let texto = fechaObj.toLocaleDateString('es-ES', opciones);
  texto = texto.charAt(0).toUpperCase() + texto.slice(1);
  document.getElementById('fechaTactilHoy').textContent = texto;

  // Llenar cabecera
  const galpon = galponDeLote(g);
  document.getElementById('nombreGranjaTactil').textContent = granjaActual.nombre;
  document.getElementById('tactilGalponNombre').textContent = galpon.nombre;
  document.getElementById('tactilLoteNum').textContent = g.numero;
  document.getElementById('tactilNumAves').textContent = g.numInicial.toLocaleString('es');
  document.getElementById('tactilRaza').textContent = g.raza;
  document.getElementById('tactilTipo').textContent = nombresTipo[g.tipo];
  
  // Cargar datos existentes de este día
  const entradas = registrosSimple[g.id] || {};
  const datos = entradas[fechaTactilActual] || {};
  
  document.getElementById('tactilMortH').value = datos.mortH || 0;
  document.getElementById('tactilMortM').value = datos.mortM || 0;
  document.getElementById('tactilPeso').value = datos.peso || 0;
  document.getElementById('tactilTemp').value = datos.tempMax || 0;
  document.getElementById('tactilHumedad').value = datos.humedad || 0;
  consumosTactilesTemp = datos.consumos ? [...datos.consumos] : [];
renderizarConsumoTactil();
  medicinasTactilesTemp = datos.medicinas ? [...datos.medicinas] : [];
  renderizarMedicinasTactiles();

  // 🔒 LÓGICA DE BLOQUEO (SI YA SE GUARDÓ)
  const yaGuardado = !!entradas[fechaTactilActual];
  const inputs = ['tactilMortH', 'tactilMortM', 'tactilCons', 'tactilCons2', 'tactilPeso', 'tactilTemp', 'tactilHumedad'];
  
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = yaGuardado;
      el.style.opacity = yaGuardado ? '0.6' : '1';
    }
  });

  // Ocultar los botones de + y - y el botón de guardar
  document.querySelectorAll('.botonera-tactil button').forEach(btn => {
    btn.style.display = yaGuardado ? 'none' : 'flex';
  });
  document.querySelectorAll('.btn-add-med').forEach(btn => {
    btn.style.display = yaGuardado ? 'none' : 'block';
  });
  
  const btnGuardar = document.querySelector('.btn-guardar-tactil');
  if (btnGuardar) {
    btnGuardar.style.display = yaGuardado ? 'none' : 'block';
    btnGuardar.textContent = yaGuardado ? 'Día guardado' : 'Guardar';
  }

  // Si está guardado, deshabilitar la selección de medicinas
  const selectMed = document.getElementById('tactilMedSelect');
  const cantMed = document.getElementById('tactilMedCant');
  if (selectMed) selectMed.disabled = yaGuardado;
  if (cantMed) cantMed.disabled = yaGuardado;

  // Al final de todo, actualizamos el total
  actualizarTotalHuevos();
}

function cambiarPestanaTactil(pestana) {
  document.querySelectorAll('.tab-tactil').forEach(b => b.classList.remove('active'));
  
  if (pestana === 'primario') {
    document.getElementById('tabBtnPrimario').classList.add('active');
    document.getElementById('contenidoPrimario').style.display = 'flex';
    document.getElementById('contenidoMedicacion').style.display = 'none';
  } else if (pestana === 'medicacion') {
    document.getElementById('tabBtnMedicacion').classList.add('active');
    document.getElementById('contenidoPrimario').style.display = 'none';
    document.getElementById('contenidoMedicacion').style.display = 'flex';
  }
}

function sumarTactil(idInput, cantidad = 1) {
  const input = document.getElementById(idInput);
  if (!input) return;
  let valor = parseFloat(input.value) || 0;
  input.value = valor + cantidad;
  
  if (idInput.startsWith('tactilHuevo')) actualizarTotalHuevos();
}

function restarTactil(idInput, cantidad = 1) {
  const input = document.getElementById(idInput);
  if (!input) return;
  let valor = parseFloat(input.value) || 0;
  if (valor - cantidad >= 0) {
    input.value = valor - cantidad;
  }
  
  if (idInput.startsWith('tactilHuevo')) actualizarTotalHuevos();
}

function actualizarTotalHuevos() {
  let total = 0;
  const camposHuevos = ['tactilHuevoFertil', 'tactilHuevoComercial', 'tactilHuevoExtra', 'tactilHuevoRoto'];
  
  camposHuevos.forEach(id => {
    const input = document.getElementById(id);
    if (input) total += parseInt(input.value) || 0;
  });

  const spanTotal = document.getElementById('tactilTotalHuevos');
  if (spanTotal) spanTotal.textContent = total;
}
function agregarMedicinaTactil() {
  const select = document.getElementById('tactilMedSelect');
  const cantInput = document.getElementById('tactilMedCant');
  const med = select.value;
  const cant = parseFloat(cantInput.value) || 0;

  if (!med) { mostrarToast('Selecciona un medicamento.', 'advertencia'); return; }
  if (cant <= 0) { mostrarToast('La dosis debe ser mayor a 0.', 'advertencia'); return; }

  // Evitar duplicados
  const existente = medicinasTactilesTemp.findIndex(m => m.nombre === med);
  if (existente !== -1) {
    medicinasTactilesTemp[existente].cantidad += cant;
  } else {
    medicinasTactilesTemp.push({ nombre: med, cantidad: cant });
  }

  select.value = '';
  cantInput.value = 0;
  renderizarMedicinasTactiles();
}

function eliminarMedicinaTactil(index) {
  medicinasTactilesTemp.splice(index, 1);
  renderizarMedicinasTactiles();
}

function renderizarMedicinasTactiles() {
  const cont = document.getElementById('listaMedicinasTactil');
  if (!cont) return;
  
  if (medicinasTactilesTemp.length === 0) {
    cont.innerHTML = '<div class="sub" style="text-align:center;">No hay medicinas agregadas para este día.</div>';
    return;
  }

  cont.innerHTML = medicinasTactilesTemp.map((m, i) => `
    <div class="fila-tactil" style="background:var(--azul-claro); margin-bottom:5px;">
      <div class="label-tactil" style="text-transform:none; font-weight:normal;">${m.nombre}</div>
      <div style="font-weight:bold; font-size:18px; margin-right:15px;">${m.cantidad}</div>
      <button type="button" onclick="eliminarMedicinaTactil(${i})" style="background:var(--rojo); color:white; width:35px; height:35px; border-radius:50%; border:none; font-size:16px; cursor:pointer;">✕</button>
    </div>
  `).join('');
}

async function guardarTactil() {
  const g = loteActual;
  if (!g) return;

  // 1. Capturar todos los valores
  const mortH = parseInt(document.getElementById('tactilMortH')?.value) || 0;
  const mortM = parseInt(document.getElementById('tactilMortM')?.value) || 0;
  const cons = parseFloat(document.getElementById('tactilCons')?.value) || 0;
  const cons2 = parseFloat(document.getElementById('tactilCons2')?.value) || 0;
  const peso = parseFloat(document.getElementById('tactilPeso')?.value) || null;
  const temp = parseFloat(document.getElementById('tactilTemp')?.value) || null;
  const humedad = parseFloat(document.getElementById('tactilHumedad')?.value) || null;

  let huevoComercial = 0, huevoFertil = 0, huevoExtra = 0, huevoRoto = 0;
  if (g.tipo === 'ponedora' || g.tipo === 'reproductora') {
    huevoComercial = parseInt(document.getElementById('tactilHuevoComercial')?.value) || 0;
    huevoFertil = parseInt(document.getElementById('tactilHuevoFertil')?.value) || 0;
    huevoExtra = parseInt(document.getElementById('tactilHuevoExtra')?.value) || 0;
    huevoRoto = parseInt(document.getElementById('tactilHuevoRoto')?.value) || 0;
  }

  // 2. Validación
  const entradas = registrosSimple[g.id] || (registrosSimple[g.id] = {});
  let saldoActual = g.tipo === 'reproductora' ? (g.numInicialH + g.numInicialM) : g.numInicial;
  const claves = Object.keys(entradas).filter(k => k < fechaTactilActual).sort();
  claves.forEach(k => {
    saldoActual -= (entradas[k].mortH || 0) + (entradas[k].mortM || 0) + (entradas[k].salida || 0);
  });

  if ((mortH + mortM) > saldoActual) {
    mostrarToast(`Error: El saldo es de ${saldoActual} aves.`, 'error');
    return;
  }

  // 3. Crear el objeto de registro
  const nuevoRegistro = {
    lote_id: g.id,
    fecha: fechaTactilActual,
    mortalidad_h: mortH,
    mortalidad_m: mortM,
    consumo_alimento_a: cons,
    consumo_alimento_b: cons2,
    peso_promedio_g: peso,
    temp_max_c: temp,
    humedad_pct: humedad,
    huevo_comercial: huevoComercial,
    huevo_fertil: huevoFertil,
    huevo_extra: huevoExtra,
    huevo_roto: huevoRoto
  };

  // 4. Guardado local inmediato (UI)
  const previo = entradas[fechaTactilActual] || {};
  entradas[fechaTactilActual] = {
    ...previo, mortH, mortM, cons, cons2, peso, tempMax: temp, humedad,
    medicinas: medicinasTactilesTemp, huevoComercial, huevoFertil, huevoExtra, huevoRoto
  };
  actualizarFechaTactil(); 
  mostrarToast('Guardando...', 'info');

  // 5. Intentar guardar en SUPABASE (Nube)
  try {
    const { error } = await supabaseClient
      .from('registros_diarios')
      .upsert([nuevoRegistro], { onConflict: 'lote_id, fecha' });

    if (error) throw error;
    
    mostrarToast('¡Sincronizado con la nube exitosamente!', 'exito');

  } catch (err) {
    console.warn("Sin conexión. Guardando en cola de sincronización.", err);
    
    // 6. Modo Offline: Guardar en LocalStorage si falla la nube
    let colaPendientes = JSON.parse(localStorage.getItem('angy_cola_pendientes') || '[]');
    colaPendientes = colaPendientes.filter(item => !(item.lote_id === g.id && item.fecha === fechaTactilActual));
    colaPendientes.push(nuevoRegistro);
    localStorage.setItem('angy_cola_pendientes', JSON.stringify(colaPendientes));
    
    mostrarToast('Sin internet. Guardado seguro en el celular. Se enviará luego.', 'advertencia', 5000);
  }
}

function salirModoGalponero() {
  document.body.classList.remove('modo-galponero');
  document.getElementById('vistaGalponeroTactil').style.display = 'none';
  document.getElementById('semanasContainer').style.display = 'block';
  volverAGalpones();
}

// Modificar seleccionarLote para activar la vista táctil
const seleccionarLoteOriginal = seleccionarLote;
seleccionarLote = function(id) {
  seleccionarLoteOriginal(id);
  
  setTimeout(() => {
    if (rolActual === 'galponero' && loteActual) {
      inicializarVistaTactil();
    }
  }, 100);
};
  
  // Si es galponero, activar la vista táctil después de que cargue el lote
  setTimeout(() => {
    if (rolActual === 'galponero' && loteActual) {
      inicializarVistaTactil();
    }
  }, 100);
// ============================================================
//  SISTEMA DE LOGIN
// ============================================================
async function iniciarSesion() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    mostrarToast('Por favor, completa todos los campos.', 'advertencia');
    return;
  }

  const btn = document.querySelector('#formLogin button');
  const textoOriginal = btn.textContent;
  btn.textContent = 'Verificando...';
  btn.disabled = true;

  try {
    // 1. Autenticamos con Supabase
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError) throw authError;

    // 2. Buscamos el perfil del usuario en nuestra tabla 'usuarios'
    const { data: userData, error: userError } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    let rolFinal = 'admin'; // Por defecto

    if (userData) {
      rolFinal = userData.rol;
      mostrarToast(`¡Bienvenido, ${userData.nombre}!`, 'exito');
    } else {
      mostrarToast('Usuario autenticado (perfil no encontrado, entrando como Admin).', 'info');
    }

    completarLogin(rolFinal);

  } catch (err) {
    console.error(err);
    mostrarToast('Error al iniciar sesión: ' + (err.message || 'Credenciales incorrectas'), 'error');
  } finally {
    btn.textContent = textoOriginal;
    btn.disabled = false;
  }
}
async function completarLogin(rol) {
  // 🔥 TRUCO: En lugar de mostrar el dashboard, mostramos un mensaje de "Cargando..."
  document.getElementById('pantallaLogin').style.display = 'none';
  
  // Creamos una pantalla de carga rápida (o simplemente usamos un toast)
  mostrarToast('Preparando tu espacio de trabajo...', 'info', 1500);

  // 1. Asignamos el rol
  rolActual = rol;
  
  // 2. Cargamos los datos y aplicamos los permisos ANTES de mostrar nada
  await cargarDatosDesdeNube();
  aplicarRol(); 
  
  // 3. Ahora sí, mostramos la vista correcta
  if (rolActual === 'galponero') {
    volverAGalpones();
  } else {
    mostrarTab('dashboard', document.querySelector('.nav-item[data-tab="dashboard"]'));
    renderDashboardResumen();
  }
}// ============================================================
//  INICIALIZACIÓN Y EXPOSICIÓN GLOBAL
// ============================================================
// ============================================================
//  CARGA DE DATOS DESDE SUPABASE
// ============================================================
async function cargarDatosDesdeNube() {
  try {
    // 1. Traer Granjas
    const { data: dbGranjas, error: errG } = await supabaseClient.from('granjas').select('*');
    if (errG) throw errG;
    granjas = dbGranjas;

    // 2. Traer Galpones
    const { data: dbGalpones, error: errGal } = await supabaseClient.from('galpones').select('*');
    if (errGal) throw errGal;
    galpones = dbGalpones.map(g => ({ ...g, granjaId: g.granja_id }));

    // 3. Traer Lotes (con sus razas)
    const { data: dbLotes, error: errL } = await supabaseClient
      .from('lotes')
      .select('*, razas(nombre, tipo_crianza)');
    if (errL) throw errL;
    
    lotes = dbLotes.map(l => ({
      id: l.id,
      galponId: l.galpon_id,
      numero: l.numero_lote,
      tipo: l.razas.tipo_crianza,
      raza: l.razas.nombre,
      numInicialH: l.aves_iniciales_h,
      numInicialM: l.aves_iniciales_m,
      numInicial: l.aves_iniciales_h + l.aves_iniciales_m,
      fechaIngreso: l.fecha_ingreso,
      finalizado: l.finalizado,
      semana: calcularSemanaDesdeIngreso(l.fecha_ingreso),
      semanaFinal: l.semana_final
    }));
    // Cargar los productos/insumos
    const { data: dbProductos } = await supabaseClient.from('productos').select('*');
    if (dbProductos) {
      productosDisponibles = dbProductos;
    }
    // 4. LÓGICA EXCLUSIVA PARA GALPONERO
    if (rolActual === 'galponero') {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (user) {
        // Buscamos su ID en la tabla usuarios
        const { data: userData, error: errUser } = await supabaseClient
          .from('usuarios')
          .select('id')
          .eq('email', user.email)
          .single();

        if (errUser || !userData) {
          console.error("❌ No se encontró el usuario en la tabla 'usuarios'", errUser);
          galpones = [];
          return;
        }

        console.log("✅ Usuario encontrado. ID:", userData.id);

        // Buscamos las asignaciones
        const { data: asignaciones, error: errAsig } = await supabaseClient
          .from('usuario_galpones')
          .select('galpon_id')
          .eq('usuario_id', userData.id);

        if (errAsig) {
          console.error("❌ Error al buscar asignaciones:", errAsig);
        }

        console.log("✅ Asignaciones encontradas:", asignaciones);

        if (asignaciones && asignaciones.length > 0) {
          const misGalponesIds = asignaciones.map(a => a.galpon_id);
          galpones = galpones.filter(g => misGalponesIds.includes(g.id));
        } else {
          console.warn("⚠️ El usuario no tiene galpones asignados en 'usuario_galpones'.");
          galpones = [];
        }
      }
    }

    // 5. Establecer granja actual
    if (granjas.length > 0) {
      granjaActual = granjas[0];
    }

    // 6. Refrescar pantalla
    actualizarSelectorGranja();
    renderGridGalpones();
    renderDashboardResumen();

  } catch (error) {
    console.error("❌ Error general al cargar datos:", error);
    mostrarToast('Error al cargar datos de la nube.', 'error');
  }
}
// ============================================================
//  SINCRONIZACIÓN AUTOMÁTICA (MODO OFFLINE)
// ============================================================
async function sincronizarPendientes() {
  const colaString = localStorage.getItem('angy_cola_pendientes');
  if (!colaString) return;

  let colaPendientes = JSON.parse(colaString);
  if (colaPendientes.length === 0) return;

  console.log(`Intentando sincronizar ${colaPendientes.length} registros pendientes...`);
  mostrarToast(`Sincronizando ${colaPendientes.length} registros pendientes...`, 'info');

  try {
    // Intentamos subir todos de golpe a Supabase
    const { error } = await supabaseClient
      .from('registros_diarios')
      .upsert(colaPendientes, { onConflict: 'lote_id, fecha' });

    if (error) throw error;

    // Si todo sale bien, vaciamos la cola
    localStorage.removeItem('angy_cola_pendientes');
    mostrarToast('¡Todos los registros pendientes han sido sincronizados!', 'exito');

  } catch (err) {
    console.warn("Aún sin conexión, reintentaremos luego.", err);
  }
}

// Escuchar cuando el navegador recupera la conexión
window.addEventListener('online', () => {
  mostrarToast('Conexión recuperada. Iniciando sincronización...', 'info');
  sincronizarPendientes();
});

// Intentar sincronizar al abrir la app
setTimeout(sincronizarPendientes, 3000); // Esperamos 3 segundos a que cargue todo
// Exponer TODAS las funciones al window
Object.assign(window, {
  mostrarTab,
  volverAGalpones,
  volverAResumenDashboard,
  aplicarRol,
  seleccionarGranja,
  seleccionarLote,
  finalizarLote,
  verHistorialGalpon,
  verDetalleLoteCerrado,
  toggleFormNuevoGalpon,
  crearGalpon,
  toggleFormNuevoLote,
  crearLote,
  actualizarCamposNuevoLote,
  abrirFormHoy,
  guardarHoy,
  cambiarSemana,
  calcular,
  toggleSemana,
  cambiarVistaSemana,
  abrirModalEdicion,
  cerrarModal,
  agregarMedicinaModal,
  eliminarMedicinaModal,
  guardarEdicionModal,
  guardarMedicinaValor,
  marcarNoSugerida,
  agregarTipoCrianza,
  toggleFormNuevoUsuario,
  actualizarCamposUsuario,
  actualizarGalponesUsuario,
  guardarUsuario,
  cambiarDiaTactil,
  cambiarPestanaTactil,
  agregarMedicinaTactil,
  eliminarMedicinaTactil,
  iniciarSesion,
  cerrarSesion,
  // Razas
  toggleFormNuevaRaza,
  agregarFilaGuia,
  agregarFilaManejo,
  guardarNuevaRaza,
  // Dashboard
  mostrarDetalleGalpon,
  renderVistaSemanalGeneral,
  renderVistaDiariaGeneral,
  mostrarToast,
});

// ============================================================
//  VERIFICACIÓN DE SESIÓN AL ARRANCAR (MODO OFFLINE)
// ============================================================
async function verificarSesionActiva() {
  // 1. Mostramos la pantalla de login por defecto (por si no hay sesión)
  document.getElementById('pantallaLogin').style.display = 'flex';

  // 2. Intentamos recuperar la sesión del almacenamiento local
  const { data: { session }, error } = await supabaseClient.auth.getSession();

  if (session && session.user) {
    // ¡Hay una sesión guardada! (El galponero ya se logueó antes en este dispositivo)
    console.log("Sesión activa encontrada. Entrando sin pedir contraseña...");
    
    // Buscamos su rol (si no hay internet, usamos 'admin' como respaldo)
    let rol = 'admin';
    try {
      const { data: userData } = await supabaseClient
        .from('usuarios')
        .select('rol')
        .eq('email', session.user.email)
        .maybeSingle();
        
      if (userData) rol = userData.rol;
    } catch (e) {
      console.warn("No se pudo consultar el rol (offline). Usando rol por defecto.");
    }

    document.getElementById('pantallaLogin').style.display = 'none';
    completarLogin(rol);
  } else {
    // No hay sesión guardada, mostramos el login normal
    console.log("No hay sesión activa. Mostrando login.");
  }
}

// Arrancamos la app llamando al verificador
verificarSesionActiva();
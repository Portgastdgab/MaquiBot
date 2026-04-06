const BASE_SPEECH = Object.freeze({
  MAIN: "Hola, te saluda tu asesor de financiamiento MaquiBot. Me dejaron tu numero por interes en financiamiento. Para ayudarte mejor, ¿que unidad necesitas especificamente?",
  VARIANTS: Object.freeze({
    A: "Hola, te saluda tu asesor de financiamiento MaquiBot. Me dejaron tu numero por tu interes. ¿Que unidad necesitas especificamente?",
    B: "Gracias por escribirnos. Te acompaño con tu evaluacion de financiamiento. Para empezar, ¿que unidad buscas exactamente?",
    C: "Perfecto, avanzamos contigo. Para orientarte bien, dime por favor ¿que unidad necesitas y para cuando?"
  })
});

const FIRST_CALL_SCRIPT = Object.freeze({
  INTRO_TEMPLATE:
    "Hola que tal, le saluda {advisorName}, asesor de financiamiento. Me dejo su numero por messenger interesado en financiar {vehicle}.",
  QUALIFICATION_QUESTIONS: Object.freeze([
    "1) ¿Que unidad esta necesitando especificamente?",
    "2) ¿Para cuando necesita esta unidad?",
    "3) A que se dedica. Brindeme su DNI o su RUC por favor.",
    "4) Minimo requiere el 11.2% del valor de la unidad. ¿Cuenta con esta cantidad o mas?",
    "5) ¿Donde se encuentra usted?",
    "6) Si le damos la aprobacion del financiamiento y esta de acuerdo con las condiciones, ¿puede venir a hacer los tramites esta semana o cuanto tiempo mas podria demorar para viajar a AQP?"
  ]),
  CLOSING_AQP:
    "Le enviaremos una proforma para que revise mensualidad y tiempo, y coordinamos reunion hoy o manana. Cerremos con fecha y hora exacta.",
  CLOSING_OUTSIDE_AQP:
    "Le enviaremos la proforma por WhatsApp con cuota, pago inicial, tiempo y tasa. Luego coordinamos presencial o firma virtual. ¿Cuando podria darme su respuesta positiva con fecha y hora exacta?",
  PROCESS_EXPLANATION:
    "El financiamiento es bajo la modalidad de fondo colectivo, cobramos 3.2% anual y el plazo maximo es de 80 meses. El proceso es: presentar documentos, validar proforma con simulacion de cuota mensual, coordinar reunion presencial para firma de contrato y deposito del pago inicial, y despues de adjudicacion esperar 15 dias para la entrega de la unidad."
});

const VARIANT_KEYS = Object.freeze(Object.keys(BASE_SPEECH.VARIANTS));

function getInitialMessage() {
  return BASE_SPEECH.MAIN;
}

function getVariant(variant = "A") {
  const key = String(variant || "").trim().toUpperCase();
  return BASE_SPEECH.VARIANTS[key] || BASE_SPEECH.VARIANTS.A;
}

function getRandomVariant() {
  const index = Math.floor(Math.random() * VARIANT_KEYS.length);
  return VARIANT_KEYS[index];
}

function buildFirstCallIntro({ advisorName = "Asesor", vehicle = "la unidad de su interes" } = {}) {
  return FIRST_CALL_SCRIPT.INTRO_TEMPLATE.replace("{advisorName}", advisorName).replace("{vehicle}", vehicle);
}

function getQualificationQuestions({ includeTravelQuestion = false } = {}) {
  if (includeTravelQuestion) {
    return [...FIRST_CALL_SCRIPT.QUALIFICATION_QUESTIONS];
  }

  return FIRST_CALL_SCRIPT.QUALIFICATION_QUESTIONS.slice(0, 5);
}

function getClosingSpeech({ inAqp = true } = {}) {
  return inAqp ? FIRST_CALL_SCRIPT.CLOSING_AQP : FIRST_CALL_SCRIPT.CLOSING_OUTSIDE_AQP;
}

function getFinancingProcessSpeech() {
  return FIRST_CALL_SCRIPT.PROCESS_EXPLANATION;
}

module.exports = {
  BASE_SPEECH,
  FIRST_CALL_SCRIPT,
  VARIANT_KEYS,
  getInitialMessage,
  getVariant,
  getRandomVariant,
  buildFirstCallIntro,
  getQualificationQuestions,
  getClosingSpeech,
  getFinancingProcessSpeech
};

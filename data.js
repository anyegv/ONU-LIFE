// =====================================================
// DATOS DEL JUEGO (todos los países y crisis son ficticios)
// Medidores: inf = Influencia, rep = Reputación, ali = Alianzas, est = Estabilidad mundial
// Cada opción tiene efectos (fx) que SUBEN unos medidores y BAJAN otros.
// Una crisis con "requires" solo aparece si se cumple la condición (consecuencias a largo plazo).
// flags: marcas que se guardan y pueden activar crisis posteriores.
// =====================================================
const METERS = {
  inf: { name: 'Influencia', icon: '🏛️' },
  rep: { name: 'Reputación', icon: '🌍' },
  ali: { name: 'Alianzas', icon: '🤝' },
  est: { name: 'Estabilidad', icon: '🕊️' }
};

const crises = [
  {
    title: 'Emergencia alimentaria en Nambara',
    context: 'Una sequía ha dejado sin reservas a miles de familias. Para que la ayuda llegue hay que abrir un corredor humanitario que financiarán sobre todo los miembros permanentes.',
    resolution: 'Autorizar ayuda alimentaria y médica, abrir un corredor humanitario temporal y exigir informes de distribución.',
    positions: {
      for: 'Cada semana de retraso cuesta vidas, y liderar la respuesta mejora tu imagen ante el mundo.',
      against: 'El coste recaería en tu presupuesto y otros países se beneficiarían sin pagar su parte.'
    },
    outcomes: {
      approve: { t: 'Los convoyes entran', x: 'La ayuda llega y se reconoce tu liderazgo, aunque tu ministerio de finanzas protesta por el coste.', fx: { est: 16, rep: 12, inf: -10 } },
      abstain: { t: 'La ayuda sale adelante sin ti', x: 'El texto se aprueba con los votos de otros. Ahorras dinero, pero otros se llevan el crédito.', fx: { est: 10, rep: 0, inf: -2 } },
      veto: { t: 'Corredor bloqueado', x: 'Ahorras recursos, pero la comunidad internacional te señala por frenar una ayuda básica.', fx: { est: -18, rep: -20, inf: 2 }, flag: 'vetoHumanitario' }
    }
  },
  {
    title: 'La operación de tu aliado',
    context: 'Dorvan, tu socio militar más cercano, lanzó una ofensiva que ha dejado cientos de civiles muertos. Varios miembros presentan un texto de condena formal.',
    resolution: 'Condenar la ofensiva, exigir una investigación independiente y pedir el cese de los ataques a zonas pobladas.',
    positions: {
      for: 'Si los aliados quedan exentos, el Consejo pierde toda credibilidad. Hay civiles muertos documentados.',
      against: 'Abandonar a un aliado en público envía una señal de debilidad a todos tus socios y beneficia a tus rivales.'
    },
    outcomes: {
      approve: { t: 'Condenas a tu propio aliado', x: 'Ganas respeto por tu coherencia, pero Dorvan lo vive como una traición y enfría la relación.', fx: { rep: 16, ali: -28, est: 4, inf: -4 } },
      abstain: { t: 'Te mantienes al margen', x: 'La condena pasa. Dorvan agradece que no votaras a favor, pero nadie te ve como un actor firme.', fx: { rep: -4, ali: -6, est: 2 } },
      veto: { t: 'Proteges a Dorvan', x: 'Tus aliados confían más en ti. Pero muchos países lo ven como doble rasero y la investigación no se abre.', fx: { ali: 20, rep: -18, est: -6 }, flag: 'vetoAliado' }
    }
  },
  {
    title: 'Sanciones a Karvia',
    context: 'El gobierno de Karvia aplazó las elecciones indefinidamente y restringió a la prensa. Se propone castigar económicamente a sus altos cargos.',
    resolution: 'Sanciones selectivas a altos cargos, congelación de activos y revisión a los seis meses.',
    positions: {
      for: 'Presionan a quienes deciden sin cortar el comercio básico y envían el mensaje de que aplazar elecciones tiene costes.',
      against: 'Es un asunto interno. Las sanciones pueden endurecer al gobierno, golpear a la población y crear un precedente de injerencia.'
    },
    outcomes: {
      approve: { t: 'Se aprueban las sanciones', x: 'Aumenta la presión y los países occidentales te apoyan. Karvia denuncia injerencia y parte de su población sufre efectos económicos.', fx: { rep: 6, ali: 8, est: -6, inf: -6 }, flag: 'sanciones' },
      abstain: { t: 'Pasan sin tu respaldo', x: 'No frenas la medida, pero tampoco la defiendes. Los dos bandos te piden que aclares tu postura.', fx: { rep: -2, ali: -4, est: 0 } },
      veto: { t: 'Defiendes la soberanía de Karvia', x: 'Los países no alineados te respaldan por evitar el precedente. Otros lo ven como cobertura a un gobierno que silencia a su prensa.', fx: { inf: 10, rep: -10, ali: -6, est: -4 } }
    }
  },
  {
    title: 'Renovar la misión en Belvar',
    context: 'La misión de paz en Belvar mantiene separadas a dos facciones. Renovarla cuesta mucho y tu país es uno de los mayores contribuyentes.',
    resolution: 'Renovar el mandato de la misión de paz por 12 meses con el presupuesto actual.',
    positions: {
      for: 'Sin la misión, la tregua se rompe casi con certeza.',
      against: 'Lleva años sin resolver el conflicto de fondo y los contribuyentes cargan con el gasto.'
    },
    outcomes: {
      approve: { t: 'La misión continúa', x: 'La tregua se sostiene un año más. Pagas la factura y se acumula el cansancio en tu opinión pública.', fx: { est: 16, rep: 6, inf: -16 } },
      abstain: { t: 'Se renueva, con críticas hacia ti', x: 'Ahorras algo en el debate, pero se te acusa de querer que otros paguen mientras tú sigues beneficiándote de la estabilidad.', fx: { est: 8, rep: -6, inf: 0 } },
      veto: { t: 'La misión termina', x: 'Ahorras recursos, pero las facciones retoman los combates en pocas semanas.', fx: { est: -20, rep: -8, inf: 4 }, flag: 'finMision' }
    }
  },
  {
    title: 'Intervención en Tamar',
    context: 'Una milicia amenaza con una masacre en Tamar. Se propone autorizar el uso de la fuerza para proteger a los civiles, con riesgo de que el conflicto se extienda.',
    resolution: 'Autorizar a una coalición a usar todos los medios necesarios para proteger a la población civil de Tamar.',
    positions: {
      for: 'Esperar sería permitir una atrocidad anunciada. La responsabilidad de proteger existe para esto.',
      against: 'Las intervenciones suelen exceder su mandato, y nadie puede garantizar qué pasa después.'
    },
    outcomes: {
      approve: { t: 'Se autoriza la intervención', x: 'La milicia retrocede y se evita la masacre. Pero la operación se complica y se discute si excede el mandato.', fx: { rep: 8, inf: 4, ali: 6, est: -12 }, flag: 'intervencion' },
      abstain: { t: 'La coalición actúa sin tu apoyo', x: 'Te desmarcas del riesgo. La intervención sigue adelante y tu prudencia no convence a nadie del todo.', fx: { rep: 0, ali: -6, est: -4 }, flag: 'intervencion' },
      veto: { t: 'No hay autorización', x: 'Evitas una escalada, pero la milicia ataca y hay víctimas. Se te acusa de haber permitido una masacre.', fx: { est: -10, rep: -14, inf: 2 } }
    }
  },
  {
    title: 'La intervención se complica',
    requires: s => s.flags.intervencion,
    context: 'Meses después, la operación en Tamar sigue abierta. La coalición pide ampliar su mandato. Hay denuncias de excesos y los costes suben.',
    resolution: 'Ampliar seis meses el mandato de la coalición y crear una comisión que investigue los excesos denunciados.',
    positions: {
      for: 'Retirarse ahora dejaría a la población a merced de la milicia, y la comisión corregiría los abusos.',
      against: 'Ampliar sin límite convierte la operación en una ocupación de hecho.'
    },
    outcomes: {
      approve: { t: 'Mandato ampliado con vigilancia', x: 'La comisión investiga y corrige parte de los excesos. Asumes la responsabilidad de seguir en la operación.', fx: { est: 8, rep: 4, inf: -12 } },
      abstain: { t: 'Se amplía sin ti', x: 'La operación continúa y tú te mantienes lejos de un posible fracaso, pero también del control.', fx: { est: 2, ali: -6, inf: -4 } },
      veto: { t: 'La coalición debe retirarse', x: 'La retirada es rápida y desordenada. Hay quienes la celebran y quienes la ven como abandono.', fx: { est: -12, rep: -6, ali: -8, inf: 4 } }
    }
  },
  {
    title: 'Hospitales de Liria',
    context: 'Varios hospitales de Liria colapsan. El mecanismo de suministros propuesto sería gestionado por una agencia dirigida por un país rival tuyo.',
    resolution: 'Crear un mecanismo de coordinación de medicamentos esenciales y acceso seguro del personal médico, gestionado por la agencia regional.',
    positions: {
      for: 'El mecanismo salva vidas ya, y la gestión estará sometida a informes públicos.',
      against: 'Darle el control a tu rival aumenta su influencia en la región durante años.'
    },
    outcomes: {
      approve: { t: 'Llegan los suministros', x: 'Los hospitales se estabilizan. Tu rival gana peso regional y tus aliados se preguntan por qué lo permitiste.', fx: { est: 12, rep: 8, inf: -16, ali: -6 } },
      abstain: { t: 'Se aprueba con tu abstención', x: 'El mecanismo funciona. Ni te llevas el mérito ni asumes el coste completo.', fx: { est: 10, rep: 0, inf: -6 } },
      veto: { t: 'Sin mecanismo', x: 'Frenas el avance de tu rival, pero los hospitales siguen sin recursos y la prensa internacional lo explica así.', fx: { est: -12, rep: -12, inf: 4, ali: 4 } }
    }
  },
  {
    title: 'Armas autónomas',
    context: 'Varios países proponen prohibir los sistemas de armas autónomas capaces de elegir objetivos civiles sin control humano. Tu propio ejército desarrolla algunos.',
    resolution: 'Prohibir los sistemas de armas que seleccionen y ataquen objetivos sin control humano significativo cuando puedan afectar a civiles.',
    positions: {
      for: 'Fijar límites ahora evita una carrera armamentista incontrolable.',
      against: 'Limitaría tus capacidades militares y los rivales pueden no cumplir el acuerdo.'
    },
    outcomes: {
      approve: { t: 'Se aprueba la prohibición', x: 'Ganas prestigio como impulsor de normas, pero tu ejército debe frenar parte de su programa.', fx: { rep: 12, est: 8, inf: -16 } },
      abstain: { t: 'Se aprueba sin ti', x: 'Mantienes margen de maniobra y no pagas el coste de la prohibición, pero tu abstención se interpreta como ambigüedad.', fx: { rep: 2, est: 6, inf: -2 } },
      veto: { t: 'La prohibición se bloquea', x: 'Conservas tu ventaja militar. Muchos países te acusan de poner tus intereses por delante de la seguridad global.', fx: { inf: 12, rep: -12, est: -10 } }
    }
  },
  {
    title: 'Un código para limitar el veto',
    requires: s => s.flags.vetoHumanitario || s.flags.vetoAliado || s.vetoed >= 2,
    context: 'Tras tus vetos, una coalición de países propone un compromiso voluntario: no vetar en casos de atrocidades masivas. Se espera que los permanentes lo suscriban.',
    resolution: 'Adoptar un código voluntario de moderación del veto en casos de genocidio, crímenes de guerra y crímenes de lesa humanidad.',
    positions: {
      for: 'Reduce la parálisis del Consejo en las peores crisis y mejora tu imagen.',
      against: 'Limita tu libertad de decisión y no es vinculante, por lo que sirve más como gesto que como garantía.'
    },
    outcomes: {
      approve: { t: 'Firmas el código', x: 'Tu imagen mejora de inmediato, pero tu margen de maniobra futuro se reduce.', fx: { rep: 20, inf: -20, ali: 6 } },
      abstain: { t: 'Evitas comprometerte', x: 'No lo firmas ni lo bloqueas. Los países que lo promueven siguen sin ver cambios en tu comportamiento.', fx: { rep: 2, inf: -4 } },
      veto: { t: 'Bloqueas el código', x: 'Conservas libertad plena, pero queda claro que valoras más tu veto que cualquier compromiso sobre su uso.', fx: { inf: 6, rep: -24, ali: -10 } }
    }
  }
  ,
  {
    title: 'Ciberataque a la red eléctrica',
    context: 'Un ciberataque dejó sin luz a una región entera de Istrana, incluidos hospitales. Se atribuye a un grupo vinculado a un Estado, pero las pruebas son parciales. Tu país tiene programas ofensivos similares.',
    resolution: 'Condenar el ataque, pedir una investigación técnica independiente y establecer normas contra ataques a infraestructura civil.',
    positions: {
      for: 'Atacar infraestructura civil debe tener consecuencias, y las normas protegen también a tu país.',
      against: 'Las pruebas son débiles y fijar normas limitaría tus propias operaciones.'
    },
    outcomes: {
      approve: { t: 'Se fija una norma', x: 'Ganas credibilidad como defensor de reglas comunes, pero se frenan tus programas ofensivos.', fx: { rep: 12, est: 8, inf: -16 } },
      abstain: { t: 'La norma avanza sin ti', x: 'Evitas atarte las manos. Nadie te considera comprometido con las reglas.', fx: { rep: -2, est: 4, inf: -2 } },
      veto: { t: 'Sin norma ni investigación', x: 'Conservas libertad de acción, pero el ataque queda sin respuesta y se te acusa de proteger a atacantes.', fx: { inf: 10, rep: -12, est: -10 } }
    }
  },
  {
    title: 'Bloqueo de la ruta del grano',
    context: 'Una flota bloquea el puerto de Marden, por donde salen las exportaciones de grano de varios países pobres. Se propone una misión naval de escolta, que enfrentaría a tu rival regional.',
    resolution: 'Autorizar una misión naval de escolta para garantizar el tránsito comercial en el puerto de Marden.',
    positions: {
      for: 'Sin grano, los precios suben y millones pasan hambre.',
      against: 'Una misión naval puede provocar un choque directo entre potencias.'
    },
    outcomes: {
      approve: { t: 'La ruta se reabre', x: 'Bajan los precios y los países importadores te lo agradecen. Un incidente naval deja tensión con tu rival.', fx: { est: 6, rep: 10, ali: 6, inf: -10 } },
      abstain: { t: 'La misión sale sin ti', x: 'Evitas el choque directo, pero otros lideran la solución y tu papel queda en segundo plano.', fx: { est: 4, rep: -2, ali: -4 } },
      veto: { t: 'El puerto sigue bloqueado', x: 'Evitas un choque naval. Los precios se disparan y varios países pobres sufren escasez.', fx: { est: -14, rep: -10, inf: 4 } }
    }
  },
  {
    title: 'Referéndum en Sorrel',
    context: 'La región de Sorrel quiere votar su independencia. El Estado central lo declara ilegal y hay enfrentamientos. Se propone una misión de observación y supervisar un referéndum acordado. Tu país tiene una región con movimientos separatistas.',
    resolution: 'Enviar observadores a Sorrel y pedir una negociación supervisada sobre su estatus político.',
    positions: {
      for: 'Negociar bajo supervisión reduce la violencia y respeta el derecho a decidir.',
      against: 'Abre la puerta a que cualquier región con ganas de separarse apele al Consejo.'
    },
    outcomes: {
      approve: { t: 'Observadores y diálogo', x: 'La violencia baja y el proceso avanza. En casa, tus separatistas piden el mismo trato.', fx: { est: 10, rep: 8, inf: -14, ali: -4 } },
      abstain: { t: 'Se aprueba, con tu distancia', x: 'El proceso arranca. El Estado central te agradece no apoyarlo, pero ya no puedes influir en él.', fx: { est: 6, rep: 0, inf: -4, ali: 2 } },
      veto: { t: 'Sin supervisión', x: 'Proteges la integridad territorial como principio. En Sorrel la violencia crece y el conflicto se endurece.', fx: { est: -12, rep: -6, inf: 6, ali: 6 } }
    }
  },
  {
    title: 'Remitir el caso al tribunal penal',
    context: 'Una investigación apunta a crímenes de guerra cometidos en Velmora por fuerzas de varios bandos. Se propone remitir la situación a la justicia internacional. Algunos de los investigados son socios tuyos.',
    resolution: 'Remitir la situación de Velmora a la corte penal internacional para investigar a todas las partes.',
    positions: {
      for: 'Sin justicia no hay paz duradera y la impunidad anima nuevos crímenes.',
      against: 'Puede cerrar las vías de negociación y salpicar a tus socios.'
    },
    outcomes: {
      approve: { t: 'Se abre la investigación', x: 'Se te reconoce el apoyo a la justicia. Tus socios implicados te lo reprochan y las negociaciones se complican.', fx: { rep: 12, est: 4, ali: -10, inf: -4 } },
      abstain: { t: 'Se remite sin tu apoyo', x: 'La investigación avanza. Tus socios agradecen la distancia, pero no te ganas a nadie.', fx: { rep: 0, est: 2, ali: -4 } },
      veto: { t: 'No hay remisión', x: 'Proteges a tus socios y la mediación sigue abierta. Las víctimas y muchos países lo ven como una forma de encubrir impunidad.', fx: { ali: 10, rep: -12, est: -4, inf: 2 } }
    }
  }
];

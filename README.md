# Dos que bailan

Instrumento visual para interpretar en vivo **Victor's Piano Solo** (*El cadáver de la novia*, Danny Elfman) con agentes autónomos.
Unidad 6 · Simulación · capítulo 5 de *The Nature of Code*.

> El movimiento es **siempre un vals entre dos**: Victor y Emily. No hay coreografía programada. Se abrazan y giran, recorren el salón, se sueltan y se vuelven a encontrar, y todo sale de las reglas de steering de cada uno.

**Algoritmos usados:**
- **Steering behaviors (Reynolds)** para el baile. Es el algoritmo que trabaja con individuos, y un vals es entre dos personas, así que cada bailarín es **un agente**.
- **Flow field** para la luz que flota en el aire del fondo. El entorno cambia solo, y cada partícula lo sigue.

## Cómo verlo

- **En línea (GitHub Pages con GitHub Actions):** el flujo [.github/workflows/pages.yml](.github/workflows/pages.yml) publica la página sola en cada push a `main`. Hay que activarlo una sola vez: Settings → Pages → *Build and deployment* → Source: **GitHub Actions**. Queda en `https://mafora12.github.io/U6_fuerzas/`, y cada publicación se ve en la pestaña **Actions**.
- **En el computador:** los módulos de JavaScript necesitan un servidor local. Desde la carpeta del repo:

  ```bash
  python -m http.server 8000
  ```

  y abrir `http://localhost:8000`.

- **Música:** tu interpretación va en `assets/musica.mp3` (ver [assets/LEEME.md](assets/LEEME.md)).

## Controles

| Control | Qué transforma | Consecuencia en el comportamiento |
|---|---|---|
| **W** | Figura: vals por el salón | Giran juntos y avanzan alrededor del salón por la línea de baile |
| **A** | Figura: vuelta en el sitio | Giro más cerrado y rápido, sin desplazarse |
| **S** | Figura: paseo lado a lado | Dejan de girar y caminan juntos copiando la dirección del otro (alignment) |
| **D** | Figura: vals al revés | Giran hacia el otro lado y recorren el salón en sentido contrario |
| **Q** (sostener) | Soltarse | Se alejan (flee), crece la distancia deseada y cada uno deambula solo. Al soltar Q se buscan y se vuelven a abrazar |
| **Espacio** (tap) | El “1” del compás de 3/4 | Por un momento, más velocidad y un paso más largo alrededor de la pareja: una vuelta más fuerte |
| **↑ / ↓** (sostener) | Abrazo | Distancia de abrazo (0,36 → 0,08) y radio de percepción (0,5 → 1,6) |
| **← / →** (sostener) | Tempo | Velocidad máxima: el vals gira más lento o más rápido |
| **E** | Presencia de Emily | Si se va, dejan de percibirse y Victor sigue sus huellas (path following) |
| **Tab** | Noche azul ↔ salón dorado | Paleta, y fuerza máxima de giro: en el salón, vueltas más amplias |
| Enter / R | Música | Reproducir-pausar / volver al inicio |
| F / H | Utilidades | Pantalla completa / mini ventana que recuerda los controles |

## El sistema

El comportamiento de los bailarines está en [js/couple.js](js/couple.js), la lluvia en [js/rain.js](js/rain.js) y el dibujo en [js/renderer.js](js/renderer.js).

### La luz en el aire: flow field

Las partículas de luz del fondo, que evocan la lluvia de luz de la pintura azul, siguen un **flow field**:

- **El campo:** una rejilla de celdas de 40 px sobre la pantalla. Un ruido suave que cambia con el tiempo decide la dirección de cada celda, en cualquier sentido, así que el campo forma **remolinos** que se transforman lentamente.
- **La regla:** cada una de las 180 partículas es un agente que **solo percibe la celda donde está**. Toma esa dirección como velocidad deseada y gira hacia ella con steering: `fuerza = deseada − actual`, limitada. Además tiene una caída muy leve, como polvo de luz.
- **Vida:** cada partícula vive de 3 a 8 s. Aparece y se desvanece poco a poco, y después renace en un punto al azar. Así la luz queda dispersa y es tenue (opacidad máxima 0,10).
- El campo solo guarda direcciones; la regla con la que cada partícula lo consulta es aparte.

Medido en simulación: las partículas se mueven en todas las direcciones, a ~0,7 px por cuadro, y quedan repartidas por toda la pantalla.

### Qué percibe cada agente (y sus límites)

- **A su pareja:** dónde está y hacia dónde va, **solo si está dentro de su radio de percepción** (depende del abrazo) y solo si Emily está presente. Si no la percibe, la busca deambulando.
- **La pared:** si está a más de 0,8 del centro.
- **Victor, cuando Emily no está:** el camino que ella dejó (sus últimos 600 pasos).

### Cómo calcula su acción

Steering de Reynolds: `fuerza = velocidad deseada − velocidad actual`, limitada por `maxForce`. Cada cuadro suma:

| Comportamiento | Velocidad deseada | Peso |
|---|---|---|
| **Girar con la pareja** (seek a un punto desplazado) | Hacia el punto que está a la distancia del abrazo, un ángulo más adelante alrededor de la pareja | 1,4 × (1 − soltarse) |
| **Arrive a una distancia** | Acercarse si está lejos del abrazo, alejarse si está cerca, frenando al llegar | 0,8 a 1,4 |
| **Flee** | Alejarse de la pareja si está a menos de 0,5 | 0,9 × soltarse |
| **Wander** | Punto al azar sobre un círculo al frente (más fuerte si no ve a la pareja o si están sueltos) | 0,25 a 1,05 |
| **Línea de baile** (seek a un punto adelante sobre el anillo del salón) | Avanzar alrededor del salón, en un sentido (W) o el contrario (D) | 0,9 × peso de W o de D |
| **Alignment** | La misma dirección de la pareja | 1,3 × peso de S |
| **Seek al centro** | Hacia adentro, si está cerca de la pared | crece con la distancia |
| **Path following** | Hacia un punto más adelante en las huellas de Emily | 1,3 × ausencia de Emily |

Además, **nunca se detiene**: la velocidad está entre `minSpeed` y `maxSpeed`.

### Qué emerge

Ninguna regla dice “la pareja gira”, ni hay un líder: los dos son iguales. Cada uno solo da un paso de lado alrededor de donde **percibe** al otro. Como los dos lo hacen a la vez, la pareja **rota sobre un centro común** que ninguno calcula. Según la figura elegida, además avanzan por el salón (W, D), giran en el sitio (A) o pasean juntos sin girar (S). Al cambiar de figura los pesos pasan de unos a otros en un par de segundos, así que el baile se transforma sin saltos.

La rotación más el desplazamiento es un vals, y la huella en el piso lo muestra en espirales. Al soltarse, las mismas reglas con otros pesos los separan. Al volver a percibirse, se reencuentran solos.

## Score visual

| Tiempo | Música | Intención | Intervención |
|---|---|---|---|
| 0:00–0:25 | Agudo, inicio | Victor solo en la noche | Noche azul, Emily ausente, tempo lento |
| 0:25–0:30 | Pasa a grave | Algo aparece | **E**: Emily aparece lejos de Victor |
| 0:30–0:56 | Variado, tema de la película | Se encuentran, empieza el vals | **W** vals por el salón, **↑** abrazo, taps |
| 0:56–1:11 | Más rápido, agudo, fuerte | El vals toma fuerza | **→** tempo, **A** vuelta en el sitio, taps marcados |
| 1:11–1:16 | Baja y se hace agudo | Un respiro | **Q**: se sueltan y cada uno gira solo |
| 1:16–1:32 | Rápido, agudo, angustiante | Tensión: se pierden | Soltar Q, **↓** abrazo, **→** tempo alto, **D** vals al revés |
| 1:32–2:05 | Tranquila, melancólica, tema más lento | Recuerdo del salón | **Tab** salón dorado, **←** tempo lento, **↑** abrazo |
| 2:05–2:22 | Sube la intensidad | El baile crece | **→** tempo, **W** grandes vueltas por el salón, taps |
| 2:22–2:28 | Baja el tono y la velocidad | Suspensión | **Q**: se abren, **←** tempo al mínimo |
| 2:28–2:40 | Sube, dramático | Clímax | Soltar Q: se reencuentran, abrazo y tempo al máximo, taps |
| 2:40–fin | Tranquila y grave | Final | **Tab** a la noche, **E**: Emily se va y Victor sigue sus huellas |

El score es la guía de la intérprete. El programa **no lo sigue solo**: todas las decisiones se toman en vivo, escuchando.

## Predicciones para verificar

| Si cambio… | Predigo… | Medido en simulación |
|---|---|---|
| ↑ abrazo a 0,9 | Se juntan a ~0,09 y giran más rápido | distancia 0,094; 6,6 vueltas en 10 s |
| ↓ abrazo a 0 | Se separan a ~0,3 y giran más lento | distancia 0,304; 4,2 vueltas en 10 s |
| → tempo al máximo | Giran y recorren más | recorrido 4,7 vs 0,2 con tempo 0,1 |
| ← tempo a 0,1 | Vals lento | 3,3 vueltas en 10 s (vs 5,1) |
| Q sostenida | Se abren hasta ~0,6–0,7 | de 0,19 a 0,6 en ~1,5 s |
| Soltar Q | Se vuelven a abrazar | vuelven a 0,19–0,20 en ~1,5 s |
| W (vals por el salón) | Giran y avanzan alrededor del salón | 6,1 vueltas de la pareja y 0,83 vueltas al salón en 12 s |
| A (vuelta en el sitio) | Giran más rápido sin desplazarse | 10,5 vueltas; recorrido 0,55 (vs 2,5 con W) |
| S (paseo) | Dejan de girar y van en la misma dirección | 0,35 vueltas; misma dirección 0,91 (1 = idéntica) |
| D (vals al revés) | Giran y recorren el salón al revés | −5,7 vueltas y −0,68 vueltas al salón |
| E (Emily se va) | Dejan de percibirse y Victor sigue sus huellas | 0 % de percepción, se separan |

## Cómo cumple el encargo

### Lo que pide la actividad 03

| El encargo pide… | Cómo lo cumple | Dónde verlo |
|---|---|---|
| Un instrumento visual **para la Web** | Página HTML + JavaScript sin dependencias, publicada en GitHub Pages con GitHub Actions | [index.html](index.html), [pages.yml](.github/workflows/pages.yml) |
| Interpretar **en tiempo real** una pieza elegida | La simulación corre a 60 pasos por segundo mientras suena la interpretación propia de *Victor's Piano Solo* | [js/main.js](js/main.js), `assets/musica.mp3` |
| **Pantalla completa** para la presentación | Tecla **F** | [js/controls.js](js/controls.js) |
| Usar **solo** steering, flocking, flow fields o Physarum | Steering behaviors de Reynolds para los bailarines (seek, flee, arrive, wander, path following y seek a un punto desplazado) y un flow field para la lluvia | [js/couple.js](js/couple.js), [js/rain.js](js/rain.js) |
| Definir **qué perciben** los agentes y **sus límites** | Cada uno percibe a su pareja solo dentro de un radio que depende del abrazo, y la pared del salón. Victor percibe las huellas de Emily solo cuando ella no está | sección *Qué percibe cada agente*; en pantalla, las manos se toman solo cuando se perciben y están cerca |
| Definir **cómo calculan sus acciones** | Suma ponderada de fuerzas de steering, `fuerza = deseada − actual`, limitada | sección *Cómo calcula su acción* |
| **Comportamiento emergente** y explicar qué aporta la combinación | El giro de la pareja no está programado: sale de que los dos dan un paso de lado alrededor del otro a la vez. Girar + avanzar por la línea de baile = vals que recorre el salón | sección *Qué emerge*; huella en espiral en el piso |
| **Pocos controles expresivos** sobre percepción, reglas o entorno | Percepción: abrazo, E. Reglas: tempo, Q, tap, figura (W A S D). Entorno: Tab | tabla *Controles* |
| **Consecuencias perceptibles** de cada control | Cada control cambia algo medible: distancia, vueltas, recorrido, percepción | tabla *Predicciones* |
| La **interpretación humana** conduce, **sin** secuencia automática **ni análisis del audio** | El programa no escucha el audio ni cambia nada según el tiempo. Cada cambio lo hace la intérprete con el teclado; la tecla **H** solo le recuerda los controles | [js/controls.js](js/controls.js) |
| Un **score visual** que relacione pasajes, intenciones e intervenciones | Tabla con los tiempos marcados escuchando la pieza | sección *Score visual* |
| **Bitácora** con experimentos, decisiones y pruebas | Este README: versiones descartadas, reglas probadas y medidas | sección *Bitácora* |

### Los cuatro criterios de la autoevaluación

1. **Cumplimiento del encargo.** Es tecnología web (HTML + Canvas + JavaScript), corre en tiempo real a pantalla completa y tiene la música integrada en la página. Evidencia: la página en GitHub Pages y el video del ensayo *(por agregar)*.
2. **Comprensión y verificación.** Cada regla está en un método corto y comentado de `couple.js`. En pantalla la percepción se nota: cuando se perciben y están cerca se toman de las manos; si no, cada uno deambula. La tabla *Predicciones* dice qué pasa al cambiar cada parámetro, y cada predicción se midió en simulación antes de probarla en pantalla.
3. **Diseño e intención.** Se eligió steering porque un vals es entre dos individuos. Cada regla tiene un sentido en la historia:
   - girar con la pareja = bailar juntos,
   - arrive = el abrazo,
   - flee + wander = soltarse,
   - línea de baile = recorrer el salón,
   - alignment = pasear juntos,
   - path following = Victor siguiendo el recuerdo de Emily.

   Los dos mundos visuales vienen de las dos pinturas de referencia.
4. **Interpretación humana.** El score conecta cada pasaje con una intención y un control. Los controles son pocos y se sostienen como gestos (flechas, Q) o se eligen con una tecla (W A S D), así que se puede responder a lo que se escucha y a lo que hacen los agentes. Por ejemplo, si se alejan demasiado, se sube el abrazo o se cambia a la vuelta en el sitio (A).

## Bitácora

### Experimentos y decisiones

**2026-09-29, primera versión (descartada).** Combiné los cuatro algoritmos en 3D: dos enjambres, flow field y Physarum. Con tantos puntos de luz no se leía que eran dos personas bailando. Decidí quedarme con **un solo algoritmo**, steering behaviors, y pasar a 2D con perspectiva para que se lea claro.

**2026-09-29, buscando la regla del giro.** Antes de dibujar, simulé sin pantalla y medí cuántas vueltas da la pareja:

| Regla probada | Resultado | Decisión |
|---|---|---|
| Pursuit + mantener distancia | Caminan en paralelo, lado a lado (0 a 0,5 vueltas en 10 s) | Descartada |
| Offset pursuit (quedar a la derecha del otro, según su velocidad) | Giro débil que cambia de sentido (~0,5 vueltas en 10 s) | Descartada: cuando van en la misma dirección, sus objetivos se contradicen |
| **Paso de lado alrededor de la pareja** (seek a un punto desplazado, medido desde la línea que los une) | ~5 vueltas en 10 s, estable, a la distancia de abrazo | **Elegida** |

**2026-09-29, la luz.** Con peso 0,3, la pareja nunca llegaba a la luz en 15 s. Con 0,5 llegaba en ~3,5 s, pero a los puntos lejanos del salón no alcanzaba en 4 s. Ahora el peso crece con la distancia (0,5 a 1,7): llega a las cuatro esquinas en menos de 4 s y el vals no cambia.

**2026-09-29, más baile: soltarse y volver.** Para que no fuera solo girar, agregué **Q** (soltarse), que combina flee + wander y una distancia de abrazo mayor. Medido: con Q se abren de 0,19 a ~0,6 en 1,5 s, y al soltar Q vuelven a 0,19 en ~1,5 s.

**2026-09-29, la lluvia se mueve.** Las rayas de lluvia del fondo estaban quietas. Ahora siguen un **flow field** con ruido que cambia en el tiempo, así que ondulan al azar como pinceladas. Es el segundo algoritmo del proyecto: el baile es steering y el entorno es flow field.

**2026-09-30, la lluvia era demasiado visible.** Al verla en pantalla, la lluvia quedaba muy marcada y poco dispersa. La cambié por partículas de luz tenues que flotan en remolinos (el campo apunta en cualquier dirección). Cada partícula aparece, se desvanece y renace en un lugar al azar.

**2026-09-30, figuras de baile en vez de la luz.** La pareja solo se movía hacia la luz y eso no se veía como un baile. Quité la luz y el mouse. Ahora **W A S D eligen figuras**: vals por el salón, vuelta en el sitio, paseo lado a lado y vals al revés. Cada figura es otra mezcla de pesos de las mismas reglas de steering (más la línea de baile y alignment). Medidas en la tabla *Predicciones*.

- *(fecha)*: …

### Ensayos
- *(fecha)*: …

## Autoevaluación

| Criterio | Puntos (0–25) | Evidencia |
|---|---|---|
| 1. Cumplimiento del encargo | | |
| 2. Comprensión y verificación | | |
| 3. Diseño e intención | | |
| 4. Interpretación humana | | |
| **Total** | **/100** | |

## Referencias

- Daniel Shiffman, *The Nature of Code*, cap. 5, Autonomous Agents.
- Craig Reynolds, *Steering Behaviors for Autonomous Characters* (seek, flee, arrive, wander, offset pursuit, path following, flow field following).
- Tyler Hobbs, *Flow Fields*.
- Referencias visuales: pintura de una pareja bailando bajo la luna (azul) y pintura de un salón de baile (dorado).

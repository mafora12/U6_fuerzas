# Dos que bailan

Instrumento visual para interpretar en vivo **Victor's Piano Solo** (*El cadáver de la novia*, Danny Elfman) con agentes autónomos.
Unidad 6 · Simulación · capítulo 5 de *The Nature of Code*.

> El movimiento es **siempre un vals entre dos**: Victor y Emily. No hay coreografía programada. Se abrazan y giran, recorren el salón, se sueltan y se vuelven a encontrar, y todo sale de las reglas de steering de cada uno.

**Algoritmo elegido: steering behaviors (Reynolds).** De los cuatro algoritmos permitidos, es el único que trabaja con individuos. Flocking modela multitudes, flow fields el entorno y Physarum redes. Un vals es entre dos personas, así que cada bailarín es **un agente**.

## Cómo verlo

- **En línea (GitHub Pages):** Settings → Pages → *Deploy from a branch* → `main` / `root`. Queda en `https://mafora12.github.io/U6_fuerzas/`.
- **En el computador:** los módulos de JavaScript necesitan un servidor local. Desde la carpeta del repo:

  ```bash
  python -m http.server 8000
  ```

  y abrir `http://localhost:8000`.

- **Música:** tu interpretación va en `assets/musica.mp3` (ver [assets/LEEME.md](assets/LEEME.md)).

## Controles

| Control | Qué transforma | Consecuencia en el comportamiento |
|---|---|---|
| **W A S D** (sostener) o **mouse** | La luz del salón | Los dos la buscan (seek), más fuerte mientras más lejos está: así se lleva a la pareja por todo el salón sin que deje de girar |
| **Q** (sostener) | Soltarse | Se alejan (flee), crece la distancia deseada y cada uno deambula solo. Al soltar Q se buscan y se vuelven a abrazar |
| **Espacio** (tap) | El “1” del compás de 3/4 | Por un momento, más velocidad y un paso más largo alrededor de la pareja: una vuelta más fuerte |
| **↑ / ↓** (sostener) | Abrazo | Distancia de abrazo (0,36 → 0,08) y radio de percepción (0,5 → 1,6) |
| **← / →** (sostener) | Tempo | Velocidad máxima: el vals gira más lento o más rápido |
| **E** | Presencia de Emily | Si se va, dejan de percibirse y Victor sigue sus huellas (path following) |
| **Tab** | Noche azul ↔ salón dorado | Paleta, y fuerza máxima de giro: en el salón, vueltas más amplias |
| Enter / R | Música | Reproducir-pausar / volver al inicio |
| F / H / V | Utilidades | Pantalla completa / panel con el score / ver la percepción |

## El sistema

Todo el comportamiento está en [js/couple.js](js/couple.js). El dibujo está en [js/renderer.js](js/renderer.js).

### Qué percibe cada agente (y sus límites)

- **A su pareja:** dónde está y hacia dónde va, **solo si está dentro de su radio de percepción** (depende del abrazo) y solo si Emily está presente. Si no la percibe, la busca deambulando.
- **La luz del salón:** su posición.
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
| **Seek a la luz** | Hacia la luz del salón | 0,5 a 1,7 (según la distancia) |
| **Seek al centro** | Hacia adentro, si está cerca de la pared | crece con la distancia |
| **Path following** | Hacia un punto más adelante en las huellas de Emily | 1,3 × ausencia de Emily |

Además, **nunca se detiene**: la velocidad está entre `minSpeed` y `maxSpeed`.

### Qué emerge

Ninguna regla dice “la pareja gira”, ni hay un líder: los dos son iguales. Cada uno solo da un paso de lado alrededor de donde **percibe** al otro. Como los dos lo hacen a la vez, la pareja **rota sobre un centro común** que ninguno calcula. Mientras tanto, la luz los lleva por el salón.

La rotación más el desplazamiento es un vals, y la huella en el piso lo muestra en espirales. Al soltarse, las mismas reglas con otros pesos los separan. Al volver a percibirse, se reencuentran solos.

## Score visual

| Tiempo | Música | Intención | Intervención |
|---|---|---|---|
| 0:00–0:25 | Agudo, inicio | Victor solo en la noche | Noche azul, Emily ausente, tempo lento |
| 0:25–0:30 | Pasa a grave | Algo aparece | **E**: Emily aparece lejos de Victor |
| 0:30–0:56 | Variado, tema de la película | Se encuentran, empieza el vals | **WASD**: llevar la luz entre los dos, **↑** abrazo, taps |
| 0:56–1:11 | Más rápido, agudo, fuerte | El vals toma fuerza | **→** tempo, **WASD**: recorrer el salón, taps marcados |
| 1:11–1:16 | Baja y se hace agudo | Un respiro | **Q**: se sueltan y cada uno gira solo |
| 1:16–1:32 | Rápido, agudo, angustiante | Tensión: se pierden | Soltar Q, **↓** abrazo, **→** tempo alto, luz a los bordes |
| 1:32–2:05 | Tranquila, melancólica, tema más lento | Recuerdo del salón | **Tab** salón dorado, **←** tempo lento, **↑** abrazo |
| 2:05–2:22 | Sube la intensidad | El baile crece | **→** tempo, **WASD**: grandes vueltas por el salón, taps |
| 2:22–2:28 | Baja el tono y la velocidad | Suspensión | **Q**: se abren, **←** tempo al mínimo |
| 2:28–2:40 | Sube, dramático | Clímax | Soltar Q: se reencuentran, abrazo y tempo al máximo, taps |
| 2:40–fin | Tranquila y grave | Final | **Tab** a la noche, **E**: Emily se va y Victor sigue sus huellas |

El panel (**H**) muestra el pasaje actual como guía. **No cambia nada solo**: todas las decisiones se toman en vivo, escuchando.

## Predicciones para verificar (tecla V)

Con **V** se ven:
- el radio de percepción de Victor (verde = percibe a Emily, rojo = no),
- la distancia de abrazo alrededor de Emily,
- la velocidad de cada uno,
- el punto que cada uno está buscando (✕).

| Si cambio… | Predigo… | Medido en simulación |
|---|---|---|
| ↑ abrazo a 0,9 | Se juntan a ~0,09 y giran más rápido | distancia 0,094; 6,6 vueltas en 10 s |
| ↓ abrazo a 0 | Se separan a ~0,3 y giran más lento | distancia 0,304; 4,2 vueltas en 10 s |
| → tempo al máximo | Giran y recorren más | recorrido 4,7 vs 0,2 con tempo 0,1 |
| ← tempo a 0,1 | Vals lento | 3,3 vueltas en 10 s (vs 5,1) |
| Q sostenida | Se abren hasta ~0,6–0,7 | de 0,19 a 0,6 en ~1,5 s |
| Soltar Q | Se vuelven a abrazar | vuelven a 0,19–0,20 en ~1,5 s |
| WASD: luz a las 4 esquinas | La pareja llega a cada una bailando | llega en < 4 s a cada punto, sin cambiar la distancia (0,19) |
| E (Emily se va) | Dejan de percibirse y Victor sigue sus huellas | 0 % de percepción, se separan |

## Cómo cumple el encargo

### Lo que pide la actividad 03

| El encargo pide… | Cómo lo cumple | Dónde verlo |
|---|---|---|
| Un instrumento visual **para la Web** | Página HTML + JavaScript sin dependencias, publicable en GitHub Pages | [index.html](index.html) |
| Interpretar **en tiempo real** una pieza elegida | La simulación corre a 60 pasos por segundo mientras suena la interpretación propia de *Victor's Piano Solo* | [js/main.js](js/main.js), `assets/musica.mp3` |
| **Pantalla completa** para la presentación | Tecla **F** | [js/controls.js](js/controls.js) |
| Usar **solo** steering, flocking, flow fields o Physarum | Solo steering behaviors de Reynolds: seek, flee, arrive, wander, path following y seek a un punto desplazado | [js/couple.js](js/couple.js) |
| Definir **qué perciben** los agentes y **sus límites** | Cada uno percibe a su pareja solo dentro de un radio que depende del abrazo, la luz y la pared. Victor percibe las huellas de Emily solo cuando ella no está | sección *Qué percibe cada agente*; tecla **V** |
| Definir **cómo calculan sus acciones** | Suma ponderada de fuerzas de steering, `fuerza = deseada − actual`, limitada | sección *Cómo calcula su acción* |
| **Comportamiento emergente** y explicar qué aporta la combinación | El giro de la pareja no está programado: sale de que los dos dan un paso de lado alrededor del otro a la vez. Girar + seguir la luz = vals que recorre el salón | sección *Qué emerge*; huella en espiral en el piso |
| **Pocos controles expresivos** sobre percepción, reglas o entorno | Percepción: abrazo, E. Reglas: tempo, Q, tap. Entorno: luz (WASD/mouse), Tab | tabla *Controles* |
| **Consecuencias perceptibles** de cada control | Cada control cambia algo medible: distancia, vueltas, recorrido, percepción | tabla *Predicciones* |
| La **interpretación humana** conduce, **sin** secuencia automática **ni análisis del audio** | El programa no escucha el audio ni cambia nada según el tiempo. El score solo se muestra como guía; cada cambio lo hace la intérprete con el teclado | [js/score.js](js/score.js) (solo texto) |
| Un **score visual** que relacione pasajes, intenciones e intervenciones | Tabla con los tiempos marcados escuchando la pieza, también visible en vivo con **H** | sección *Score visual* |
| **Bitácora** con experimentos, decisiones y pruebas | Este README: versiones descartadas, reglas probadas y medidas | sección *Bitácora* |

### Los cuatro criterios de la autoevaluación

1. **Cumplimiento del encargo.** Es tecnología web (HTML + Canvas + JavaScript), corre en tiempo real a pantalla completa y tiene la música integrada en la página. Evidencia: la página en GitHub Pages y el video del ensayo *(por agregar)*.
2. **Comprensión y verificación.** Cada regla está en un método corto y comentado de `couple.js`. La tecla **V** muestra en vivo qué percibe cada agente y qué punto busca. La tabla *Predicciones* dice qué pasa al cambiar cada parámetro, y cada predicción se midió en simulación antes de probarla en pantalla.
3. **Diseño e intención.** Se eligió steering porque un vals es entre dos individuos. Cada regla tiene un sentido en la historia:
   - girar con la pareja = bailar juntos,
   - arrive = el abrazo,
   - flee + wander = soltarse,
   - seek a la luz = recorrer el salón,
   - path following = Victor siguiendo el recuerdo de Emily.

   Los dos mundos visuales vienen de las dos pinturas de referencia.
4. **Interpretación humana.** El score conecta cada pasaje con una intención y un control. Los controles son pocos y se sostienen como gestos (flechas, WASD, Q), así que se puede responder a lo que se escucha y a lo que hacen los agentes. Por ejemplo, si se alejan demasiado, se sube el abrazo o se les lleva la luz.

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

**2026-09-29, más baile: soltarse y volver.** Para que no fuera solo girar, agregué **Q** (soltarse), que combina flee + wander y una distancia de abrazo mayor. También agregué **WASD** para mover la luz con el teclado. Medido: con Q se abren de 0,19 a ~0,6 en 1,5 s, y al soltar Q vuelven a 0,19 en ~1,5 s.

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
- Craig Reynolds, *Steering Behaviors for Autonomous Characters* (seek, flee, arrive, wander, offset pursuit, path following).
- Referencias visuales: pintura de una pareja bailando bajo la luna (azul) y pintura de un salón de baile (dorado).

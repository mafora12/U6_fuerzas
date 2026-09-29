# Dos que bailan

Instrumento visual para interpretar en vivo **Victor's Piano Solo** (*El cadáver de la novia*, Danny Elfman) con agentes autónomos.
Unidad 6 · Simulación · capítulo 5 de *The Nature of Code*.

> El movimiento es **siempre un vals entre dos**: Victor y Emily. No hay coreografía programada: el giro de la pareja emerge de las reglas de steering de cada uno.

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
| **Espacio** (tap) | El “1” del compás de 3/4 | Por un momento, más velocidad y un paso más largo alrededor de la pareja: una vuelta más fuerte |
| **↑ / ↓** (sostener) | Abrazo | Distancia de abrazo (0,36 → 0,08) y radio de percepción (0,5 → 1,6) |
| **← / →** (sostener) | Tempo | Velocidad máxima: el vals gira más lento o más rápido |
| **Mouse** | La luz del salón | Los dos la buscan suavemente (seek): así se lleva a la pareja por el salón |
| **E** | Presencia de Emily | Si se va, dejan de percibirse y Victor sigue sus huellas (path following) |
| **Tab** | Noche azul ↔ salón dorado | Paleta, y fuerza máxima de giro: en el salón, vueltas más amplias |
| Enter / R | Música | Reproducir-pausar / volver al inicio |
| F / H / D | Utilidades | Pantalla completa / panel con el score / ver la percepción |

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
| **Girar con la pareja** (seek a un punto desplazado) | Hacia el punto que está a la distancia del abrazo, un ángulo más adelante alrededor de la pareja | 1,4 |
| **Arrive a una distancia** | Acercarse si está lejos del abrazo, alejarse si está cerca, frenando al llegar | 0,8 |
| **Wander** | Punto al azar sobre un círculo al frente (más fuerte si no ve a la pareja) | 0,25 / 0,9 |
| **Seek a la luz** | Hacia la luz del salón | 0,5 |
| **Seek al centro** | Hacia adentro, si está cerca de la pared | crece con la distancia |
| **Path following** | Hacia un punto más adelante en las huellas de Emily | 1,3 × ausencia de Emily |

Además, **nunca se detiene**: la velocidad está entre `minSpeed` y `maxSpeed`.

### Qué emerge

Ninguna regla dice “la pareja gira”, ni hay un líder: los dos son iguales. Cada uno solo da un paso de lado alrededor de donde **percibe** al otro. Como los dos lo hacen a la vez, la pareja **rota sobre un centro común** que ninguno calcula. Al mismo tiempo, la luz los lleva por el salón. La rotación más el desplazamiento es un vals. La huella en el piso lo muestra: espirales.

## Score visual

| Tiempo | Música | Intención | Intervención |
|---|---|---|---|
| 0:00–0:25 | Agudo, inicio | Victor solo en la noche | Noche azul, Emily ausente, tempo lento |
| 0:25–0:30 | Pasa a grave | Algo aparece | **E**: Emily aparece, la luz lejos de Victor |
| 0:30–0:56 | Variado, tema de la película | Se encuentran, empieza el vals | Llevar la luz entre los dos, **↑** abrazo, taps |
| 0:56–1:11 | Más rápido, agudo, fuerte | El vals toma fuerza | **→** más tempo, taps marcados |
| 1:11–1:16 | Baja y se hace agudo | Un respiro | **↓** se sueltan un poco |
| 1:16–1:32 | Rápido, agudo, angustiante | Tensión: se pierden | **↓** mucho, **→** tempo alto, luz a los bordes |
| 1:32–2:05 | Tranquila, melancólica, tema más lento | Recuerdo del salón | **Tab** salón dorado, **←** tempo lento, **↑** abrazo |
| 2:05–2:22 | Sube la intensidad | El baile crece | **→** y taps cada vez más fuertes |
| 2:22–2:28 | Baja el tono y la velocidad | Suspensión | **←** tempo al mínimo |
| 2:28–2:40 | Sube, dramático | Clímax | Abrazo y tempo al máximo, taps |
| 2:40–fin | Tranquila y grave | Final | **Tab** a la noche, **E**: Emily se va y Victor sigue sus huellas |

El panel (**H**) muestra el pasaje actual como guía. **No cambia nada solo**: todas las decisiones se toman en vivo, escuchando.

## Predicciones para verificar (tecla D)

Con **D** se ven:
- el radio de percepción de Victor (verde = percibe a Emily, rojo = no),
- la distancia de abrazo alrededor de Emily,
- la velocidad de cada uno,
- el punto que cada uno está buscando (✕).

| Si cambio… | Predigo… | Medido en simulación |
|---|---|---|
| ↑ abrazo a 0,9 | Se juntan a ~0,09 y giran más rápido | distancia 0,098; 6,3 vueltas en 10 s |
| ↓ abrazo a 0 | Se separan a ~0,33 y giran más lento | distancia 0,309; 4,3 vueltas en 10 s |
| → tempo al máximo | Giran y recorren más | recorrido 5,0 vs 0,2 con tempo 0,1 |
| ← tempo a 0,1 | Vals lento | 3,4 vueltas en 10 s (vs 5,2) |
| Mover la luz a (0,5; 0,3) | La pareja viaja hacia allá sin dejar de girar | llega en ~3,5 s, 9,3 vueltas en 15 s |
| E (Emily se va) | Dejan de percibirse y Victor sigue sus huellas | 0 % de percepción, se separan |

## Bitácora

### Experimentos y decisiones

**2026-09-29, primera versión (descartada).** Combiné los cuatro algoritmos en 3D: dos enjambres, flow field y Physarum. Con tantos puntos de luz no se leía que eran dos personas bailando. Decidí quedarme con **un solo algoritmo**, steering behaviors, y pasar a 2D con perspectiva para que se lea claro.

**2026-09-29, buscando la regla del giro.** Antes de dibujar, simulé sin pantalla y medí cuántas vueltas da la pareja:

| Regla probada | Resultado | Decisión |
|---|---|---|
| Pursuit + mantener distancia | Caminan en paralelo, lado a lado (0 a 0,5 vueltas en 10 s) | Descartada |
| Offset pursuit (quedar a la derecha del otro, según su velocidad) | Giro débil que cambia de sentido (~0,5 vueltas en 10 s) | Descartada: cuando van en la misma dirección, sus objetivos se contradicen |
| **Paso de lado alrededor de la pareja** (seek a un punto desplazado, medido desde la línea que los une) | ~5 vueltas en 10 s, estable, a la distancia de abrazo | **Elegida** |

**2026-09-29, la luz.** Con peso 0,3, la pareja nunca llegaba a la luz en 15 s. Con 0,5 llega en ~3,5 s y el vals no cambia (9,3 vueltas en 15 s, misma distancia). Quedó en 0,5.

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
- Craig Reynolds, *Steering Behaviors for Autonomous Characters* (seek, arrive, wander, offset pursuit, path following).
- Referencias visuales: pintura de una pareja bailando bajo la luna (azul) y pintura de un salón de baile (dorado).

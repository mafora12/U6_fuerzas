# Dos que bailan

**Instrumento visual para interpretar en vivo *Victor's Piano Solo* de *El cadáver de la novia*, de Danny Elfman, usando agentes autónomos.**

**Unidad 6 · Simulación · Capítulo 5 de *The Nature of Code***

---

## ¿De qué trata?

La idea del proyecto es convertir la interpretación de una pieza musical en un baile que se construye en tiempo real.

El movimiento está pensado como un **vals entre dos personas: Victor y Emily**. No hice una coreografía que diga exactamente dónde debe estar cada personaje. En cambio, cada uno funciona como un agente autónomo que toma decisiones a partir de lo que puede percibir del otro.

Se abrazan, se separan, giran, recorren el salón y vuelven a encontrarse. Todo esto aparece a partir de las reglas de **steering** que tiene cada agente.

Además del baile, el entorno también está construido con sistemas autónomos:

* **Steering behaviors:** controlan el movimiento de Victor y Emily.
* **Flow field:** controla las partículas de luz que flotan en el fondo.
* **Physarum:** genera la red de luz de la luna.

La intención es que la persona que interpreta la pieza pueda controlar algunos aspectos del sistema mientras escucha la música, sin que el programa analice automáticamente el audio.

---

## Cómo verlo

### En línea

[**Abrir la experiencia en GitHub Pages**](https://mafora12.github.io/U6_fuerzas/)

### En el computador

Los módulos de JavaScript necesitan ejecutarse desde un servidor local.

Desde la carpeta del repositorio:

```bash
python -m http.server 8000
```

Después abrir:

```text
http://localhost:8000
```

### Música

La interpretación utilizada está en:

`assets/musica.mp3`

Para más información sobre el archivo de audio:

[Ver instrucciones de música](assets/LEEME.md)

---

# Controles

Los controles son pocos porque la idea es que puedan utilizarse mientras se escucha la música.

| Control          | Qué cambia         | Qué pasa                                                                                    |
| ---------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| **W**            | Vals por el salón  | Victor y Emily giran juntos y avanzan alrededor del salón.                                  |
| **A**            | Vuelta en el sitio | El giro se vuelve más cerrado y rápido, sin desplazarse tanto.                              |
| **S**            | Paseo lado a lado  | Dejan de girar y caminan juntos siguiendo la dirección del otro.                            |
| **D**            | Vals al revés      | Giran hacia el otro lado y recorren el salón en sentido contrario.                          |
| **Q** (sostener) | Soltarse           | Se alejan y cada uno empieza a deambular por separado.                                      |
| **Espacio**      | Tap / pulso        | Marca el “1” del compás de 3/4, genera un pequeño impulso en el baile y hace latir la luna. |
| **↑ / ↓**        | Abrazo             | Cambia la distancia entre los dos y su radio de percepción.                                 |
| **← / →**        | Tempo              | Hace que el baile vaya más lento o más rápido.                                              |
| **E**            | Presencia de Emily | Emily desaparece y Victor deja de percibirla. Entonces sigue las huellas que ella dejó.     |
| **Tab**          | Ambiente           | Cambia entre la noche azul y el salón dorado.                                               |
| **Enter**        | Música             | Reproduce o pausa la música.                                                                |
| **F / H**        | Utilidades         | Pantalla completa / ventana con recordatorio de controles.                                  |

---

# El sistema

Cada parte de la simulación está separada para que las reglas sean más fáciles de entender y modificar.

* [Pareja y steering — `js/couple.js`](js/couple.js)
* [Partículas y flow field — `js/rain.js`](js/rain.js)
* [Luna y Physarum — `js/moon.js`](js/moon.js)
* [Dibujo — `js/renderer.js`](js/renderer.js)
* [Controles — `js/controls.js`](js/controls.js)
* [Programa principal — `js/main.js`](js/main.js)

---

## La luna: Physarum

La superficie de la luna está construida como un mapa de rastro de **96 × 96** en el que se mueven agentes Physarum.

Actualmente hay **2500 agentes** trabajando sobre este mapa.

Cada agente:

* percibe el rastro en tres sensores;
* tiene un sensor al frente y dos a los lados;
* gira hacia el sensor que tiene más rastro;
* avanza y deposita nuevo rastro;
* no puede salir del disco de la luna.

El mapa de rastro se difunde y se evapora constantemente. De esta manera, ningún agente dibuja directamente una vena, sino que la red aparece como resultado de la interacción de todos ellos.

El resultado es una **red de luz que cambia sola**.

Cuando se hace un tap, los agentes se aceleran y depositan más rastro, haciendo que la luna tenga un pulso visual relacionado con el compás.

[Ver código de la luna](js/moon.js)

---

## La luz en el aire: Flow field

Las partículas del fondo representan pequeñas luces flotando en el aire.

Estas partículas siguen un **flow field**.

El campo está formado por una rejilla de celdas de aproximadamente 40 px. La dirección de cada celda cambia con un ruido suave a lo largo del tiempo, creando pequeños remolinos.

Cada partícula:

1. detecta la dirección de la celda donde está;
2. utiliza esa dirección como velocidad deseada;
3. calcula una fuerza de steering;
4. gira gradualmente hacia esa dirección;
5. desaparece después de unos segundos;
6. vuelve a aparecer en otro punto.

Hay aproximadamente **230 partículas**.

La intención es que la luz se sienta dispersa y viva, en lugar de parecer una lluvia de líneas quietas.

[Ver código del flow field](js/rain.js)

---

# Los bailarines

Victor y Emily son agentes independientes.

No existe un personaje que tenga programado:

> “gira alrededor de Emily”.

En cambio, los dos utilizan las mismas reglas y reaccionan a lo que perciben.

### ¿Qué percibe cada agente?

Cada bailarín puede percibir:

* **A su pareja:** solamente si está dentro de su radio de percepción.
* **La pared:** cuando se acerca demasiado al límite del salón.
* **Las huellas de Emily:** Victor puede seguirlas cuando Emily desaparece.

La percepción también cambia con el abrazo. Cuando están más cerca, el radio de percepción aumenta.

[Ver código de los bailarines](js/couple.js)

---

## ¿Cómo calculan sus acciones?

La base del movimiento es el steering de Reynolds:

```text
fuerza = velocidad deseada - velocidad actual
```

La fuerza está limitada para evitar movimientos demasiado bruscos.

Las principales reglas son:

| Comportamiento          | Qué hace                                                     |                    Peso |
| ----------------------- | ------------------------------------------------------------ | ----------------------: |
| **Girar con la pareja** | Busca un punto desplazado alrededor de la pareja.            |    1,4 × (1 − soltarse) |
| **Arrive**              | Se acerca o se aleja hasta alcanzar la distancia del abrazo. |               0,8 – 1,4 |
| **Flee**                | Se aleja cuando están demasiado cerca.                       |          0,9 × soltarse |
| **Wander**              | Deambula cuando no encuentra a la pareja.                    |             0,25 – 1,05 |
| **Línea de baile**      | Hace que la pareja recorra el salón.                         |       0,9 × peso de W/D |
| **Alignment**           | Intenta seguir la dirección de la pareja.                    |         1,3 × peso de S |
| **Seek al centro**      | Evita que el agente choque con la pared.                     |         Según distancia |
| **Path following**      | Victor sigue las huellas de Emily.                           | 1,3 × ausencia de Emily |

Además, los bailarines nunca se quedan completamente quietos. Su velocidad se mantiene entre `minSpeed` y `maxSpeed`.

---

# ¿Qué emerge?

Lo más importante del sistema es que **el vals no está programado directamente**.

Los dos agentes son iguales y ninguno funciona como líder.

Cada uno simplemente intenta desplazarse alrededor del otro según lo que está percibiendo. Como ambos hacen esto al mismo tiempo, aparece una rotación alrededor de un centro común.

Cuando además se combina con la línea de baile, la pareja puede recorrer el salón mientras gira.

Por eso:

* **W** produce un vals que recorre el salón.
* **A** produce una vuelta más cerrada.
* **S** hace que caminen juntos.
* **D** invierte el sentido del vals.
* **Q** cambia el comportamiento para que se separen.
* Al soltar **Q**, vuelven a buscarse.

La combinación de estas reglas genera el comportamiento de pareja sin necesidad de programar una coreografía completa.

[Ver implementación del comportamiento](js/couple.js)

---

# Score visual

El score funciona como una guía para la persona que interpreta la música.

El programa **no sigue automáticamente estos tiempos**. La intérprete escucha la pieza y decide cuándo intervenir.

| Tiempo    | Música                | Intención                         | Intervención                                            |
| --------- | --------------------- | --------------------------------- | ------------------------------------------------------- |
| 0:00–0:25 | Inicio                | Victor está solo en la noche.     | Noche azul, Emily ausente, tempo lento.                 |
| 0:25–0:30 | Cambio a grave        | Algo aparece.                     | **E:** aparece Emily.                                   |
| 0:30–0:56 | Tema de la película   | Se encuentran y comienza el vals. | **W**, **↑**, taps.                                     |
| 0:56–1:11 | Más rápido            | El vals toma fuerza.              | **→**, **A**, taps marcados.                            |
| 1:11–1:16 | Baja la intensidad    | Respiro.                          | **Q:** se separan.                                      |
| 1:16–1:32 | Rápido y angustiante  | Se pierden.                       | Soltar Q, **↓**, **→**, **D**.                          |
| 1:32–2:05 | Más tranquila         | Recuerdo del salón.               | **Tab**, **←**, **↑**.                                  |
| 2:05–2:22 | Aumenta la intensidad | El baile crece.                   | **→**, **W**, taps.                                     |
| 2:22–2:28 | Baja                  | Suspensión.                       | **Q**, **←**.                                           |
| 2:28–2:40 | Dramático             | Clímax.                           | Soltar Q, abrazo, tempo máximo, taps.                   |
| 2:40–fin  | Tranquila y grave     | Final.                            | **Tab**, **E**: Emily se va y Victor sigue sus huellas. |

[Ver la guía completa del score](#score-visual)

---

# Predicciones y pruebas

Antes de probar los cambios visualmente, hice mediciones para comprobar si las reglas estaban produciendo el comportamiento esperado.

| Cambio         | Predicción                    | Resultado medido                                       |
| -------------- | ----------------------------- | ------------------------------------------------------ |
| ↑ abrazo a 0,9 | Se juntan y giran más rápido. | Distancia 0,094; 6,6 vueltas en 10 s.                  |
| ↓ abrazo a 0   | Se separan y giran más lento. | Distancia 0,304; 4,2 vueltas en 10 s.                  |
| → tempo máximo | Giran y recorren más.         | Recorrido 4,7 vs 0,2 con tempo 0,1.                    |
| ← tempo a 0,1  | Vals lento.                   | 3,3 vueltas en 10 s.                                   |
| Q sostenida    | Se separan.                   | De 0,19 a 0,6 en aproximadamente 1,5 s.                |
| Soltar Q       | Se vuelven a encontrar.       | Regresan a 0,19–0,20 en aproximadamente 1,5 s.         |
| W              | Giran y recorren el salón.    | 6,1 vueltas de pareja y 0,83 vueltas al salón en 12 s. |
| A              | Giran más sin desplazarse.    | 10,5 vueltas; recorrido 0,55.                          |
| S              | Caminan juntos.               | 0,35 vueltas; misma dirección 0,91.                    |
| D              | Giran en sentido contrario.   | −5,7 vueltas y −0,68 vueltas al salón.                 |
| E              | Dejan de percibirse.          | 0 % de percepción; se separan.                         |

---

# Cómo cumple el encargo

## Actividad 03

| El encargo pide                           | Cómo se cumple                                                                   | Evidencia                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------- |
| Un instrumento visual para la Web         | Página HTML + JavaScript publicada en GitHub Pages.                              | [Ver implementación](#como-verlo)           |
| Interpretar una pieza en tiempo real      | La simulación corre mientras suena la interpretación de *Victor's Piano Solo*.   | [Ver sistema](#el-sistema)                  |
| Pantalla completa                         | Se puede activar con **F**.                                                      | [Ver controles](#controles)                 |
| Utilizar steering, flow fields o Physarum | Se utilizan los tres sistemas en diferentes partes de la experiencia.            | [Ver algoritmos](#el-sistema)               |
| Definir qué perciben los agentes          | La percepción depende de la pareja, el radio y la presencia de Emily.            | [Ver percepción](#que-percibe-cada-agente)  |
| Explicar cómo calculan sus acciones       | Se utilizan fuerzas de steering ponderadas.                                      | [Ver acciones](#como-calculan-sus-acciones) |
| Mostrar comportamiento emergente          | El vals aparece a partir de las reglas de los dos agentes.                       | [Ver comportamiento emergente](#que-emerge) |
| Tener pocos controles expresivos          | W, A, S, D, Q, flechas, E, Tab y Espacio modifican percepción, reglas o entorno. | [Ver controles](#controles)                 |
| Mostrar consecuencias perceptibles        | Los cambios fueron medidos en simulación.                                        | [Ver predicciones](#predicciones-y-pruebas) |
| Interpretación humana                     | El programa no analiza el audio ni sigue automáticamente el score.               | [Ver score](#score-visual)                  |
| Tener un score visual                     | Los tiempos, intenciones y controles están organizados en una tabla.             | [Ver score](#score-visual)                  |
| Documentar experimentos y decisiones      | Se registran las pruebas y cambios realizados durante el desarrollo.             | [Ver bitácora](#bitacora)                   |

---

# Autoevaluación

La autoevaluación se divide en los cuatro criterios principales de la actividad.

| Criterio                          |      Puntos | Evidencia                                 |
| --------------------------------- | ----------: | ----------------------------------------- |
| **1. Cumplimiento del encargo**   |   **25/25** | [Ver evidencia](#como-cumple-el-encargo)  |
| **2. Comprensión y verificación** |   **25/25** | [Ver evidencia](#predicciones-y-pruebas)  |
| **3. Diseño e intención**         |   **25/25** | [Ver evidencia](#que-emerge)              |
| **4. Interpretación humana**      |   **25/25** | [Ver evidencia](#score-visual)            |
| **TOTAL**                         | **100/100** | [Ver evidencias](#como-cumple-el-encargo) |

---

# Bitácora

Esta sección reúne los cambios más importantes que hice durante el proceso y por qué los hice.

## Primera versión — 29/09/2026

Inicialmente combiné los cuatro algoritmos en 3D: dos enjambres, flow field y Physarum.

El problema fue que había tantos puntos de luz que no se entendía claramente que eran dos personas bailando.

Por eso decidí quedarme con el **steering behaviors para el baile** y pasar a una representación 2D con perspectiva.

---

## Buscando la regla del giro — 29/09/2026

Antes de hacer la parte visual probé diferentes reglas para encontrar una forma estable de hacer que los personajes giraran.

| Regla                               | Resultado                          | Decisión     |
| ----------------------------------- | ---------------------------------- | ------------ |
| Pursuit + mantener distancia        | Caminaban en paralelo.             | Descartada.  |
| Offset pursuit                      | Giro débil y cambio de sentido.    | Descartada.  |
| Paso de lado alrededor de la pareja | Aproximadamente 5 vueltas en 10 s. | **Elegida.** |

La tercera opción fue la que mejor produjo el movimiento que buscaba para el vals.

---

## La luz — 29/09/2026

Probé diferentes pesos para hacer que los personajes pudieran llegar a la luz.

Con un peso de 0,3 la pareja no llegaba a la luz en 15 segundos.

Con 0,5 llegaba aproximadamente en 3,5 segundos, pero todavía tenía problemas para alcanzar los puntos más lejanos.

Finalmente hice que el peso aumentara dependiendo de la distancia.

---

## Soltarse y volver — 29/09/2026

Agregué **Q** para que la pareja pudiera separarse.

La acción combina `flee`, `wander` y una distancia de abrazo mayor.

El resultado medido fue:

* con Q: de 0,19 a aproximadamente 0,6 en 1,5 s;
* al soltar Q: regreso a 0,19 en aproximadamente 1,5 s.

---

## La lluvia se mueve — 29/09/2026

Al principio las partículas del fondo estaban quietas.

Las cambié para que siguieran un **flow field** que cambia con el tiempo.

Después reduje su presencia porque se veían demasiado marcadas. Finalmente quedaron como partículas de luz más pequeñas y dispersas.

---

## Figuras de baile — 30/09/2026

La pareja inicialmente solo se movía hacia la luz y esto no se veía realmente como un baile.

Quité la interacción con el mouse y convertí **W, A, S y D** en diferentes figuras:

* W: vals por el salón.
* A: vuelta en el sitio.
* S: paseo lado a lado.
* D: vals al revés.

Todas utilizan las mismas reglas de steering, pero con diferentes pesos.

---

## El problema del zigzag — 30/09/2026

Durante las pruebas noté que los bailarines se movían de una manera demasiado brusca.

En W, S y D la dirección de Victor saltaba entre 7 y 9° por cuadro.

La autocorrelación del giro era de −0,85, lo que mostraba un comportamiento de zigzag.

Para solucionarlo agregué:

* **inercia**;
* un límite para la suma total de fuerzas;
* un `wander` más tranquilo;
* una velocidad suavizada para el dibujo.

Después del cambio, el temblor bajó:

* W: **7,4° → 1,7°**
* D: **6,8° → 2,5°**
* autocorrelación: **−0,85 → +0,98**

También agregué el pulso del compás con la tecla Espacio.

---

## Cambios de tempo y abrazo — 30/09/2026

Amplié los rangos de:

* tempo: **0,003–0,017**
* abrazo: **0,42–0,07**

También hice más visible el efecto del tap y agregué el comportamiento de Physarum a la luna.

---

## La luna saltaba demasiado — 30/09/2026

Los bailarines saltaban demasiado con el compás y los taps.

Bajé la elevación y reduje el empuje de velocidad para que los cambios fueran progresivos.

Con taps cada 1,5 segundos, la velocidad ya no cambia más de un 5 % entre cuadros.

---

## La luna era demasiado blanca — 30/09/2026

En una prueba encontré que aproximadamente el 98 % de la luna estaba saturado en blanco.

El problema era que el fondo se repintaba con transparencia y la luz se acumulaba cuadro tras cuadro.

La solución fue:

* limpiar el disco de la luna en cada cuadro;
* reducir el halo;
* pintar solamente las venas principales.

Después del cambio, el contraste pasó de aproximadamente **5 a 71 en la noche** y de **62 en el salón**.

---

# Ensayos

Esta sección queda para registrar las pruebas realizadas directamente con la interpretación.

* *(fecha):* …

---

# Referencias

* Daniel Shiffman, *The Nature of Code*, capítulo 5: **Autonomous Agents**.
* Craig Reynolds, *Steering Behaviors for Autonomous Characters*.
* Tyler Hobbs, *Flow Fields*.
* Referencias visuales: pintura de una pareja bailando bajo la luna y pintura de un salón de baile.

---

## Archivos principales

| Archivo                              | Función                                         |
| ------------------------------------ | ----------------------------------------------- |
| [`index.html`](index.html)           | Página principal.                               |
| [`js/main.js`](js/main.js)           | Inicialización y ejecución del sistema.         |
| [`js/couple.js`](js/couple.js)       | Agentes de Victor y Emily y reglas de steering. |
| [`js/rain.js`](js/rain.js)           | Partículas y flow field.                        |
| [`js/moon.js`](js/moon.js)           | Sistema Physarum de la luna.                    |
| [`js/renderer.js`](js/renderer.js)   | Dibujo de la experiencia.                       |
| [`js/controls.js`](js/controls.js)   | Controles de interacción.                       |
| [`assets/LEEME.md`](assets/LEEME.md) | Información sobre la música.                    |

---

# En resumen

**Dos que bailan** es un instrumento visual en el que el movimiento no está completamente predeterminado.

Victor y Emily funcionan como agentes autónomos y, a partir de reglas simples de percepción y steering, generan un baile que puede cambiar mientras la persona interpreta la música.

La intención fue que los algoritmos no fueran solamente una parte técnica del proyecto, sino que cada uno tuviera una función dentro de la experiencia:

* **Steering** → los personajes y su relación.
* **Flow field** → el movimiento de la luz.
* **Physarum** → la red de la luna.
* **Controles humanos** → la interpretación de la música.

El resultado busca que el comportamiento visual se sienta como algo que está ocurriendo en el momento y no como una animación que simplemente se reproduce.


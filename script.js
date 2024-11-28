// script.js

function createSnowflake() {
  const calendar = document.getElementById('calendar');
  const snowflake = document.createElement('div');
  snowflake.className = 'snowflake';
  snowflake.textContent = '❄';
  snowflake.style.left = Math.random() * (calendar.offsetWidth + 100) - 100 + 'px'; // Innerhalb von #calendar
  snowflake.style.animationDuration = Math.random() * 7 + 3 + 's'; // Langsamer
  snowflake.style.fontSize = Math.random() * 10 + 10 + 'px';

  calendar.appendChild(snowflake);

  snowflake.addEventListener('animationend', () => {
    snowflake.classList.add('resting');
  });
}


async function createCalendar() {
  const calendar = document.getElementById('calendar');

  // Zentrales Display erstellen
  const centerDisplay = document.createElement('div');
  centerDisplay.id = 'center-display';
  calendar.appendChild(centerDisplay);

  centerDisplay.addEventListener('click', () => {
    centerDisplay.style.display = 'none'; // Versteckt den Text
  });

  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const month = currentDate.getMonth();

  if (month !== 10) {
    calendar.innerHTML = '<p>This calendar is only active in November!</p>';
    return;
  }

  try {
    const response = await fetch('content.json');
    const data = await response.json();

    const openedDoors = JSON.parse(localStorage.getItem('openedDoors')) || [];
    let lastOpenedDoor = null;

    const positions = generatePositions(data.length, calendar.offsetWidth, calendar.offsetHeight, 90);

    data.forEach((item, index) => {
      const door = document.createElement('div');
      door.classList.add('door');
      door.textContent = item.day;

      door.style.left = `${positions[index].x}px`;
      door.style.top = `${positions[index].y}px`;

      const content = document.createElement('div');
      content.classList.add('door-content');
      content.textContent = item.content;

      if (item.link) {
        const link = document.createElement('a');
        link.href = item.link;
        link.textContent = "Click here!";
        link.target = "_blank";
        link.style.display = 'block';
        link.style.marginTop = '10px';
        content.appendChild(link);
      }

      if (openedDoors.includes(item.day)) {
        door.classList.add('open');
      }

      door.addEventListener('click', () => {
        if (item.day <= currentDay) {
          for (let i = 0; i < 400; i++) {
            createSnowflake();
          }
          if (lastOpenedDoor) {
            lastOpenedDoor.classList.remove('last-open');
          }

          const rect = door.getBoundingClientRect();
          const centerRect = centerDisplay.getBoundingClientRect();

          centerDisplay.textContent = item.content;
          if (item.link) {
            const link = document.createElement('a');
            link.href = item.link;
            link.textContent = "Mehr Infos";
            link.target = "_blank";
            link.style.display = 'block';
            link.style.marginTop = '10px';
            centerDisplay.appendChild(link);
          }
          centerDisplay.style.display = 'block';

          centerDisplay.style.setProperty('--start-x', `${rect.left + rect.width / 2}px`);
          centerDisplay.style.setProperty('--start-y', `${rect.top + rect.height / 2}px`);
          centerDisplay.style.setProperty('--end-x', `${centerRect.left + centerRect.width / 2}px`);
          centerDisplay.style.setProperty('--end-y', `${centerRect.top + centerRect.height / 2}px`);
          centerDisplay.classList.add('moving');

          centerDisplay.addEventListener('animationend', () => {
            centerDisplay.classList.remove('moving');
          });

          if (!openedDoors.includes(item.day)) {
            openedDoors.push(item.day);
            localStorage.setItem('openedDoors', JSON.stringify(openedDoors));
          }

          door.classList.add('open');
          lastOpenedDoor = door;
        } else {
          alert("You can't open this door yet!");
        }
      });

      door.appendChild(content);
      calendar.appendChild(door);
    });
  } catch (error) {
    console.error('Error loading calendar content:', error);
    calendar.innerHTML = '<p>Failed to load calendar content.</p>';
  }
}



// Funktion zur Erzeugung nicht überlappender Positionen
function generatePositions(count, width, height, size) {
  let positions = [];
  let maxAttempts = 50; // Maximale Anzahl an Versuchen, um eine Position zu finden
  let attempts = 0;

  while (positions.length < count) {
    // Zufällige Position generieren
    const x = Math.random() * (width - size);
    const y = Math.random() * (height - size);

    // Prüfen, ob sich die neue Position mit bestehenden überlappt
    const overlap = positions.some(
        pos => Math.abs(pos.x - x) < size && Math.abs(pos.y - y) < size
    );

    if (!overlap) {
      // Position hinzufügen, wenn sie gültig ist
      positions.push({ x, y });
      attempts = 0; // Zurücksetzen, da eine Position gefunden wurde
    } else {
      attempts++; // Versuchszähler erhöhen
    }

    // Wenn zu viele erfolglose Versuche, Fallback verwenden
    if (attempts > maxAttempts) {
      console.warn('Switching to fallback positioning...');

      // Rasterbasierte Positionierung
      positions = fallbackGridPositions(count, width, height, size);
      break; // Beende die while-Schleife, da die Fallback-Positionierung fertig ist
    }
  }

  return positions;
}

// Fallback: Rasterbasierte Positionierung
function fallbackGridPositions(count, width, height, size) {
  const positions = [];

  // Berechne die Anzahl der Spalten und Reihen, um das Raster zu erstellen
  let cols = Math.floor(width / size); // Maximale Anzahl der Spalten
  let rows = Math.ceil(count / cols); // Berechne die benötigten Reihen basierend auf der Anzahl der Türchen

  // Berechne die tatsächliche Breite und Höhe des Rasters
  const totalWidth = cols * size;
  const totalHeight = rows * size;

  // Berechne das Padding, um das Raster im Container zu zentrieren
  const horizontalPadding = (width - totalWidth) / 2;
  const verticalPadding = (height - totalHeight) / 2;

  // Setze die Startpositionen mit Padding
  let x = horizontalPadding;
  let y = verticalPadding;

  for (let i = 0; i < count; i++) {
    positions.push({ x, y });

    // Nächste Position im Raster
    x += size;

    // Wenn die Spalte voll ist, springe zur nächsten Zeile
    if (x + size > width - horizontalPadding) {
      x = horizontalPadding;
      y += size;
    }

    // Wenn der Platz im Raster nicht ausreicht
    if (y + size > height - verticalPadding) {
      console.error('Not enough space in the fallback grid.');
      break;
    }
  }

  return positions;
}




// Kalender initialisieren
createCalendar();

'use strict';

/*  NOTE-:  I have used user stories strategy to plan this project and it is generally good for only small & medium sized projects. 
USer Stories-: Description of the application's functionality from the user's perspective. All user stories put together describes  the entire application*/

/* (v.v.v.imp.) PROJECT PLANNING-: 
USER STORIES => FEATURES =>  FLOWCHARt(what we will build) => ARCHITECTURE(How we will build) 
User Stories-: 1-: As a user i want to log my running workouts with location, distance, time, pace and steps/minute, So i can keep a note of all my running workouts. 
2-: As a user i want to log my cycling workouts with location, distance, time, speed and elevation gain, So i can keep a note of all my cycling workouts. 
3-: As a user i want to see all my workouts at a glance, So i can track my progress over time.
4-: As a user i want to see all my workouts on a map.
5-: As a user i want all my workouts when I leave the app and come back again.     */

/* Features Required based on User Stories-: 1 a-: Map where user clicks to add a new workout(best way to get location coordinates)
1 b-: Geolocation to display the workouts on the map.
1 c-: form to get inputs like distance, duration, pace and steps/minute
2-: form to get inputs like distance, duration, speed and elevation gain
3-: display all the workouts in a list and user should be able to track the workout item in the list.
4-: display all the workouts on the map
5-: save user data into a local storage or somewhere to get that data back when a user re-enters the app.   */
// Flowchart Based on fetaures-: LOOK at the flowchart image.

// Design basic architecture in the starting or just start some coding to get feel(or how things gonna happen) to build a good architecture.

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(distance, duration, coords) {
    this.distance = distance; // in Km
    this.duration = duration; // in min.
    this.coords = coords; // [lat, lng]
  }
  //Running on April 14
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class running extends Workout {
  type = 'running';

  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this._calcPace();
    this._setDescription();
  }

  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class cycling extends Workout {
  type = 'cycling';

  constructor(distance, duration, coords, elevation) {
    super(distance, duration, coords);
    this.elevation = elevation;
    this._calcSpeed();
    this._setDescription();
  }

  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

const run1 = new running(5, 23, [45, 8], 4);
const cycling1 = new cycling(43, 76, [76, 5], 8);

///////////////////////////////////////
// App Architecture-:

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let mapEvent, map;

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;

  constructor() {
    // get position
    this._getPosition();

    // get data from local Storage
    this._getLocalStorage();

    // attach event listener
    inputType.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Your Position cannot be determined!');
        }
      );
    console.log(this);
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;

    // show form-:
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // clear input fields
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        '';
    inputDistance.focus();

    form.classList.add('hidden');
    form.style.display = 'none';
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');

    inputDistance.focus();
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const positiveInputs = (...inputs) => inputs.every(inp => inp > 0);

    // get workout data
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const type = inputType.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if workout is running
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if valid data
      if (
        !validInputs(distance, duration, cadence) ||
        !positiveInputs(distance, duration, cadence)
      )
        return alert('Inputs are wrong!');

      // create running object
      workout = new running(distance, duration, [lat, lng], cadence);
    }

    // if workout is cycling
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      console.log(elevation); // elevation can be zero
      // check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !positiveInputs(distance, duration)
      )
        return alert('Inputs are wrong!');

      // create cycling object
      workout = new cycling(distance, duration, [lat, lng], elevation);
    }

    // display the workout in the list
    this._renderWorkout(workout);
    // display workout marker on map
    this._renderWorkoutMarker(workout);

    // push the workout to the #workout array
    this.#workouts.push(workout);
    console.log(this.#workouts);

    // Hide form and input fields
    this._hideForm();

    // set all workouts to local storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWminWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.description}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
       <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(2)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;

    if (workout.type === 'cycling')
      html += `
         <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    if (!this.#map) return;

    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    console.log(workout);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    window.localStorage.setItem('workout', JSON.stringify(this.#workouts));
  }
  // can use both window.localStorage() or just localStorage()
  _getLocalStorage() {
    const data = JSON.parse(window.localStorage.getItem('workout'));
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => this._renderWorkout(work));
  }

  reset() {
    localStorage.clear();
    location.reload();
  }
}

const app = new App();

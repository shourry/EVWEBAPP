const stations = [
  { id: 1, name: 'Mumbai Metro Charge', city: 'Mumbai', distance: '1.2 km', availability: 'Available', price: '₹24/kWh', type: 'Fast' },
  { id: 2, name: 'Delhi Green Charger', city: 'New Delhi', distance: '2.8 km', availability: 'Busy', price: '₹22/kWh', type: 'Normal' },
  { id: 3, name: 'Bengaluru Rapid Hub', city: 'Bengaluru', distance: '3.3 km', availability: 'Available', price: '₹28/kWh', type: 'Ultra Fast' },
  { id: 4, name: 'Hyderabad EV Point', city: 'Hyderabad', distance: '7.1 km', availability: 'Available', price: '₹25/kWh', type: 'Fast' },
  { id: 5, name: 'Pune Charge Plaza', city: 'Pune', distance: '4.5 km', availability: 'Busy', price: '₹21/kWh', type: 'Normal' },
  { id: 6, name: 'Chennai Spark Station', city: 'Chennai', distance: '6.2 km', availability: 'Available', price: '₹27/kWh', type: 'Ultra Fast' }
];

const stationResults = document.getElementById('stationResults');
const stationSearchForm = document.getElementById('stationSearchForm');
const stationSearchInput = document.getElementById('stationSearch');
const bookingStation = document.getElementById('bookingStation');
const bookingForm = document.getElementById('bookingForm');
const bookingDate = document.getElementById('bookingDate');
const bookingTime = document.getElementById('bookingTime');
const vehicleType = document.getElementById('vehicleType');
const availabilityText = document.getElementById('availabilityText');
const upcomingList = document.getElementById('upcomingList');
const historyList = document.getElementById('historyList');
const confirmationModal = document.getElementById('confirmationModal');
const bookingSummary = document.getElementById('bookingSummary');
const modalMessage = document.getElementById('modalMessage');
const closeModal = document.getElementById('closeModal');
const modalOkBtn = document.getElementById('modalOkBtn');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authStatus = document.getElementById('authStatus');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const closeRegisterModal = document.getElementById('closeRegisterModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');

const STORAGE_KEY = 'evconnectBookings';

const getBookings = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveBookings = (bookings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

const getTodayISOString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AUTH_TOKEN_KEY = 'evconnectAuthToken';
const AUTH_USER_KEY = 'evconnectUser';

const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
const getStoredUser = () => {
  const data = localStorage.getItem(AUTH_USER_KEY);
  return data ? JSON.parse(data) : null;
};

const setAuthState = (user, token) => {
  if (user && token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    authStatus.textContent = `Hi, ${user.name}`;
    loginBtn.hidden = true;
    registerBtn.hidden = true;
    logoutBtn.hidden = false;
    return;
  }
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  authStatus.textContent = 'Guest';
  loginBtn.hidden = false;
  registerBtn.hidden = false;
  logoutBtn.hidden = true;
};

const openModal = (modal) => {
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
};

const closeAuthModal = (modal) => {
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
};

const apiRequest = async (path, options = {}) => {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errorData.message || 'Request failed');
  }
  return response.json();
};

const loadProfile = async () => {
  const currentUser = getStoredUser();
  if (currentUser && getStoredToken()) {
    setAuthState(currentUser, getStoredToken());
    return;
  }
  setAuthState(null);
};

const renderStationCards = (filterQuery = '', chargerType = 'All') => {
  const query = filterQuery.trim().toLowerCase();
  const filtered = stations.filter((station) => {
    const matchesQuery = station.name.toLowerCase().includes(query) || station.city.toLowerCase().includes(query);
    const matchesType = chargerType === 'All' || station.type === chargerType;
    return matchesQuery && matchesType;
  });

  stationResults.innerHTML = filtered.length
    ? filtered.map((station) => `
      <article class="station-card">
        <h3>${station.name}</h3>
        <div class="station-meta">
          <span>${station.city}</span>
          <span>${station.distance}</span>
          <span>${station.price}</span>
          <span>${station.type} Charger</span>
          <span class="status-chip" data-status="${station.availability}">${station.availability}</span>
        </div>
        <button class="btn btn-secondary" type="button" data-station="${station.id}">Book Now</button>
      </article>
    `).join('')
    : '<p>No stations match your search. Try another city or filter.</p>';
};

const renderBookingOptions = () => {
  bookingStation.innerHTML = stations.map((station) => `
      <option value="${station.id}">${station.name} — ${station.city}</option>
    `).join('');
};

const getAvailabilityMessage = () => {
  const stationId = Number(bookingStation.value);
  const station = stations.find((item) => item.id === stationId);
  if (!station) return 'Choose a station to see availability.';
  const selectedTime = bookingTime.value;
  const isBusyTime = selectedTime.endsWith('18:00') || station.availability === 'Busy';
  const status = isBusyTime ? 'Busy' : 'Available';
  availabilityText.innerHTML = `Status at ${selectedTime}: <strong>${status}</strong> — ${status === 'Available' ? 'Slot ready for booking.' : 'Please choose a different time.'}`;
  return status;
};

const renderBookings = () => {
  const bookings = getBookings();
  const now = new Date();
  const upcoming = bookings.filter((booking) => new Date(booking.date) >= now);
  const history = bookings.filter((booking) => new Date(booking.date) < now);

  upcomingList.innerHTML = upcoming.length
    ? upcoming.map((booking) => `
        <li>
          <strong>${booking.stationName}</strong> <span>${booking.date} · ${booking.timeSlot}</span>
          <p>${booking.vehicleType} · ID ${booking.confirmationId}</p>
          <button class="btn btn-secondary" data-cancel="${booking.confirmationId}">Cancel</button>
        </li>
      `).join('')
    : '<li>No upcoming bookings yet.</li>';

  historyList.innerHTML = history.length
    ? history.map((booking) => `
        <li>
          <strong>${booking.stationName}</strong> <span>${booking.date} · ${booking.timeSlot}</span>
          <p>${booking.vehicleType} · ID ${booking.confirmationId}</p>
        </li>
      `).join('')
    : '<li>No booking history.</li>';
};

const showModal = (booking) => {
  bookingSummary.innerHTML = `
    <li><strong>Station:</strong> ${booking.stationName}</li>
    <li><strong>Date:</strong> ${booking.date}</li>
    <li><strong>Time:</strong> ${booking.timeSlot}</li>
    <li><strong>Vehicle:</strong> ${booking.vehicleType}</li>
    <li><strong>Booking ID:</strong> ${booking.confirmationId}</li>
  `;
  modalMessage.textContent = 'Your slot is reserved successfully. See details below.';
  confirmationModal.classList.add('active');
  confirmationModal.setAttribute('aria-hidden', 'false');
};

const hideModal = () => {
  confirmationModal.classList.remove('active');
  confirmationModal.setAttribute('aria-hidden', 'true');
};

stationSearchForm.addEventListener('input', () => {
  const filterType = stationSearchForm.querySelector('input[name="chargerType"]:checked').value;
  renderStationCards(stationSearchInput.value, filterType);
});

stationSearchForm.addEventListener('change', () => {
  const filterType = stationSearchForm.querySelector('input[name="chargerType"]:checked').value;
  renderStationCards(stationSearchInput.value, filterType);
});

stationResults.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-station]');
  if (!button) return;
  const selectedId = button.getAttribute('data-station');
  bookingStation.value = selectedId;
  bookingStation.scrollIntoView({ behavior: 'smooth', block: 'center' });
  getAvailabilityMessage();
});

bookingDate.setAttribute('min', getTodayISOString());
bookingDate.value = getTodayISOString();

bookingStation.addEventListener('change', getAvailabilityMessage);
bookingTime.addEventListener('change', getAvailabilityMessage);

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!getStoredToken()) {
    openModal(loginModal);
    return;
  }
  const stationId = Number(bookingStation.value);
  const station = stations.find((item) => item.id === stationId);
  const selectedTime = getAvailabilityMessage();
  if (selectedTime === 'Busy') {
    availabilityText.innerHTML = '<strong>Busy slot:</strong> Please select an alternate time.';
    return;
  }

  const booking = {
    stationId,
    stationName: station.name,
    date: bookingDate.value,
    timeSlot: bookingTime.value,
    vehicleType: vehicleType.value,
    confirmationId: `EV-${Date.now().toString().slice(-8).toUpperCase()}`,
    createdAt: new Date().toISOString()
  };

  const bookings = getBookings();
  bookings.push(booking);
  saveBookings(bookings);
  renderBookings();
  showModal(booking);
  bookingForm.reset();
  bookingDate.value = getTodayISOString();
  bookingTime.value = '08:00 - 09:00';
  vehicleType.value = 'Sedan';
});

upcomingList.addEventListener('click', (event) => {
  const cancelButton = event.target.closest('button[data-cancel]');
  if (!cancelButton) return;
  const bookingId = cancelButton.getAttribute('data-cancel');
  const bookings = getBookings().filter((booking) => booking.confirmationId !== bookingId);
  saveBookings(bookings);
  renderBookings();
});

closeModal.addEventListener('click', hideModal);
modalOkBtn.addEventListener('click', hideModal);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && confirmationModal.classList.contains('active')) {
    hideModal();
  }
});

loginBtn.addEventListener('click', () => {
  openModal(loginModal);
});
registerBtn.addEventListener('click', () => {
  openModal(registerModal);
});

closeLoginModal.addEventListener('click', () => closeAuthModal(loginModal));
closeRegisterModal.addEventListener('click', () => closeAuthModal(registerModal));
showRegisterBtn.addEventListener('click', () => {
  closeAuthModal(loginModal);
  openModal(registerModal);
});
showLoginBtn.addEventListener('click', () => {
  closeAuthModal(registerModal);
  openModal(loginModal);
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const payload = Object.fromEntries(formData.entries());
  try {
    const response = await apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setAuthState(response.user, response.token);
    loginForm.reset();
    closeAuthModal(loginModal);
  } catch (error) {
    alert(error.message);
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  const payload = Object.fromEntries(formData.entries());
  if (payload.password.length < 6) {
    alert('Password should be at least 6 characters long.');
    return;
  }
  try {
    const response = await apiRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setAuthState(response.user, response.token);
    registerForm.reset();
    closeAuthModal(registerModal);
  } catch (error) {
    alert(error.message);
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch (error) {
    console.warn('Logout failed', error);
  }
  setAuthState(null);
});

const initialize = () => {
  renderStationCards();
  renderBookingOptions();
  renderBookings();
  getAvailabilityMessage();
  loadProfile();
};

initialize();

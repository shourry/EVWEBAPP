// Admin Dashboard JavaScript

// DOM Elements
const sidebar = document.querySelector('.admin-sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('pageTitle');
const logoutAdminBtn = document.getElementById('logoutAdminBtn');
const adminName = document.getElementById('adminName');
const adminEmail = document.getElementById('adminEmail');

// Stats Elements
const totalUsersEl = document.getElementById('totalUsers');
const totalBookingsEl = document.getElementById('totalBookings');
const totalStationsEl = document.getElementById('totalStations');
const usersChangeEl = document.getElementById('usersChange');
const bookingsChangeEl = document.getElementById('bookingsChange');

// Table Elements
const usersTableBody = document.getElementById('usersTableBody');
const bookingsTableBody = document.getElementById('bookingsTableBody');

// Search & Filter Elements
const userSearchInput = document.getElementById('userSearchInput');
const bookingFilterSelect = document.getElementById('bookingFilterSelect');

// Modal Elements
const deleteModal = document.getElementById('deleteModal');
const deleteMessage = document.getElementById('deleteMessage');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const userDetailsModal = document.getElementById('userDetailsModal');
const closeUserDetailsModal = document.getElementById('closeUserDetailsModal');
const userDetailsContent = document.getElementById('userDetailsContent');

// State
let currentUser = null;
let allUsers = [];
let allBookings = [];
let deleteAction = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Add admin class to body
  document.body.classList.add('admin');

  // Check authentication
  const token = localStorage.getItem('evconnectAuthToken');
  if (!token) {
    window.location.href = '/';
    return;
  }

  // Get current user
  try {
    const response = await fetch('/api/user', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Not authenticated');
    currentUser = await response.json();

    // Check if user is admin
    if (!currentUser.isAdmin) {
      alert('You do not have permission to access the admin dashboard');
      window.location.href = '/';
      return;
    }

    adminName.textContent = currentUser.name;
    adminEmail.textContent = currentUser.email;
  } catch (error) {
    console.error('Auth error:', error);
    localStorage.removeItem('evconnectAuthToken');
    window.location.href = '/';
    return;
  }

  // Setup event listeners
  setupEventListeners();

  // Load initial data
  await loadDashboardData();
  await loadUsers();
  await loadBookings();
});

function setupEventListeners() {
  // Sidebar toggle
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    sidebar.classList.toggle('open');
  });

  // Navigation
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      switchSection(section);
    });
  });

  // Logout
  logoutAdminBtn.addEventListener('click', () => {
    localStorage.removeItem('evconnectAuthToken');
    localStorage.removeItem('evconnectUser');
    window.location.href = '/';
  });

  // Search and filter
  userSearchInput.addEventListener('input', filterUsers);
  bookingFilterSelect.addEventListener('change', filterBookings);

  // Modal
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  closeUserDetailsModal.addEventListener('click', closeUserDetailsModals);
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });
  userDetailsModal.addEventListener('click', (e) => {
    if (e.target === userDetailsModal) closeUserDetailsModals();
  });
}

function switchSection(sectionName) {
  // Update active nav item
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.dataset.section === sectionName) {
      item.classList.add('active');
    }
  });

  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    users: 'Manage Users',
    bookings: 'Manage Bookings',
    stations: 'Manage Stations',
    settings: 'Settings'
  };
  pageTitle.textContent = titles[sectionName] || 'Dashboard';

  // Show active section
  contentSections.forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(`${sectionName}-section`).classList.add('active');

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('open');
  }
}

async function loadDashboardData() {
  try {
    const token = localStorage.getItem('evconnectAuthToken');

    // Get stats from server
    const response = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const stats = await response.json();
      totalUsersEl.textContent = stats.totalUsers || 0;
      totalBookingsEl.textContent = stats.totalBookings || 0;
      totalStationsEl.textContent = stats.totalStations || 6;
      usersChangeEl.textContent = `+${stats.newUsersThisMonth || 0} this month`;
      bookingsChangeEl.textContent = `+${stats.newBookingsThisMonth || 0} this month`;
    }

    // Load recent users
    await loadRecentUsers();

    // Load recent bookings
    await loadRecentBookings();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

async function loadRecentUsers() {
  try {
    const token = localStorage.getItem('evconnectAuthToken');
    const response = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const users = await response.json();
      const recentUsers = users.slice(-5).reverse();
      const recentUsersList = document.getElementById('recentUsersList');

      if (recentUsers.length === 0) {
        recentUsersList.innerHTML = '<p class="empty-message">No users yet</p>';
        return;
      }

      recentUsersList.innerHTML = recentUsers.map(user => `
        <div class="list-item">
          <p class="list-item-name">${user.name}</p>
          <p class="list-item-meta">${user.email} • ${new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading recent users:', error);
  }
}

async function loadRecentBookings() {
  try {
    const token = localStorage.getItem('evconnectAuthToken');
    const response = await fetch('/api/admin/bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const bookings = await response.json();
      const recentBookings = bookings.slice(-5).reverse();
      const recentBookingsList = document.getElementById('recentBookingsList');

      if (recentBookings.length === 0) {
        recentBookingsList.innerHTML = '<p class="empty-message">No bookings yet</p>';
        return;
      }

      recentBookingsList.innerHTML = recentBookings.map(booking => `
        <div class="list-item">
          <p class="list-item-name">${booking.station}</p>
          <p class="list-item-meta">${booking.date} at ${booking.time}</p>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading recent bookings:', error);
  }
}

async function loadUsers() {
  try {
    const token = localStorage.getItem('evconnectAuthToken');
    const response = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      allUsers = await response.json();
      renderUsersTable(allUsers);
    }
  } catch (error) {
    console.error('Error loading users:', error);
    usersTableBody.innerHTML = '<tr><td colspan="6" class="empty-message">Error loading users</td></tr>';
  }
}

function renderUsersTable(users) {
  if (users.length === 0) {
    usersTableBody.innerHTML = '<tr><td colspan="6" class="empty-message">No users found</td></tr>';
    return;
  }

  usersTableBody.innerHTML = users.map(user => `
    <tr>
      <td>${user.id}</td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td><span class="badge ${user.isAdmin ? 'badge-admin' : 'badge-user'}">${user.isAdmin ? 'Admin' : 'User'}</span></td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-small btn-outline" onclick="viewUserDetails('${user.id}')">View</button>
        <button class="btn btn-small btn-danger" onclick="deleteUser('${user.id}', '${user.name}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function filterUsers() {
  const searchTerm = userSearchInput.value.toLowerCase();
  const filtered = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm) ||
    user.email.toLowerCase().includes(searchTerm)
  );
  renderUsersTable(filtered);
}

async function loadBookings() {
  try {
    const token = localStorage.getItem('evconnectAuthToken');
    const response = await fetch('/api/admin/bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      allBookings = await response.json();
      renderBookingsTable(allBookings);
    }
  } catch (error) {
    console.error('Error loading bookings:', error);
    bookingsTableBody.innerHTML = '<tr><td colspan="6" class="empty-message">Error loading bookings</td></tr>';
  }
}

function renderBookingsTable(bookings) {
  if (bookings.length === 0) {
    bookingsTableBody.innerHTML = '<tr><td colspan="6" class="empty-message">No bookings found</td></tr>';
    return;
  }

  bookingsTableBody.innerHTML = bookings.map(booking => `
    <tr>
      <td>${booking.id || booking.bookingId || 'N/A'}</td>
      <td>${booking.userName || 'Unknown'}</td>
      <td>${booking.station}</td>
      <td>${booking.date} ${booking.time}</td>
      <td><span class="badge ${getBookingBadgeClass(booking.status)}">${booking.status || 'upcoming'}</span></td>
      <td>
        <button class="btn btn-small btn-outline" onclick="viewBookingDetails('${booking.id}')">View</button>
        <button class="btn btn-small btn-danger" onclick="deleteBooking('${booking.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function getBookingBadgeClass(status) {
  const statusMap = {
    'upcoming': 'badge-available',
    'completed': 'badge-completed',
    'cancelled': 'badge-cancelled'
  };
  return statusMap[status] || 'badge-available';
}

function filterBookings() {
  const filter = bookingFilterSelect.value;
  let filtered = allBookings;

  if (filter) {
    filtered = allBookings.filter(booking => booking.status === filter);
  }

  renderBookingsTable(filtered);
}

function viewUserDetails(userId) {
  const user = allUsers.find(u => u.id == userId);
  if (!user) return;

  userDetailsContent.innerHTML = `
    <div class="form-group">
      <label>ID</label>
      <input type="text" value="${user.id}" disabled>
    </div>
    <div class="form-group">
      <label>Name</label>
      <input type="text" value="${user.name}" disabled>
    </div>
    <div class="form-group">
      <label>Email</label>
      <input type="email" value="${user.email}" disabled>
    </div>
    <div class="form-group">
      <label>Role</label>
      <input type="text" value="${user.isAdmin ? 'Admin' : 'User'}" disabled>
    </div>
    <div class="form-group">
      <label>Created</label>
      <input type="text" value="${new Date(user.createdAt).toLocaleString()}" disabled>
    </div>
  `;

  userDetailsModal.style.display = 'flex';
  userDetailsModal.setAttribute('aria-hidden', 'false');
}

function closeUserDetailsModals() {
  userDetailsModal.style.display = 'none';
  userDetailsModal.setAttribute('aria-hidden', 'true');
}

function viewBookingDetails(bookingId) {
  const booking = allBookings.find(b => b.id === bookingId);
  if (!booking) return;

  userDetailsContent.innerHTML = `
    <div class="form-group">
      <label>Booking ID</label>
      <input type="text" value="${booking.id}" disabled>
    </div>
    <div class="form-group">
      <label>User</label>
      <input type="text" value="${booking.userName || 'Unknown'}" disabled>
    </div>
    <div class="form-group">
      <label>Station</label>
      <input type="text" value="${booking.station}" disabled>
    </div>
    <div class="form-group">
      <label>Date & Time</label>
      <input type="text" value="${booking.date} ${booking.time}" disabled>
    </div>
    <div class="form-group">
      <label>Vehicle Type</label>
      <input type="text" value="${booking.vehicleType || 'N/A'}" disabled>
    </div>
    <div class="form-group">
      <label>Status</label>
      <input type="text" value="${booking.status || 'upcoming'}" disabled>
    </div>
  `;

  userDetailsModal.style.display = 'flex';
  userDetailsModal.setAttribute('aria-hidden', 'false');
}

function deleteUser(userId, userName) {
  deleteMessage.textContent = `Are you sure you want to delete user "${userName}"? This action cannot be undone.`;
  deleteAction = async () => {
    try {
      const token = localStorage.getItem('evconnectAuthToken');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('User deleted successfully');
        await loadUsers();
        closeDeleteModal();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };
  openDeleteModal();
}

function deleteBooking(bookingId) {
  deleteMessage.textContent = 'Are you sure you want to delete this booking? This action cannot be undone.';
  deleteAction = async () => {
    try {
      const token = localStorage.getItem('evconnectAuthToken');
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Booking deleted successfully');
        await loadBookings();
        closeDeleteModal();
      } else {
        alert('Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Error deleting booking');
    }
  };
  openDeleteModal();
}

function openDeleteModal() {
  deleteModal.style.display = 'flex';
  deleteModal.setAttribute('aria-hidden', 'false');
  confirmDeleteBtn.onclick = () => {
    if (deleteAction) {
      deleteAction();
    }
  };
}

function closeDeleteModal() {
  deleteModal.style.display = 'none';
  deleteModal.setAttribute('aria-hidden', 'true');
  deleteAction = null;
}

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDeleteModal();
    closeUserDetailsModals();
  }
});

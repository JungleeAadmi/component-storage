// Format date to readable string
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(dateString);
}

// Get stock status color
export function getStockStatus(quantity, minQuantity) {
  if (quantity === 0) return 'empty';
  if (minQuantity > 0 && quantity <= minQuantity) return 'low';
  return 'normal';
}

// Get stock status badge class
export function getStockBadgeClass(quantity, minQuantity) {
  const status = getStockStatus(quantity, minQuantity);
  
  const classes = {
    empty: 'bg-red-500/20 text-red-400 border-red-500/30',
    low: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    normal: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  };
  
  return `${classes[status]} px-2 py-1 rounded text-xs font-medium border`;
}

// Get category badge class
export function getCategoryBadgeClass(category) {
  const colors = {
    resistors: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    capacitors: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    diodes: 'bg-red-500/20 text-red-400 border-red-500/30',
    transistors: 'bg-green-500/20 text-green-400 border-green-500/30',
    ics: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    leds: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    sensors: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    modules: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };
  
  const categoryLower = category?.toLowerCase() || 'other';
  return colors[categoryLower] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

// Generate tray address
export function generateTrayAddress(containerType, row, col, partition = null) {
  const letter = String.fromCharCode(65 + col); // A, B, C, ...
  const number = row + 1; // 1, 2, 3, ...
  
  if (containerType === 'type1_dual' && partition === 'bottom') {
    return `BIG-${number}${letter}`;
  }
  
  return `${number}${letter}`;
}

// Parse tray address
export function parseTrayAddress(address) {
  if (!address) return null;
  
  const isBig = address.startsWith('BIG-');
  const cleanAddress = address.replace('BIG-', '');
  
  const match = cleanAddress.match(/^(\d+)([A-Z])$/);
  if (!match) return null;
  
  return {
    row: parseInt(match[1]) - 1,
    col: match[2].charCodeAt(0) - 65,
    isBig,
  };
}

// Truncate text
export function truncate(text, length = 50) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Class names utility (like clsx)
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

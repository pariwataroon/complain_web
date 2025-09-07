// Utility functions for managing complaint edit state

/**
 * Mark a complaint as edited
 * @param {string} complaintId - The ID of the complaint that was edited
 */
export const markComplaintAsEdited = (complaintId) => {
  if (complaintId) {
    localStorage.setItem(`complaint_edited_${complaintId}`, Date.now().toString());
    console.log(`Marked complaint ${complaintId} as edited`);
  }
};

/**
 * Check if a complaint was recently edited
 * @param {string} complaintId - The ID of the complaint to check
 * @returns {boolean} True if the complaint was recently edited
 */
export const wasComplaintRecentlyEdited = (complaintId) => {
  if (!complaintId) return false;
  
  const editTime = localStorage.getItem(`complaint_edited_${complaintId}`);
  if (!editTime) return false;
  
  // Check if edited within the last 5 minutes
  const timeDiff = Date.now() - parseInt(editTime);
  return timeDiff < 5 * 60 * 1000; // 5 minutes
};

/**
 * Clear the edited flag for a complaint
 * @param {string} complaintId - The ID of the complaint to clear
 */
export const clearComplaintEditFlag = (complaintId) => {
  if (complaintId) {
    localStorage.removeItem(`complaint_edited_${complaintId}`);
    console.log(`Cleared edit flag for complaint ${complaintId}`);
  }
};

/**
 * Mark multiple complaints as needing refresh (for list views)
 */
export const markComplaintsListForRefresh = () => {
  localStorage.setItem('complaints_list_needs_refresh', Date.now().toString());
};

/**
 * Check if complaints list needs refresh
 */
export const doesComplaintsListNeedRefresh = () => {
  const refreshFlag = localStorage.getItem('complaints_list_needs_refresh');
  if (!refreshFlag) return false;
  
  // Auto-clear flag after checking
  localStorage.removeItem('complaints_list_needs_refresh');
  return true;
};

export default {
  markComplaintAsEdited,
  wasComplaintRecentlyEdited,
  clearComplaintEditFlag,
  markComplaintsListForRefresh,
  doesComplaintsListNeedRefresh,
};
